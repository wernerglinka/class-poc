# Text Link Partial

Renders a styled text link. Typically used within the `ctas` partial for non-button CTAs.

## Features

- Styled text link with consistent appearance
- Automatic external link detection (adds `target="_blank"` and security attributes)
- Accessible labels for external links

## Usage

Import the macro in your template:

```njk
{% from "components/_partials/text-link/text-link.njk" import textLink %}

{{ textLink({
  url: "/path",
  label: "Learn More"
}) }}
```

## Parameters

- `url` (required): Link destination
- `label` (required): Link text

## External Links

External links automatically receive security attributes (`target="_blank" rel="noopener noreferrer"`) and an accessible label indicating they open in a new window.
