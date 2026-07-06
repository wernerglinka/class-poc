# Operating and Maintaining the Google Backend

A reference for the Google side of the Center for People and Crafts class pages system, written for someone who knows HTML and JavaScript but has not worked with Google Apps Script.

## The big picture

The Google backend consists of four pieces. A Google Form is the intake: class owners fill it out and each submission becomes a row in a Google Sheet. The Sheet is the editable store: once a row exists, all corrections happen there, because Form responses cannot be edited after submission. An Apps Script project attached to the Sheet provides the machinery around it: the review sidebar, the ID-stamping trigger, and eventually the web app endpoints for live availability reads and volunteer signup writes. Finally, the Metalsmith build fetches the Sheet's data at build time to generate the static pages.

Everything you maintain lives in two places: the Sheet itself (data, column headers) and the Apps Script project (code). Nothing else on the Google side has state.

## Apps Script for a JavaScript developer

Apps Script is server-side JavaScript that runs on Google's infrastructure. The runtime is V8, the same engine as Node and Chrome, so modern syntax works: arrow functions, template literals, destructuring, `const` and `let`, spread. What you know about the language transfers directly.

The differences from Node are structural, not syntactic. There is no `npm`, no `require`, no `import`. Instead, Google injects global service objects: `SpreadsheetApp` for sheets, `HtmlService` for serving HTML, `LockService` for concurrency, `UrlFetchApp` for outbound HTTP, `Logger` and `console` for logging. These are always available; you never install or import them.

There is also no module system between your own files. Every `.gs` file in a project shares one global namespace, as if all files were concatenated. A function defined in one file is callable from any other. This means two files cannot both define a function named `onOpen`, which matters when you merge scripts (more on that under Failure modes).

Scripts do not run continuously. There is no server process sitting around. Every execution is a cold start triggered by an event: a user opening the Sheet, a form submission, a click in the sidebar, an HTTP request to a web app URL. The function runs, finishes, and the environment is gone. Any state that must survive between executions lives in the Sheet itself (or in `PropertiesService`, a simple key-value store, if you ever need one).

One quirk worth internalizing early: an execution has a hard time limit, 6 minutes for consumer accounts. None of our functions come anywhere near it, but if you ever write a bulk operation over thousands of rows, batch your reads and writes (`getValues` on a whole range, one `setValues` back) rather than touching cells one at a time. Individual cell operations cross the JavaScript-to-Google boundary each time and are slow.

## The script project

Our script is a *bound* script: it is attached to the specific spreadsheet and travels with it. You reach it from the Sheet via **Extensions → Apps Script**. Being bound is what grants it the conveniences we rely on: `SpreadsheetApp.getActiveSpreadsheet()` resolves to this Sheet without any ID, `getUi()` can add menus and sidebars to it, and simple triggers like `onOpen` fire automatically.

The editor shows a file list on the left. Script files end in `.gs` and hold server-side code. HTML files hold anything served to the browser. Our project has two files. `Code.gs` contains the menu setup, the sidebar launcher, and the functions that read and write rows. `ReviewSidebar.html` contains the sidebar UI, a self-contained page with its own CSS and client-side JavaScript.

To add a file, click the **+** next to "Files" and pick Script or HTML. To edit, just type; **Ctrl/Cmd-S** saves. Saving makes code live immediately for everything except deployed web apps, which are versioned separately (covered below). The editor keeps a basic version history under the project settings, but it is no substitute for real source control; see the clasp section.

The script has an owner, the Google account that created it. If you set this up under your own account and later hand the organization off, transfer ownership of the spreadsheet (the bound script follows it) so triggers and deployments do not die with a deactivated account.

## How the browser talks to the server: google.script.run

This is the one genuinely new API you need, and it is the backbone of the sidebar. Inside any HTML you serve with `HtmlService`, the global `google.script.run` object exposes every function in your `.gs` files as an asynchronous remote call:

```js
google.script.run
  .withSuccessHandler( handleResult )
  .withFailureHandler( handleError )
  .getActiveRowRecord();
```

This invokes the server-side `getActiveRowRecord` function and passes its return value to `handleResult`. It is callback-based, not Promise-based, which is why the sidebar's polling loop chains `setTimeout` from inside the handlers instead of using `async/await`. Arguments and return values must be JSON-serializable: plain objects, arrays, strings, numbers, booleans. You cannot pass a Date object or a Range; convert to strings or plain data first, which is why our server functions return plain records.

The HTML page itself runs in a sandboxed iframe inside the Sheet. Normal DOM APIs work as you expect. External libraries can be loaded from CDNs if ever needed, though the sidebar deliberately uses none.

## Authorization

