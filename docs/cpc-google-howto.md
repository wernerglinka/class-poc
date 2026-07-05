# CPC Class Intake: Google Side How-To

This document covers everything that lives on the Google side of the Center for People and Craft class pipeline. The static site (Metalsmith) consumes what this produces but is documented elsewhere.

## The moving parts

Everything runs under the dev Google account `devoweb91@gmail.com`. There are three artifacts, all created by one script:

1. **A Google Form** ("CPC Class Intake") that class owners fill out, one submission per offering. A multi-session class is one submission with multiple session date pickers filled in.
2. **A Google Spreadsheet** with three tabs. *Form Responses 1* is the raw, untouched form output. *Offerings* holds one row per offering with all prose, fees, instructor info, and a stable `offeringId` like `staked-side-table-20260715`. *Sessions* holds one row per dated session with a `sessionId` like `staked-side-table-20260715-s2`, plus empty `hostName`, `hostEmail`, and `signedUpAt` columns that the volunteer signup flow fills later.
3. **An Apps Script project** containing `cpc-class-intake-prototype.gs`. It builds the form and spreadsheet, and its `handleFormSubmit` trigger converts each raw form submission into the normalized Offerings and Sessions rows.

The spreadsheet is the editable source of truth. If a submission has a typo, fix it in the Offerings or Sessions tab. Never ask a class owner to resubmit the form; that creates a duplicate offering with a `-2` suffix.

Org-wide boilerplate (accessibility text, cancellation policy, location, scholarship link) deliberately does not live in the spreadsheet. It belongs in the site repo config.

## Routine tasks

These are the recurring jobs. Everything below this section is setup work that happens once (or once per schema change).

**Approve a new class.** Open the spreadsheet, Offerings tab, find the new row, type `yes` in its `approved` column. Until then the class is invisible to the website, both in builds and in the live availability feed. This is the spam gate; every submission needs it. Then rebuild the site (or wait for the next scheduled build).

**Rotate the volunteer code.** In the Apps Script editor: gear icon (Project Settings) > Script Properties > edit the `volunteerCode` value > Save. Announce the new code in the next volunteer email. Takes effect immediately, no redeployment. Matching ignores case and surrounding spaces. If the property is missing entirely, all signups are rejected.

**Fix a submission.** Edit the Offerings or Sessions row directly in the spreadsheet. Type dates as `2026-07-15` and times as `18:00` (the cells are plain text and stay that way). Never change `offeringId` or `sessionId` once a class page is live, and never ask a class owner to resubmit the form.

**Mark a class full or cancelled.** Set its `status` column in Offerings (and per-session in Sessions if only one session is affected). Approval stays `yes`; status controls how the class renders, approval controls whether it exists at all.

**Clear a host signup** (volunteer backs out). In the Sessions tab, clear that row's `hostName`, `hostEmail`, and `signedUpAt` cells. The slot immediately shows "(host needed)" again on the live page.

**Add class images.** When an instructor emails images, commit them to the site repo at `/assets/images/classes/<givebutter-campaign-slug>/` with exactly the file names the instructor entered in the form. The build warns about any image it can't find.

## Adding a field mid-season (no rebuild, no data loss)

Adding a question to the form while classes are live does NOT require a rebuild. The trigger writes rows by column name, not position, so live sheets can grow new columns safely.

1. Open the live form in the Forms editor and add the question by hand.
2. In the script, add the field to `QUESTIONS`, to `OFFERING_COLUMNS` (or `SESSION_COLUMNS`), to `buildOfferingRecord`, and to `createIntakeForm` (so future rebuilds match). Save.
3. Run `migrateSheets` from the function dropdown. It appends the missing column to the live sheet and logs what it did. All existing offerings, sessions, and host signups stay exactly as they were; old rows just have an empty cell in the new column.
4. Backfill old rows by hand if the new field applies to them, and update the site code to use the new field.

## Building from scratch (or rebuilding)

A full rebuild is only for destructive schema changes: renaming or removing columns or questions. Save those for the off-season. (Adding fields is handled without a rebuild; see the previous section.)

1. Go to https://script.google.com while signed in as `devoweb91@gmail.com` and open the project (or create a new one).
2. Paste the current `cpc-class-intake-prototype.gs` over the entire contents of Code.gs and save.
3. Open the Triggers panel (clock icon in the left sidebar) and delete any existing triggers. Stale triggers point at deleted spreadsheets and will fail silently.
4. Trash the old form and old spreadsheet in Drive, then empty the Drive trash. The old and new files share the same name, and leaving both around is how the wrong one gets deleted later.
5. Select `buildPrototype` in the function dropdown in the toolbar and click Run. Grant permissions if asked.
6. Open the execution log. It prints three URLs: the spreadsheet, the form's edit view, and the form's live view. Save these somewhere.

Order matters in steps 3 through 5: triggers first, then old files, then rebuild. Running `buildPrototype` before cleaning up leaves you with two identically named forms and spreadsheets.

## Publishing the form

A newly built form does not accept responses until published.

1. Open the form's edit URL.
2. Click Publish (top right) and confirm.
3. Under responder settings, set access to "Anyone with the link."
4. Share the live `/viewform` URL with class owners.

No question requires respondents to sign in to Google.

## Testing the pipeline

Run `submitTestOffering` from the same function dropdown in the Apps Script editor. It submits a realistic three-session woodworking class through the real form, which fires the real trigger. Check the spreadsheet afterwards: one new row in Offerings, three in Sessions with dates 2026-07-15/22/29, times 18:00 and 21:00, and empty host columns.

