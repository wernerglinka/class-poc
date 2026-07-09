# CPC Class Data Schema — Reference

The data model for the CPC class system: what every tab and column means, which
rules govern them, and which changes are decided but not yet implemented. The
companion `theory-of-operation.md` explains why the model looks this way;
`cpc-google-howto.md` has the procedures for changing it.

Status of this document: sections marked **implemented** describe the system
verified end to end on 2026-07-04. Sections marked **planned** record decisions
from the 2026-07-08/09 design sessions that are not yet built. When a planned
item lands, move it into the implemented tables and update the affected docs in
the same change.

## Architecture summary (implemented)

The Google Spreadsheet is the single editable source of truth. Class data
arrives two ways: instructors submit through the public Google Form (normalized
by the `handleFormSubmit` trigger), or staff enter a class directly via
**Review → Add new class** in the spreadsheet. Direct staff entry is the
predominant path; the form remains available but every submission is treated as
untrusted input until approved.

Metalsmith fetches the data at build time through the Apps Script web app
(token-gated GET) and generates one page per offering. Runtime JavaScript
handles only volunteer host availability (public GET) and signups (code-gated
POST). Student registration and payment are external; each offering carries a
registration URL and the site has no other dependency on the platform.

Org-wide boilerplate (accessibility statement, cancellation policy, location,
scholarship link) lives in `lib/data/cpc.json` in the repo, never in
spreadsheet cells.

## Sheet structure (implemented)

Three tabs. **Form Responses 1** is Google's raw capture of form submissions,
an audit trail read by nothing. **Offerings** holds one row per offering.
**Sessions** holds one row per dated meeting. Tab names and column headers are
load-bearing: the trigger, web app, review tooling, and build all find things
by name. Never rename them outside the destructive-rebuild procedure.

### Tab: Offerings

| Column | Meaning |
|---|---|
| `offeringId` | Stable ID stamped at creation: slugified title + first session date, e.g. `staked-side-table-20260715`. Collisions get `-2`, `-3`. Never edit once a page is live. |
| `status` | `open` (default), `full`, `cancelled`, or `needs-review` (unparseable submission). Controls how the class renders, not whether it exists. |
| `approved` | The publish gate. Arrives empty; a reviewer types `yes` to publish. Anything else keeps the row invisible to every payload, build and public. Clearing it unpublishes (the expired-class workflow). |
| `classTitle` | Class name. |
| `category` | Class category (craft discipline, yoga, etc.). |
| `shortSummary` | Two-three sentences for the listing card. |
| `fullDescription` | Multi-paragraph class page body. |
| `whatToExpect` | Teaching style, class flow. |
| `tuition`, `materialsFee`, `materialsFeeNote` | Fees. Numeric where possible; the note is free text. |
| `minimumAge`, `abilityLevel` | Age and ability requirements. |
| `instructorName`, `instructorBio`, `instructorLinks` | Instructor info, inline on the row (deliberate: no separate instructor tab, see Retired ideas). A second instructor uses the numbered scheme `instructor2Name`, `instructor2Bio`, `instructor2Links`, `instructor2Photo`; the page generator supports `instructor3...` if ever needed. |
| `ageAbilityNote` | Optional prose beyond `minimumAge`/`abilityLevel` (injuries, youth policy). |
| `classImage`, `instructorPhoto` | File names of images emailed to the webmaster. |
| `imageFolder` | Repo folder under `/assets/images/classes/`, auto-filled from the title, webmaster-editable. |
| `registrationUrl` | Registration link or embed URL. Platform-neutral name (renamed from `givebutterUrl` 2026-07-09); the value is currently a Givebutter campaign or embed URL. |
| `registrationType` | `online-registration` (default for form submissions) \| `walk-in`. Walk-in classes render fee text and a how-to-join note, no register button, and ignore `registrationUrl`. Validated dropdown (`applyColumnValidations`). |
| `scheduleType` | `sessions` (default for form submissions) \| `recurring`. A recurring class has NO Sessions rows; its schedule lives on this row. Validated dropdown. |
| `recurringDay` | Recurring only. Day of week, validated dropdown. |
| `recurringStart`, `recurringEnd` | Recurring only. Plain-text 24h times (`12:00`), same convention as Sessions. |
| `recurringExceptions` | Recurring only, optional. Comma-separated ISO skip dates (`2026-07-03`), rendered as "No class on July 3". |
| `whatToBring` | Optional. Clothing, mats, aprons, materials. |
| `accessibilityNote` | Optional. Class-specific note rendered as a disclosure IN ADDITION to the org-wide accessibility boilerplate, never replacing it. |
| `submitterName`, `submitterEmail`, `submittedAt` | Provenance. |

