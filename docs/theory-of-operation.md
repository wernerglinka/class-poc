# CPC Class System: Theory of Operation

This document explains how the Center for People and Craft class system works and why it works that way. The companion `cpc-google-howto.md` covers hands-on procedures; this one covers the reasoning. Read this when you return to the project after months away and need to reload the mental model.

## Purpose and constraints

CPC is an all-volunteer nonprofit that offers craft classes to the public. The current Squarespace site requires one person to hand-edit every class page. The goal of this system is to reduce website administration to near zero: class owners describe their own classes through a form, the website builds itself from that data, and volunteers sign themselves up to host sessions.

Three constraints shape everything. First, there is no budget and no staff, so anything that requires a server, a database, or ongoing paid services is out. Second, the people entering class data are craft instructors, not technical users, so the intake surface must be a plain form with no room for structural mistakes. Third, student registration and payment are already handled by Givebutter, a dedicated ticketing platform, so this system deliberately does none of that.

That third point is what makes a fully static site possible. Because Givebutter owns payments, registration, and student seat counts, the website needs no accounts, no login, and no database. The only dynamic behavior the site needs is volunteer host signup, and that is small enough to run on Google's free Apps Script infrastructure.

## The parts

The system has five components. A Google Form is the intake surface where class owners submit offerings. A Google Spreadsheet is the single source of truth for class data. An Apps Script project (two files, both in the site repo) provides the automation: one file builds the form and spreadsheet and normalizes form submissions, the other exposes the data as a small HTTP API. The Metalsmith static site consumes that API at build time to generate class pages. Givebutter, entirely external, handles student registration; each offering row carries a registration URL (the `registrationUrl` column, today a Givebutter link) so class pages can link to the right registration flow.

Two boundaries are worth internalizing because they prevent whole categories of bugs. Givebutter and the spreadsheet never overlap: Givebutter owns student capacity, the spreadsheet owns only volunteer hosting. Duplicating state across systems is how data drifts, so neither system knows the other exists beyond a URL. Similarly, org-wide boilerplate (the accessibility statement, cancellation policy, location directions, scholarship link) lives in the site repo as config, never in spreadsheet cells. It is identical on every class page, and prose repeated in data cells eventually diverges.

## The data model

The vocabulary matters. A *class* is a conceptual offering like "Staked Side Table." An *offering* is a scheduled instance of a class: "Staked Side Table, Wednesday group, starting July 15." A *session* is one dated meeting of an offering; a three-Wednesday offering has three sessions. A class owner submits one form response per offering. Volunteers host individual sessions.

The spreadsheet has three tabs. **Form Responses 1** is Google's raw capture of each submission, untouched and unread by anything downstream; it exists as an audit trail. **Offerings** holds one row per offering: all prose (summary, description, what to expect), fees, age and ability requirements, instructor info, image URLs, the Givebutter link, and submitter contact. **Sessions** holds one row per dated session: the date, start and end times, and three host columns (`hostName`, `hostEmail`, `signedUpAt`) that begin empty. An empty `hostName` means the hosting slot is open. Each session needs exactly one host, which is why host state lives directly on the session row rather than in a join table.

The split between Offerings and Sessions exists because the two have different shapes and different consumers. Prose belongs to the offering; repeating a 500-character description across three session rows invites divergence when someone edits one copy. Sessions are what volunteers interact with, so they carry exactly the signup state and nothing else.

Every offering gets a stable, human-readable ID at submission time: the slugified title plus the first session date, like `staked-side-table-wednesday-group-20260715`. Sessions append a sequence suffix: `-s1`, `-s2`, `-s3`. Google Forms does not generate stable IDs, so the submission trigger stamps them. If two offerings would collide (the same class title starting the same day, or an accidental resubmission), the trigger appends `-2`, `-3` and so on. These IDs are referenced by generated pages and by volunteer signups, so they must never change once a class page is live.

