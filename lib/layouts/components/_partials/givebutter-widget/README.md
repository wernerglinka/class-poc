# givebutter-widget

Renders a Givebutter registration form via Givebutter's supported
widget mechanism instead of a raw iframe. The widget adjusts to the
form's native height as donors move through checkout, so there is no
fixed frame height and no leftover white space.

`givebutter-widget.js` injects Givebutter's widget script once per
page (`https://widgets.givebutter.com/latest.umd.cjs?acct=...&p=other`)
using the account id from the wrapper's data attribute. The script
defines the `<givebutter-widget>` custom element and handles sizing.

## Usage

```njk
{% from "components/_partials/givebutter-widget/givebutter-widget.njk" import givebutterWidget %}

{{ givebutterWidget({ accountId: 'PmjH64qe6hji2K9Y', widgetId: 'gGRrMX' }) }}
```

Parameters:

- `accountId` - the org's Givebutter account id. Public information:
  it appears in the source of every campaign page. Configured in
  `lib/data/cpc.json` as `givebutterAccountId`.
- `widgetId` - the widget element id, carried by the embed URL the
  class owner pastes into the intake form as the
  `gba_gb.element.id` query parameter.

## Notes

- Widgets max out at 420px wide; the wrapper centers the element in
  its column.
- When an offering's Givebutter URL has no element id (a plain
  campaign URL was pasted), the class-pages plugin falls back to the
  fixed-height `iframe` partial.