### Tab: Sessions

| Column | Meaning |
|---|---|
| `sessionId` | `offeringId` + `-s1`, `-s2`, … Never edit once live. |
| `offeringId` | Parent offering. |
| `classTitle` | Denormalized for human readability of the tab. |
| `sessionDate` | Plain text `2026-07-15`. Cells are text-formatted on purpose; keep ISO forms when editing by hand. |
| `sessionNumber`, `sessionCount` | Position within the offering. |
| `startTime`, `endTime` | Plain text `18:00`. |
| `hostName`, `hostEmail`, `signedUpAt` | Volunteer host slot, written by the signup `doPost` under `LockService`. Empty `hostName` = slot open. Clearing all three reopens the slot. |
| `status` | Per-session status when one session differs from its offering. |

## Data rules (implemented)

Dates and times are plain text, ISO forms, enforced by text-formatting the
cells before writing. `approved` is the publish gate; `status` is the render
modifier; they are independent. IDs never change once a page is live. Rows
whose dates have all passed get red shading (Review → Refresh expired
highlights re-runs it); the admin decides to keep the row as a record or clear
`approved`. Volunteer emails never leave the spreadsheet through any endpoint.

## Recurring and walk-in semantics (implemented 2026-07-09)

Driven by the yoga class (`/yoga` on the old site): a weekly drop-in class
with no fixed dates, sliding-scale fee paid directly to the instructor, no
online registration.

A `recurring` offering has **no Sessions rows**; its schedule lives entirely
on the offering row. The page generator renders the schedule from the
recurring columns ("Every Friday, 12:00 PM - 1:00 PM" in the hero and the
details list) minus exceptions, and no host/session UI renders (volunteer
hosting stays internal for open-ended classes — if that ever changes, the
escape hatch is a roster keyed `offeringId + date`). The expired-row shading
skips recurring offerings, which never expire. The web app serves sessionless
offerings as-is.

Recurring `offeringId`s are the slugified title alone (`yoga-for-the-people`),
with the usual `-2` collision suffix; dated offerings keep slug + first
session date. Frozen as of this date.

Recurring and walk-in classes are staff-entered via Review > Add new class
(set `scheduleType`/`registrationType` in the modal). Form submissions always
arrive as `sessions` + `online-registration`; staff flip the fields afterwards
if needed.

Generated pages carry hooks on the body element (single-dash class naming):
`class-page registration-<registrationType> schedule-<scheduleType>`. CSS
styles the variants; page JS can gate the availability fetch on
`schedule-sessions`. Structural differences (register embed vs. how-to-join
note, no register CTA for walk-in) branch in the section builder, not in CSS.
The walk-in note's default wording can be overridden with `walkInNote` in
`lib/data/cpc.json`.

After pasting the updated scripts, run `migrateSheets` then
`applyColumnValidations` (both in the standalone project) to add the columns
and their dropdowns to the live sheet. The two new form questions ("What to
bring", "Accessibility note") must be added to the live form by hand, per the
mid-season procedure in the runbook.

## Planned changes

### Givebutter replacement

The column rename is done: `givebutterUrl` became `registrationUrl` on
2026-07-09 (POC-stage rename; the dev sheet's header cell and the form
question title must match — the script now expects the question title "Online
registration URL"). The remaining Givebutter dependencies are the
`givebutter-widget` partial, `givebutterAccountId` in `lib/data/cpc.json`, and
the plugin's Givebutter-specific URL parsing helpers (`extractGivebutterSlug`,
`extractGivebutterWidgetId`, `buildGivebutterEmbedUrl`). When CPC picks the new
platform: swap the embed partial, replace those helpers with the new platform's
URL handling, and update `cpc.json`. The data model is already neutral.

## Retired ideas

Recorded so they are not re-proposed. A `draft` column (rejected: `approved`
already gates publication and is wired through the web app, review tooling, and
user manual; `@metalsmith/drafts` gates source files, not generated pages). A
separate `Instructors` tab (rejected for now: inline columns match the intake,
edit modal, and page generator; revisit only if instructor duplication becomes
a real maintenance cost). Renaming the tabs to `Classes`/`Offerings`
(rejected: the existing `Offerings`/`Sessions` vocabulary is implemented and
documented; renames are destructive). A `hostNeeded` flag (derived instead:
`recurring` offerings render no host UI). Structured fee columns beyond the
existing three (fee prose like "$10–30 sliding scale, paid directly to
instructor" goes in `materialsFeeNote`-style display text; nothing sorts or
computes on fees).