The spreadsheet, not the form, is the editable store. Google Forms responses cannot be edited after submission, so every correction happens directly in the Offerings or Sessions tabs. Resubmitting the form to fix a typo creates a duplicate offering; the `-2` suffix makes the duplicate visible rather than silent, but the right move is always to edit the sheet.

Dates and times in Sessions are stored as plain text, `2026-07-15` and `18:00`, and this is enforced: the trigger formats each row as plain text before writing values, because Sheets otherwise coerces such strings into locale-dependent date and time cells. Coerced cells read back as `7/15/2026` and `6:00:00 PM`, which downstream code would have to re-parse with locale guesswork. Text in, text out keeps every consumer trivial.

## Flow one: class intake

A class owner opens the published form and describes one offering. Multi-session offerings are one submission; the form offers six date pickers (session 1 required, 2 through 6 optional) because Forms has no repeatable field. Dates and times use native picker widgets so nothing can be mistyped, and numeric fields validate as numbers. Images travel outside the pipeline: instructors email image files to the webmaster and enter only the file names in the form. The webmaster commits the files to the repo under `/assets/images/classes/<imageFolder>/`, where `imageFolder` is a sheet column the trigger auto-fills from the class title and the webmaster edits when needed. (An earlier design used the Givebutter campaign slug as the canonical folder name; field experience showed those slugs are non-unique because campaigns get copied casually, so the folder name now lives under webmaster control in the sheet.) The build resolves file names against that folder and warns about, then omits, any image that has not arrived. This is a deliberate human relay; upload questions would force Google sign-in on instructors, and automated Drive plumbing is complexity the org cannot maintain.

Submission triggers `handleFormSubmit` (an installable trigger on the spreadsheet). The trigger normalizes picker output, which arrives as locale-formatted strings, into ISO dates and 24-hour times; assembles the unique offering ID; writes one Offerings row; and writes one Sessions row per filled date picker with empty host columns and status `open`. If no date parses, the offering lands with status `needs-review` and no session rows, flagging it for human repair in the sheet.

Every submission then waits for moderation. The form URL is public, so anyone can submit anything; the `approved` column on the Offerings row arrives empty, and the web app refuses to serve unapproved offerings in any payload, build or public. An admin reviews the submission in the sheet and types `yes` to publish it. Optionally, the trigger emails an admin on each submission (set `ADMIN_NOTIFICATION_EMAIL` in the intake script), so review does not depend on someone remembering to check the sheet. Approval is a publication gate, separate from `status`: a full or cancelled class is still approved, it just renders differently.

## Flow two: site build

At build time, two local Metalsmith plugins do the work. `metalsmith-cpc-classes` fetches the web app URL with the build token (`?token=...`); the web app, running under the owning Google account's authority, reads the private spreadsheet and returns every approved offering with its sessions nested inside (volunteer emails excluded even here). The plugin validates the payload, sorts offerings by first session date, and attaches them to global metadata; in watch mode it caches the response for a few minutes so file-save rebuilds stay fast.

`metalsmith-cpc-class-pages` then generates one virtual page per offering in the starter's structured-content format: a `sections` array (hero, description, details, Givebutter registration embed, interactive session list, org boilerplate from `lib/data/cpc.json`, one instructor block per instructor — instructor 1 uses the unnumbered sheet fields, the second the `instructor2Name` style set; the scheme extends to `instructor3Name` if the form ever grows) rendered by the same component library as every hand-written page, inside the same page chrome. It also stamps a `card` object per page, which `@metalsmith/collections` and the pagination plugin turn into the classes landing page (`src/classes.md`, an ordinary editable page with a `collection-list` section). Image file names from the sheet resolve against `/assets/images/classes/<imageFolder>/` (the sheet column, falling back to the slugified class title for rows predating it); a named file missing from the repo produces a build warning and a page without that image, never a broken reference.

The site therefore reflects the spreadsheet as of the last build. New offerings appear on the next build, which can be triggered manually, on a schedule, or by webhook, and that staleness is acceptable because class schedules change slowly. Host signups are the one thing that cannot wait for a rebuild, which is flow three.

