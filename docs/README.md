# Documentation Index

Five documents cover the CPC class system. They have different audiences and jobs; this is the reading order.

**[theory-of-operation.md](theory-of-operation.md)** explains how the system works and why it was built that way: the data model, the three flows (intake, build, live signup), and the security model. Read this first when returning to the project after time away, or when deciding whether a proposed change fights the design.

**[cpc-google-howto.md](cpc-google-howto.md)** is the operational runbook for the Google side: routine tasks (approving classes, fixing submissions, rotating codes), schema changes, rebuilds, backups, the web app deployment procedure, the review sidebar, and a map of where every URL and secret lives. This is the document to have open while actually doing something.

**[apps-script-primer.md](apps-script-primer.md)** explains the Google Apps Script platform itself for a maintainer who knows JavaScript but not Google's scripting environment: standalone versus bound scripts, triggers, deployments and versions, authorization, and debugging. Read it when the howto's instructions work but you want to understand why, or when something breaks in a way the runbook does not cover.

**[adding-a-class.md](adding-a-class.md)** is the instructor-facing guide for class owners submitting a class through the form. It is written for non-technical readers and can be shared as is.

**[signup-test.html](signup-test.html)** is a standalone test page for the web app's read and write endpoints. Open it locally, paste the `/exec` URL, and exercise the same GET and POST the real class pages use. It doubles as the reference implementation for the site's signup dialog.