The first time anyone runs a function that touches protected resources (reading the Sheet counts), Google shows an authorization prompt listing the permissions the script wants. The scopes are inferred automatically from the services your code calls; you do not declare them.

For a personal or small-organization script that has not gone through Google's verification process, the prompt includes a scary interstitial: "Google hasn't verified this app." This is expected. Click **Advanced**, then **Go to (project name) (unsafe)**, and approve. "Unsafe" here means unverified by Google's review program, not malicious; you wrote the code.

Two operational consequences. First, authorization is per-user: every person who uses the sidebar or whose account fires a trigger must authorize once. A reviewer opening the sidebar for the first time will see the prompt; warn them so they are not startled. Second, if you later edit the code to call a new service (say, adding `MailApp` to send notifications), the required scopes change and everyone gets re-prompted on next use. That is normal, not a sign something broke.

## Triggers

Triggers are how code runs without someone clicking a button. There are two kinds, and the distinction matters.

*Simple triggers* are functions with magic names that Apps Script calls automatically. `onOpen(e)` runs when the spreadsheet is opened; that is how the "Review" menu appears. `onEdit(e)` runs on any cell edit. Simple triggers require no setup, but they run with limited authorization and cannot do anything requiring explicit user permission beyond the container itself.

*Installable triggers* are registered explicitly and run with the full authority of the account that installed them. The form-submit ID stamping must be an installable trigger, because simple triggers do not include a form-submit variant with full permissions and because you want it to run regardless of who submitted the form.

To install one: in the Apps Script editor, click the clock icon in the left rail (**Triggers**), then **Add Trigger**. Choose the function to run (e.g. `stampOfferingId`), event source **From spreadsheet**, event type **On form submit**. Save and authorize. From then on, every form submission fires the function, which receives an event object whose `e.range` points at the freshly inserted row, letting the function write a stable unique ID into that row's ID column.

Installable triggers belong to the account that created them. If that account loses access to the Sheet, the trigger silently stops. Check the Triggers page if IDs stop appearing on new submissions.

## The review sidebar

### Operating it

Open the Sheet, wait for the **Review** menu to appear (a few seconds after load), and choose **Open row viewer**. The sidebar shows whatever row the selection is on, with each column as a labeled, editable text box. Click any cell in a row to load that row. Edit text directly in the sidebar; a Save/Discard bar appears once anything differs from the sheet. **Save** writes only the changed cells back and refreshes the display with the sheet's actual formatted values. **Discard** reverts. Fields computed by formulas are shown read-only with a note.

Two protective behaviors are intentional. While unsaved edits exist, the sidebar stops following the selection, so clicking around cannot wipe work in progress. And a failed save leaves the edits in the boxes with an error message rather than losing them.

### How it works

`Code.gs` exposes two functions to the sidebar. `getActiveRowRecord()` reads the header row and the selected row, and returns them as an array of `{label, value, columnNumber, isFormula}` objects using *display* values, so dates and fees read exactly as formatted in the sheet. `updateRowFields(sheetName, rowNumber, edits)` writes an array of `{columnNumber, value}` pairs back and returns the refreshed record.

`ReviewSidebar.html` polls `getActiveRowRecord` once per second via `google.script.run`. It fingerprints each response with `JSON.stringify` and only re-renders when the content actually changed, so the sidebar is quiet while a reviewer reads. Dirty tracking compares each textarea against the original value stored in a `data-` attribute.

### Maintaining it

The sidebar is schema-free by design. Field labels come from the header row at read time, so adding, removing, renaming, or reordering columns requires no code changes; the sidebar simply reflects whatever the sheet has. The one constant is `HEADER_ROW_NUMBER` at the top of `Code.gs`; if the headers ever move off row 1, change that.

Because `setValue` re-parses input the way typing into a cell does, a reviewer entering "3/5/2026" into a date-formatted column gets a real date, which is what you want. The refresh-after-save exists precisely so the reviewer sees the sheet's interpretation immediately.

## The web app (availability reads and signup writes)

This piece has its own lifecycle, different from everything above, and it is where most Apps Script confusion lives.

Any project can be deployed as a *web app*, which gives it a public URL. HTTP GET requests to that URL invoke a function named `doGet(e)`; POSTs invoke `doPost(e)`. Ours will serve live availability from `doGet` and accept volunteer signups in `doPost`, with `LockService` inside `doPost` wrapping the read-check-write so two simultaneous signups cannot double-book the last host slot.

### Deployments and versions

Saving code in the editor does **not** update a deployed web app. Deployments point at immutable numbered versions. The workflow:

To deploy the first time: **Deploy → New deployment**, gear icon → type **Web app**. Set "Execute as" to **Me** (requests run under your authority, so anonymous visitors can trigger sheet writes) and "Who has access" to **Anyone** (the site's JavaScript calls it without a Google login). Deploy, authorize, and copy the URL ending in `/exec`. That URL goes into the site's config.

To ship a code change: **Deploy → Manage deployments**, pencil icon on the existing deployment, set Version to **New version**, deploy. This keeps the same `/exec` URL, which is essential; creating a *new* deployment instead would mint a new URL and silently orphan the one the website uses.

For testing during development, **Deploy → Test deployments** gives a `/dev` URL that always runs the latest saved code, no versioning needed. It only works for your logged-in account, so it is for your testing, not for the site.

### Browser-to-web-app requests

Two practical constraints when the site's JavaScript calls these endpoints. Apps Script responds through a redirect, so use `fetch` with default redirect following. And Apps Script cannot set custom CORS headers; a cross-origin POST works as long as the request avoids a preflight, which in practice means sending the body as `Content-Type: text/plain` containing JSON and parsing it manually in `doPost` via `JSON.parse(e.postData.contents)`. Responses built with `ContentService.createTextOutput(...).setMimeType(ContentService.MimeType.JSON)` are readable cross-origin.

## Logging and debugging

`console.log()` works in server-side code and its output lands in the execution log. For a quick check, run a function directly from the editor toolbar (select it in the dropdown, click **Run**) and watch the log pane at the bottom.

The more useful tool for a live system is the **Executions** page (the list icon in the editor's left rail). It records every execution from every source: menu clicks, sidebar calls, trigger firings, web app requests, with status, duration, and logs for each. When something misbehaves, this page tells you whether the function ran at all, and if it ran, what it logged and how it failed. Trigger failures also generate email notifications to the trigger's owner by default.

Client-side sidebar code debugs like any web page: right-click inside the sidebar, Inspect, and use the browser console. Errors from `google.script.run` arrive in the failure handler with a `message` property; the sidebar surfaces these in the save bar.

## Quotas

Consumer Google accounts get generous but finite daily quotas: roughly 90 minutes of total trigger runtime per day, 20,000 URL fetch calls, and a cap of 30 simultaneous executions per user. For this project's traffic (a form submission every so often, a reviewer session, occasional signup writes), you will never approach any of them. The only scenario worth a thought is a build fetching the Sheet very frequently plus heavy runtime polling from many concurrent site visitors; if availability polling ever becomes chatty, cache the `doGet` response on the client or lengthen the poll interval. Current numbers live at the Apps Script quotas documentation page; they change occasionally.

## Source control (optional but recommended)

The Apps Script editor is a black box to git. Google's `clasp` command-line tool bridges it: `npm install -g @google/clasp`, `clasp login`, then `clasp clone <scriptId>` (the script ID is in the project settings) pulls the files into a local directory that you can commit like any repo. `clasp push` uploads local changes; `clasp pull` fetches remote ones. HTML files come down as `.html`, script files as `.js` locally, mapped to `.gs` on push. For a two-file project this is optional, but once the web app and trigger code join, having the backend in the same git workflow as the Metalsmith site is worth the small setup.

## Failure modes and what to check

**The Review menu never appears.** `onOpen` failed or was never authorized. Open Extensions → Apps Script, run `onOpen` manually once from the toolbar, and complete the authorization prompt. Also check that no other file in the project defines a second `onOpen`; two definitions in the shared global namespace means the last-loaded one wins and the other silently never runs. If you ever need both a menu and something else at open time, merge them into one `onOpen`.

**Sidebar shows "Loading…" forever.** Open the browser console inside the sidebar for client errors, and the Executions page for server errors. The usual cause is an authorization prompt that was dismissed; reload the Sheet and reopen the sidebar.

**New form submissions have no ID.** The installable onFormSubmit trigger is gone or erroring. Check the Triggers page for its existence and the Executions page for red entries. Re-create it if the owning account changed.

**The website's availability or signup calls fail after a code change.** Almost always a deployment mistake: the code was saved but never deployed as a new version, or a new deployment was created and the site still points at the old URL. Manage deployments → confirm the active deployment's version, and confirm the `/exec` URL matches the site config.

**Reviewer edits a cell and a formula elsewhere breaks.** The sidebar refuses to edit formula cells, but it cannot know that a plain text cell feeds someone's formula by reference. That is a data-design question, not a sidebar bug: keep computed columns clearly separated from intake columns.

**Everything re-prompts for permissions out of nowhere.** Scopes changed because the code now touches a new service, or Google expired the grants (they do this for unverified apps after long inactivity, and on some accounts weekly). Re-authorize; nothing is wrong.
