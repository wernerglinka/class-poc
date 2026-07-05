# Icon Component

Scalable vector icon component supporting various icon libraries with consistent sizing and accessibility features.

## Features

- **SVG Icons**: Crisp, scalable vector graphics
- **Icon Library Support**: Compatible with popular icon libraries (Feather, etc.)
- **Consistent Sizing**: Uniform sizing across all icons
- **Accessibility**: Proper titles and ARIA labels
- **Link Integration**: Optional wrapper links for interactive icons
- **Lightweight**: Minimal markup and CSS

## Data Structure

```yaml
icon:
  icon: "feather"          # Icon identifier
  title: "Feather Icon"    # Accessibility title
  url: ""                  # Optional link URL
  size: "24"              # Optional size override
```

## Properties

- `icon`: Icon identifier from the icon library
- `title`: Descriptive title for accessibility
- `url`: Optional URL to make icon clickable
- `size`: Optional size override (defaults to theme size)

## HTML Structure

### Basic Icon
```html
<div class="icon-wrapper">
  <svg class="icon icon-feather" width="24" height="24" viewBox="0 0 24 24">
    <title>Feather Icon</title>
    <!-- Icon path data -->
  </svg>
</div>
```

### Linked Icon
```html
<div class="icon-wrapper">
  <a href="/link-destination" class="icon-link">
    <svg class="icon icon-feather" width="24" height="24" viewBox="0 0 24 24">
      <title>Feather Icon</title>
      <!-- Icon path data -->
    </svg>
  </a>
</div>
```

## Icon Libraries

### Feather Icons
Popular, clean icon set with consistent design:
- `arrow-right`
- `chevron-down`
- `user`
- `mail`
- `phone`
- `external-link`

### Custom Icons
Add custom icons by extending the icon system:
```html
<svg class="icon icon-custom" viewBox="0 0 24 24">
  <title>Custom Icon</title>
  <path d="M12 2l3.09..."/>
</svg>
```

## Usage Examples

### Navigation Icon
```yaml
icon:
  icon: "menu"
  title: "Open navigation menu"
```

### Contact Icon
```yaml
icon:
  icon: "mail"
  title: "Send email"
  url: "mailto:contact@example.com"
```

### Social Media Icon
```yaml
icon:
  icon: "twitter"
  title: "Follow us on Twitter"
  url: "https://twitter.com/username"
```

### Feature Icon
```yaml
icon:
  icon: "shield"
  title: "Security feature"
  size: "48"
```

## CSS Styling

```css
.icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-link {
  display: inline-block;
  color: inherit;
  text-decoration: none;
}

.icon-link:hover .icon {
  color: var(--accent-color);
}
```

## Size Variants

### Small Icons (16px)
```css
.icon-small {
  width: 16px;
  height: 16px;
}
```

### Large Icons (32px)
```css
.icon-large {
  width: 32px;
  height: 32px;
}
```

### Custom Sizes
```yaml
icon:
  icon: "star"
  title: "Rating star"
  size: "20"
```

## Accessibility

- **Titles**: Every icon includes a descriptive title
- **ARIA Labels**: Screen reader accessible descriptions
- **Color Independence**: Icons work without color alone
- **Focus States**: Proper focus indicators for linked icons
- **Semantic Meaning**: Icons supplement, not replace, text content

## Best Practices

1. **Consistent Library**: Use icons from the same library for visual consistency
2. **Meaningful Titles**: Write descriptive titles that explain the icon's purpose
3. **Size Consistency**: Use standard sizes throughout your design
4. **Color Contrast**: Ensure sufficient contrast against backgrounds
5. **Fallback Text**: Provide text alternatives when icons convey important information

## Integration with Text

### Icon with Label
```html
<div class="icon-text">
  <svg class="icon"><!-- icon --></svg>
  <span>Download</span>
</div>
```

### Icon Button
```html
<button class="icon-button">
  <svg class="icon"><!-- icon --></svg>
  <span class="sr-only">Close dialog</span>
</button>
```

## Performance Considerations

1. **SVG Sprites**: Use SVG sprites for multiple instances
2. **Inline SVG**: Inline small, frequently used icons
3. **Icon Fonts**: Consider icon fonts for large icon sets
4. **Lazy Loading**: Load icons only when needed for large sets

## Browser Support

- **SVG**: Supported in all modern browsers (IE9+)
- **currentColor**: IE9+ for inherit text color
- **CSS Transforms**: For animated icons (IE10+)

## Common Icon Patterns

### Status Icons
```yaml
- icon: "check-circle"
  title: "Success"
- icon: "alert-circle"
  title: "Warning"
- icon: "x-circle"
  title: "Error"
```

### Action Icons
```yaml
- icon: "edit"
  title: "Edit item"
- icon: "trash"
  title: "Delete item"
- icon: "download"
  title: "Download file"
```

### Navigation Icons
```yaml
- icon: "home"
  title: "Go to homepage"
- icon: "arrow-left"
  title: "Go back"
- icon: "external-link"
  title: "Open in new tab"
```