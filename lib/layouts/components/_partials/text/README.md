# Text Partial Component

A flexible partial component for rendering structured text content including lead-ins, titles, subtitles, and prose with full markdown support.

## Data Structure

```yaml
text:
  leadIn: "Optional lead-in text"
  title: "Main Title"
  titleTag: "h2"  # Optional: h1-h6 (defaults to h2)
  subTitle: "Optional subtitle"
  prose: |-
    Main content in **Markdown** format.

    - Supports lists, **bold**, *italic*, [links](https://example.com)
    - Code blocks and `inline code`
    - Tables, blockquotes, and other markdown elements
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `leadIn` | String | No | Small uppercase text above the title |
| `title` | String | No | Main heading text |
| `titleTag` | String | No | HTML tag for title (h1-h6, defaults to h2) |
| `subTitle` | String | No | Subtitle text below the title |
| `prose` | String | No | Main content in Markdown format |

## HTML Output

```html
<p class="lead-in">Optional lead-in text</p>
<h2 class="title">Main Title</h2>
<p class="sub-title">Optional subtitle</p>
<div class="prose">
  <p>Main content with <strong>markdown</strong> support.</p>
</div>
```

## Usage Examples

### Complete Text Block
```yaml
text:
  leadIn: "Welcome to"
  title: "Our Platform"
  titleTag: "h1"
  subTitle: "The future of web development"
  prose: "Discover powerful tools and features."
```

### Title Only
```yaml
text:
  title: "Section Title"
  titleTag: "h2"
```

### Prose Only
```yaml
text:
  prose: "Simple text block with **markdown** support."
```

## Template Usage

```nunjucks
{% from "components/_partials/text/text.njk" import text %}
{{ text(section.text) }}
```

## Features

- **Conditional Rendering**: Only renders elements that are present
- **Semantic HTML**: Proper heading hierarchy and structure
- **Markdown Processing**: Full markdown support with syntax highlighting
- **Typography Integration**: Inherits fluid typography from global styles
- **Responsive Design**: Optimal reading widths and spacing
