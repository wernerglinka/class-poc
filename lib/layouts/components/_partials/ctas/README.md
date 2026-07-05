# CTAs (Call-to-Action) Partial Component

A flexible partial component for rendering call-to-action buttons and links with automatic external link handling and security attributes.

## Data Structure

```yaml
ctas:
  - url: "/internal-page"
    label: "Learn More"
    isButton: true
    buttonStyle: "primary"
  - url: "https://external-site.com"
    label: "External Link"
    isButton: false
  - url: "/another-page"
    label: "Secondary Action"
    isButton: true
    buttonStyle: "secondary"
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | String | Yes | Link destination (internal or external) |
| `label` | String | Yes | Text displayed on the button/link |
| `isButton` | Boolean | Yes | `true` for button styling, `false` for link styling |
| `buttonStyle` | String | No | Additional CSS class for button variations |

## HTML Output

### Button CTA
```html
<div class="ctas flow">
  <a class="cta button primary" href="/internal-page">Learn More</a>
</div>
```

### External Link CTA
```html
<div class="ctas flow">
  <a class="cta link"
     href="https://external-site.com"
     target="_blank"
     rel="noopener noreferrer"
     aria-label="External Link (opens in new window)">
    External Link
  </a>
</div>
```

## Usage Examples

### Basic Button
```yaml
ctas:
  - url: "/contact"
    label: "Contact Us"
    isButton: true
```

### Mixed CTAs
```yaml
ctas:
  - url: "/signup"
    label: "Sign Up"
    isButton: true
    buttonStyle: "primary"
  - url: "/learn-more"
    label: "Learn More"
    isButton: false
```

## Template Usage

```nunjucks
{% from "components/_partials/ctas/ctas.njk" import ctas %}
{{ ctas(section.ctas) }}
```

## Features

- **Multiple CTA Support**: Render multiple buttons and links in a single container
- **External Link Handling**: Automatic `target="_blank"` and security attributes
- **Glass Morphism Design**: Modern glass effect styling for buttons
- **URL Validation**: Only renders CTAs with valid, non-empty URLs
- **Accessibility**: WCAG 2.1 AA compliant with proper focus management
