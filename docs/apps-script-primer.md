# Apps Script Primer for This Project

Google Apps Script for someone who knows HTML and JavaScript but has not worked with Google's scripting platform. This explains the mechanics and the why; the step-by-step procedures live in `cpc-google-howto.md`, and the system design rationale in `theory-of-operation.md`.

## The two script projects

This system uses two separate Apps Script projects, and the distinction between them is the single most important Apps Script concept for maintaining it.

A *standalone* project lives on its own at https://script.google.com, unattached to any document. Our intake project (`cpc-class-intake-prototype.gs` plus `cpc-web-app.gs`) is standalone: it has to be, because it *creates* the form and spreadsheet rather than living inside them. It reaches the spreadsheet by stored ID, and it can be deployed as a web app.

A *bound* project is attached to one specific document and travels with it. You create one by opening the document and choosing Extensions > Apps Script. Our review sidebar is bound to the spreadsheet, because the things it needs are only available to bound scripts: the `onOpen` trigger that adds the Review menu, and `SpreadsheetApp.getUi()`, which is the only way to show menus and sidebars in a spreadsheet. A bound script also gets `SpreadsheetApp.getActiveSpreadsheet()` and the user's current selection for free.

The practical consequences: code that shows UI in the spreadsheet must go in the bound project; code that serves HTTP or builds documents goes in the standalone one. And since a bound script belongs to its document, trashing the spreadsheet (as a full rebuild does) takes the sidebar script with it.

## The language and runtime

Apps Script is server-side JavaScript on V8, the same engine as Node and Chrome. Modern syntax works: arrow functions, template literals, destructuring, `const`, spread. What you know about the language transfers directly.

The differences are structural. There is no `npm`, no `require`, no `import`. Google injects global service objects instead: `SpreadsheetApp`, `FormApp`, `HtmlService`, `LockService`, `PropertiesService`, `ScriptApp`, `UrlFetchApp`, `Utilities`, and `console`. They are always available, never installed.

There is no module system between your own files either. Every `.gs` file in a project shares one global namespace, as if concatenated. That is why `cpc-web-app.gs` can call helpers and read constants defined in `cpc-class-intake-prototype.gs` with no imports, and why the two files must not define functions with the same name.

Scripts do not run continuously. There is no server process. Every execution is a cold start caused by an event: someone opens the spreadsheet, submits the form, clicks Save in the sidebar, or hits the web app URL. The function runs, returns, and the environment is gone. State that must survive between executions lives in the spreadsheet or in Script Properties.

Two performance rules follow from the architecture. Executions have a hard time limit (6 minutes on consumer accounts), and every call that crosses into a Google service is a slow network hop. So batch: read a whole range with one `getValues`/`getDisplayValues`, write with one `setValues`, rather than looping over cells. The project's code already works this way; keep new code in the same style.

## Script Properties

`PropertiesService.getScriptProperties()` is a key-value store scoped to the project, the Apps Script equivalent of environment variables. This project keeps three things there: the IDs of the created form and spreadsheet (written by `buildPrototype`, read by everything else), the `buildToken` that gates the full-data GET, and the `volunteerCode` that gates signups. You can view and edit them in the editor under Project Settings (gear icon) > Script Properties, which is how the volunteer code gets rotated without touching code.

## Triggers

Triggers are how code runs without a button click. There are two kinds.

*Simple triggers* are functions with magic names that run automatically but with restricted powers. The sidebar project uses one: its `onOpen` runs whenever the spreadsheet opens and adds the Review menu. Simple triggers only exist in bound scripts, which is half the reason the sidebar must be bound.

*Installable triggers* are registered explicitly and run with the full authority of the account that installed them. The intake project's `handleFormSubmit` is one; `buildPrototype` registers it programmatically with `ScriptApp.newTrigger(...).forSpreadsheet(...).onFormSubmit().create()`. You can see, delete, and manually add installable triggers on the Triggers page (clock icon in the editor's left rail).

Installable triggers belong to the account that created them and keep working only while that account can reach the target. Stale triggers pointing at trashed spreadsheets fail silently, which is why the rebuild procedure in the howto deletes triggers first. If IDs stop appearing on new submissions, the Triggers and Executions pages are where to look.

## How the sidebar's browser code talks to the server