The test data is fictional, so delete those rows (one in Offerings, three in Sessions) before real use. Delete the corresponding row in Form Responses 1 too if you want that tab clean, though nothing reads it.

## Editing rules for the spreadsheet

Dates and times in Sessions are stored as plain text on purpose: `2026-07-15` and `18:00`, exactly what the site's build fetch expects. The trigger formats each row as plain text before writing, so new rows are safe. If you edit a date cell by hand, type it in the same ISO form; the cell keeps its plain-text format, so Sheets will not convert it.

The `offeringId` and `sessionId` columns are referenced by the website and by volunteer signups. Never change them after a class page is live.

The `status` column starts as `open`. Set it to whatever the site build understands (for example `full` or `cancelled`) to change how the class renders. A submission whose dates could not be parsed arrives with status `needs-review`; fix the Sessions rows by hand and flip the status.

**Every new submission requires approval before it can appear anywhere.** The `approved` column in Offerings arrives empty, and the web app excludes unapproved offerings from both the build payload and the public availability payload; the form is publicly reachable, so this is the spam gate. Review the submission and type `yes` in the `approved` cell to publish it (case does not matter). Anything else, or an empty cell, keeps it invisible to the website. To get notified of new submissions by email, set `ADMIN_NOTIFICATION_EMAIL` near the top of `cpc-class-intake-prototype.gs` to the reviewer's address and save; leave it empty to disable.

## Known pitfalls

Images travel outside the Google pipeline entirely, by design. Instructors email their image files to the webmaster and enter only the file names in the form ("side-table.jpg"). The webmaster commits the files to the site repo at `/assets/images/classes/<givebutter-campaign-slug>/` (for an offering without a Givebutter campaign yet, the folder is the slugified class title, e.g. `staked-side-table`). The build resolves the file names against that folder and prints a warning for any image that has not arrived, omitting it from the page rather than shipping a broken reference. The Forms API cannot create file-upload questions, and a manual upload question would force instructors to sign in to Google.

Trashed Google files remain reachable by ID until the trash is emptied. A "deleted" spreadsheet can still silently receive trigger writes, which makes debugging confusing. Empty the trash after cleanup.

If `submitTestOffering` errors with something like "not found," the script's stored IDs point at deleted files. That means `buildPrototype` has not been rerun since the last cleanup.

## The web app (read and write API)

The second script file, `cpc-web-app.gs`, turns the project into the single URL through which everything reads and writes the spreadsheet. The spreadsheet itself is never shared with anyone.

To add it: in the Apps Script editor, click + next to Files, name the new file `cpc-web-app`, and paste the file's contents. Both files live in the same project and share Script Properties, so `buildPrototype` must have been run first.

To deploy:

1. Run `setupWebApp` once from the function dropdown. It generates the build token and prints it in the log. Store that token in the site's build environment (for example `CPC_SHEET_TOKEN`). Running `setupWebApp` again rotates the token, which invalidates the old one.
2. Set the volunteer code: Project Settings (gear icon) > Script Properties > Add script property, key `volunteerCode`, value the current code word. Signups without the correct code are rejected. **To rotate it, just edit the property value and announce the new code in the next volunteer email; no redeployment needed.** With no `volunteerCode` property set, all signups are rejected.
3. Deploy > New deployment > gear icon > Web app. Set "Execute as: Me" and "Who has access: Anyone." Click Deploy and authorize.
4. Copy the `/exec` URL. This is the API URL the site build and the class pages use.
5. After any later code change, do NOT create a new deployment. Use Deploy > Manage deployments > pencil icon > Version: New version. That keeps the `/exec` URL stable. A brand-new deployment gets a different URL and the site would silently keep using the old code.

What the URL does: a GET with `?token=THE_BUILD_TOKEN` returns the full class data as JSON, offerings with their sessions nested inside, for the Metalsmith build. A GET without a token returns only sessionId and a hosted yes/no flag per session, which is what class pages fetch on load to show which sessions still need a host. Volunteer names and emails are never returned publicly; hosted sessions simply show nothing on the page. A POST with a JSON body of `sessionId`, `hostName`, `hostEmail`, and `volunteerCode` claims a hosting slot; it answers `{"ok": true}` on success or `{"ok": false, "error": "taken"}` when someone got there first (also `code` for a wrong volunteer code, `invalid` for bad input, and `not-found` for an unknown session). The code comparison ignores case and surrounding whitespace.

One browser quirk to remember when writing the signup JavaScript: Apps Script cannot answer CORS preflight requests, so the POST must use `Content-Type: text/plain;charset=utf-8` with the JSON as a plain body string. A `Content-Type: application/json` POST triggers a preflight and fails.

A second CORS trap, encountered and solved during testing: if browser fetches fail with "No 'Access-Control-Allow-Origin' header" while the URL works fine when opened directly, the deployment's "Who has access" is set to "Anyone with Google account" instead of "Anyone." Signed-in browser visits succeed, but cross-origin fetches get redirected to a login page without CORS headers. Fix it via Deploy > Manage deployments > pencil icon (the access field is hidden until edit mode) > Who has access: Anyone > Version: New version > Deploy. The incognito-window test tells the truth: the /exec URL must return JSON without a sign-in prompt.

`signup-test.html` in the repo is a standalone test page for the whole browser-facing flow. Open it locally, paste the /exec URL, and it lists sessions and lets you claim one, exercising the same GET and text/plain POST the real class pages will use. It doubles as the reference implementation for the site's signup modal.

## Still to build

The Metalsmith plugin that fetches the token-gated GET at build time, and the class page signup JavaScript that does the public GET on load and the POST on submit.

For production, rerun the whole build under the org's own Google account rather than the dev account. The procedure is identical, including the web app deployment.