## Flow three: live host display and signup

When a visitor loads a class page, page JavaScript fetches the same web app URL without a token. The tokenless response is deliberately minimal: sessionId and a hosted yes/no flag, nothing else. The page shows a quiet "(host needed)" link on open sessions and nothing at all on hosted ones. Volunteer names are never displayed anywhere on the site; some hosts prefer not to be listed, so nobody is.

When a volunteer clicks "(host needed)" a signup dialog opens asking for name, email, and the current volunteer code; the page POSTs JSON (`sessionId`, `hostName`, `hostEmail`, `volunteerCode`) to the same URL. The web app validates the input, takes a script-wide lock, re-reads the target row, and writes the host columns only if `hostName` is still empty. The lock plus re-check closes the race where two volunteers claim the same session in the same moment: both requests serialize, the first wins, the second receives `{"ok": false, "error": "taken"}` and the page tells that volunteer the slot just filled.

One implementation detail worth remembering: the POST must use content type `text/plain;charset=utf-8`. Apps Script cannot answer CORS preflight requests, and a `text/plain` POST is a "simple" request that browsers send without preflight. An `application/json` POST fails silently at the CORS layer.

## Security model

The spreadsheet is shared with no one and has no public link of any kind. All access flows through the web app, deployed with "Execute as: Me" and "Who has access: Anyone." Those settings mean the endpoint is publicly reachable but executes with the owner's permissions against a private sheet, and the code alone decides what any caller can see or do.

Read access is tiered by a token, a random UUID held in Script Properties (server side) and in the site build's environment variable (client side). With the token: full class data, no volunteer emails. Without: sessionId and a hosted flag only, no names. The token is a shared secret over HTTPS, which is proportionate protection for data that is mostly public anyway; the only genuinely private data, volunteer emails, never leaves the spreadsheet through any endpoint.

Write access is gated by a shared volunteer code rather than the build token, because volunteers are ordinary people without secrets management. The current code lives in the `volunteerCode` Script Property, is checked server side on every signup (case-insensitively), and is communicated through the volunteer email list, the same trusted channel that recruits hosts. Rotating it means editing one property value and mentioning the new code in the next email; no deployment changes. If the code leaks anyway, the damage scope is unchanged and small: the only possible write is filling the three host columns of one currently-empty session row with validated values, which is visible in the sheet and reversible by clearing three cells.

Nothing secret lives in code. The token, spreadsheet ID, and form ID all sit in Script Properties, so both `.gs` files are committed to the repo. The `.env` file carrying the token for local builds is gitignored.

## Failure modes

A form submission with unparseable dates becomes a `needs-review` offering with no sessions; fix the data in the sheet by hand and add session rows if needed. A duplicate submission becomes a visible `-2` offering; delete its rows. If the web app returns "not found" errors or the test submitter fails, the script's stored IDs likely point at trashed files, which means the spreadsheet was rebuilt without rerunning `buildPrototype`; rerun it. Trashed Google files remain reachable by ID until the trash is emptied, so a "deleted" spreadsheet can still silently receive trigger writes; empty the trash after any cleanup. If the token leaks or is lost, run `setupWebApp` to rotate it and update the build environment.

The system degrades gracefully: if the web app is down or slow, class pages still render fully from the last build and only the live availability refresh and the signup form are affected.

## Rebuilds and schema changes

Schema changes come in two kinds, and only one of them is disruptive. Additive changes (a new form question, a new column) happen in place, mid-season, with no data loss: the trigger writes rows by header name rather than by position, so the live form gains its question in the Forms editor, the script constants gain the field, and `migrateSheets` appends the missing column to the live sheets while every existing offering, session, and host signup stays untouched. The runbook has the exact steps.

Destructive changes (renames, removals) still require the full rebuild: update the script, delete triggers, trash old form and spreadsheet, empty trash, rerun `buildPrototype`, republish the form, and redeploy the web app as a new version of the existing deployment (never a new deployment, which would change the URL). Existing data does not migrate through a rebuild, so destructive changes belong in the off-season, when losing the sheet costs nothing.