Inside any HTML served with `HtmlService`, the global `google.script.run` object exposes every server-side function as an asynchronous remote call:

```js
google.script.run
  .withSuccessHandler( handleResult )
  .withFailureHandler( handleError )
  .getActiveRowRecord();
```

It is callback-based, not Promise-based, which is why the sidebar chains its polling with `setTimeout` from inside the handlers instead of `async/await`. Arguments and return values must be JSON-serializable plain data; you cannot pass a Date or a Range across the boundary, which is why the server functions return plain records of strings and numbers.

The sidebar page runs in a sandboxed iframe inside the Sheet. Normal DOM APIs work as expected, and you debug it like any web page: right-click inside the sidebar, Inspect, browser console.

## The web app: how deployment actually works

Any project can be deployed as a web app, giving it a public URL. GET requests invoke `doGet(e)`, POSTs invoke `doPost(e)`. Ours serves the build payload and public availability from `doGet` and accepts signups in `doPost`, with `LockService` wrapping the read-check-write so two simultaneous signups cannot claim the same slot.

The part that trips people up: saving code in the editor does **not** update a deployed web app. Deployments point at immutable numbered versions. Shipping a change means Deploy > Manage deployments > pencil > Version: New version, which keeps the `/exec` URL stable. Creating a *new* deployment instead mints a different URL and silently orphans the one in the site's build config. For development there is also a `/dev` URL under Test deployments that always runs the latest saved code, but it only works for the script owner's logged-in browser.

The two deployment settings matter. "Execute as: Me" makes every request run under the owning account's authority, which is what lets anonymous site visitors cause spreadsheet writes without the spreadsheet ever being shared. "Who has access: Anyone" is required for cross-origin fetches from the website; the "Anyone with Google account" setting redirects to a login page that breaks CORS in a particularly confusing way (documented, with the fix, in the howto).

CORS specifics, the text/plain POST trick, and the endpoint reference are in the howto and in the header comment of `cpc-web-app.gs`; `docs/signup-test.html` is the working reference client.

## Authorization

The first time a function touches protected resources, Google shows an OAuth prompt listing the permissions the script wants. Scopes are inferred from the services the code calls; nothing is declared. For an unverified personal script the prompt includes the "Google hasn't verified this app" interstitial; Advanced > Go to project continues. This is expected, not a problem.

Authorization is per-user and per-project. Every reviewer using the sidebar authorizes the sidebar project once; the intake project is authorized by the dev account that runs `buildPrototype` and owns the deployment. If code changes later require new scopes (say, adding `MailApp`), everyone is re-prompted on next use. Google also expires grants for unverified apps after long inactivity, so an occasional surprise re-prompt is normal.

## Debugging

The **Executions** page (list icon in the editor's left rail) is the primary tool. It records every run from every source: trigger firings, sidebar calls, web app requests, manual runs, each with status, duration, and log output. When something misbehaves, it answers the first question, whether the code ran at all, and usually the second, what it said before failing.

`console.log()` output lands there. For quick checks, select a function in the editor toolbar's dropdown and click Run; the log pane opens below. Failed installable triggers also email their owner by default. Client-side sidebar problems show up in the browser console, and errors from `google.script.run` arrive in the failure handler with a `message` property, which the sidebar surfaces in its save bar.

## Quotas

Consumer accounts get roughly 90 minutes of total trigger runtime per day, 20,000 `UrlFetchApp` calls, and a cap of 30 simultaneous executions. This project's traffic does not approach any of these. The only conceivable pressure point is the public availability GET if many visitors poll at once; if that ever becomes chatty, lengthen the poll interval or cache client-side. Current numbers are on Google's Apps Script quotas page; they change occasionally.

## Source control

The repo's `google-scripts/` directory is the source of truth, and code reaches Google by pasting. That is workable at this size but easy to let drift. Google's `clasp` CLI closes the gap when wanted: `npm install -g @google/clasp`, `clasp login`, `clasp clone <scriptId>` (the ID is in Project Settings), then `clasp push` and `clasp pull` sync the project with a local directory you commit like anything else. Note that each Apps Script project maps to its own clasp directory, so the standalone project and the bound sidebar project would be two clones. Whichever way, treat the editor as a deploy target, not as the place where code lives.
