# disclosure

Named for the spec term: details/summary form a "disclosure widget".
The name "accordion" is deliberately avoided because the
nunjucks-components library ships an accordion *section*, and the
component bundler keeps partials and sections in one namespace,
failing the build on duplicate names.

Renders a list of collapsed disclosure blocks with the native
`<details>`/`<summary>` elements: accessible, keyboard-operable, and
JS-free. Each item's body is markdown, rendered through `mdToHTML`.

## Usage

```njk
{% from "components/_partials/disclosure/disclosure.njk" import disclosures %}

{{ disclosures([
  { title: 'Accessibility', prose: 'Markdown body with [links](/x).' },
  { title: 'Cancellation policy', prose: 'More markdown.' }
]) }}
```

In the multi-media section, an optional `disclosures` array on the
section renders beneath the text column's prose, CTAs, and session
list; the class-pages plugin uses this to fold the org boilerplate
(accessibility, cancellation policy) under "What to expect".
