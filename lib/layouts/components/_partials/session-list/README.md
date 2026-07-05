# session-list

Renders a class offering's session list with live volunteer host
status and a signup dialog. Extracted from the `class-sessions`
section so other sections (notably `multi-media`) can place the list
inside a column.

Host privacy: hosted sessions show only date and time; open sessions
add a quiet "(host needed)" link that opens the signup dialog.
Volunteer names are never displayed.

`session-list.js` refreshes availability from the Apps Script web app
on page load (the build-rendered state may be stale) and handles the
signup POST.

## Usage

```njk
{% from "components/_partials/session-list/session-list.njk" import sessionList %}

{{ sessionList(section.endpoint, section.sessions, 'Sessions and volunteer hosts') }}
```

Parameters:

- `endpoint` - Apps Script web app /exec URL
- `sessions` - array of `{ sessionId, dateDisplay, timeDisplay, hosted }`
- `heading` - optional heading rendered above the list