## Path to production

Everything currently runs under the dev account `devoweb91@gmail.com`. Production is the identical procedure executed under the org's own Google account: run `buildPrototype`, run `setupWebApp`, set the `volunteerCode` Script Property, deploy the web app, publish the form, point the site build at the new URL and token. The code requires no changes because nothing account-specific is hard-coded. Also rotate the build token at that point (the dev token circulated in development conversations). The formerly open questions are settled: class pages embed the Givebutter form directly (the full embed URL, element id included, pasted into the form by the class owner), and images follow the email-the-webmaster convention described in flow one.

## Component inventory

On the Google side (in `google-scripts/`, one folder per Apps Script project): the standalone project (`intake/`) holds `cpc-class-builder.gs` (builds the form and spreadsheet, additive schema migration, weekly backups, test submitter) and `cpc-web-app.gs` (the HTTP API: tiered `doGet` reads and the locked, code-gated `doPost` signup write); its Script Properties hold `spreadsheetId`, `formId`, `buildToken`, and `volunteerCode`. The sheet-bound project (`sheet-review/`) owns every write to the normalized sheets: the `handleFormSubmit` intake trigger (`intake-pipeline.gs`), the Review menu and edit modal (`review.gs`, `edit-modal.html`), and the submission notification email (`ClassIntakeTrigger.gs`, with `notifyRecipients` in its own Script Properties).

On the site side: `plugins/metalsmith-cpc-classes.js` (build-time data fetch into metadata) and `plugins/metalsmith-cpc-class-pages.js` (page generation, image resolution, collection cards), each with a `node --test` suite in `test/`. Generated pages are a hero plus three two-column `multi-media` sections; that component's `text` and `iframe`/`givebutter` media types carry the second text column and the registration embed, and the org boilerplate (accessibility, cancellation policy) renders as accordions under "What to expect". Three custom partials in the component library support this: `session-list` (live availability plus the volunteer signup dialog, rendered inside the details section), `givebutter-widget` (Givebutter's self-sizing registration widget, used when the pasted embed URL carries a widget element id and `givebutterAccountId` is set in `lib/data/cpc.json`), and `iframe` (the fixed-height fallback frame for plain campaign URLs). The `class-sessions` section remains as a thin standalone wrapper around `session-list`. `src/classes.md` is the hand-editable classes landing page. `lib/data/cpc.json` holds the org boilerplate.

Documentation: `cpc-google-howto.md` is the operational runbook (routine tasks first, setup procedures after), `adding-a-class.md` is the instructor-facing guide, `signup-test.html` is a standalone test page for the API's read and write paths, and this document is the reasoning.

## Status (as of 2026-07-04)

The full pipeline is built and verified end to end under the dev account: form submission through trigger normalization, approval gating, build-time fetch, generated class pages inside the site chrome, the classes landing page with collection cards, the embedded Givebutter registration form, live availability refresh, and the code-gated volunteer signup with its race protection. Verified with real submissions and real signups against the live web app.

Remaining work: visual styling of the class pages and listing, testing the instructor guide on real volunteers, and eventually the production migration described above. Known deferred items: a dedicated `/hosting/` overview page for volunteers if they ask for one, and scheduled or webhook-triggered site builds so approved classes appear without a manual rebuild.

Built 2026-07-09 (from the 2026-07-08/09 design sessions): recurring drop-in
classes with no session rows (schedule on the offering row, no host UI, never
expire), the walk-in versus online-registration distinction (no register
button, how-to-join note, body-class hooks on generated pages), and the
`whatToBring` / `accessibilityNote` / second-instructor / `ageAbilityNote`
fields end to end. Still planned: the Givebutter replacement (the data model
is already platform-neutral; the embed partial and URL helpers swap when CPC
picks the platform). Full semantics live in `cpc-class-data-schema.md`; that
document is the source of truth for the data model.
