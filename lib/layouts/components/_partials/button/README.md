# Button Partial

Renders a styled button/link element. Typically used within the `ctas` partial but can be imported directly.

## Features

- Four button styles: `primary`, `secondary`, `tertiary`, `inverted`
- Small size variant with `isSmall`
- Automatic external link detection (adds `target="_blank"` and security attributes)
- Accessible labels for external links

## Usage

Import the macro in your template:

```njk
{% from "components/_partials/button/button.njk" import button %}

{{ button({
  url: "/path",
  label: "Click Here",
  buttonStyle: "primary",
  isSmall: false
}) }}
```

## Parameters

- `url` (required): Link destination
- `label` (required): Button text
- `buttonStyle`: One of `primary`, `secondary`, `tertiary`, or `inverted`
- `isSmall`: Boolean to render smaller button variant

## Button Styles

Button appearance is controlled by CSS classes matching the `buttonStyle` value. External links automatically receive security attributes (`target="_blank" rel="noopener noreferrer"`).
