# Card Component

Flexible card component for displaying content in a structured, visually appealing container. Perfect for blog post previews, product showcases, or feature highlights.

## Features

- **Flexible Content**: Supports various content types and layouts
- **Responsive Design**: Adapts seamlessly across all screen sizes
- **Clean Structure**: Semantic HTML with proper heading hierarchy
- **Link Integration**: Optional wrapper links for entire card interaction
- **Consistent Spacing**: Uniform padding and margin using design tokens

## Data Structure

```yaml
card:
  title: "Card Title"
  content: "Card content or description"
  link:
    url: "/path/to/content"
    label: "Read more"
  image:
    src: "/assets/images/card-image.jpg"
    alt: "Card image description"
```

## Properties

- `title`: Card heading text
- `content`: Main card content (supports markdown)
- `link.url`: Optional URL for card navigation
- `link.label`: Link text for accessibility
- `image.src`: Optional card image
- `image.alt`: Image alt text for accessibility

## HTML Structure

```html
<article class="card">
  <header class="card-header">
    <img src="/assets/images/card-image.jpg" alt="Card image description">
  </header>
  
  <div class="card-content">
    <h3 class="card-title">Card Title</h3>
    <div class="card-text">
      <p>Card content or description</p>
    </div>
    
    <footer class="card-footer">
      <a href="/path/to/content" class="card-link">Read more</a>
    </footer>
  </div>
</article>
```

## Usage Examples

### Blog Post Card
```yaml
card:
  title: "Getting Started with Metalsmith"
  content: "Learn how to build static sites with this powerful generator."
  link:
    url: "/blog/getting-started-metalsmith"
    label: "Read full article"
  image:
    src: "/assets/images/metalsmith-guide.jpg"
    alt: "Metalsmith static site generator tutorial"
```

### Product Card
```yaml
card:
  title: "Premium Template"
  content: "Professional website template with modern design and features."
  link:
    url: "/products/premium-template"
    label: "View details"
  image:
    src: "/assets/images/template-preview.jpg"
    alt: "Premium template preview"
```

### Simple Text Card
```yaml
card:
  title: "Feature Highlight"
  content: "Discover what makes our platform unique and powerful."
  link:
    url: "/features"
    label: "Learn more"
```

## Styling

The card component uses CSS classes for styling:

- `.card`: Main container
- `.card-header`: Image container
- `.card-content`: Content wrapper
- `.card-title`: Title styling
- `.card-text`: Content area
- `.card-footer`: Link/action area
- `.card-link`: Link styling

## Best Practices

1. **Consistent Content**: Keep card titles and descriptions similar in length
2. **Image Optimization**: Use appropriately sized images for better performance
3. **Accessibility**: Always include alt text for images and descriptive link labels
4. **Content Hierarchy**: Use proper heading levels based on page structure
5. **Link Purpose**: Ensure link labels clearly describe the destination

## Accessibility

- Semantic HTML structure with proper `article` elements
- Proper heading hierarchy for screen readers
- Descriptive link text and image alt attributes
- Keyboard navigation support through standard HTML elements