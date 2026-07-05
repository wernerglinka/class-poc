# Image Partial Component

A simple image component that renders an image with optional caption.

## Data Structure

```yaml
image:
  src: "/assets/images/example.jpg"
  alt: "Image description"
  caption: "Optional image caption"
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `src` | String | Yes | Path to the image file |
| `alt` | String | Yes | Alt text for accessibility |
| `caption` | String | No | Optional caption text below image |

## HTML Output

### Image with Caption
```html
<img src="/assets/images/example.jpg" alt="Image description" />
<p class="caption">Optional image caption</p>
```

## Template Usage

```nunjucks
{% from "components/_partials/image/image.njk" import image %}

{% if section.image %}
    <div class="image">
      {{ image(section.image)}}
    </div>
  {% endif %}
```

## Features

- **Optional Captions**: Conditional caption rendering
- **Accessibility**: Required alt text for screen readers
