# Collection Links Section Component

A navigation component that provides previous/next links between sequential items in a collection. Designed to enhance navigation by allowing readers to easily move between articles in chronological order.

## Features

- **Sequential Navigation**: Automatically links to previous and next collection items
- **Conditional Display**: Only renders when previous or next items exist
- **Accessible Navigation**: Properly labeled navigation with semantic HTML
- **Responsive Layout**: Flexbox-based layout that adapts to screen size
- **Title Display**: Shows the title of linked items for context
- **Directional Indicators**: Clear visual arrows indicating navigation direction
- **Container Integration**: Works within the standard container system

## Data Structure

The collection links component relies on Metalsmith's collection metadata to determine previous and next items. These values are typically populated automatically by Metalsmith's collections plugin.

```yaml
# Automatically populated by Metalsmith
previous:
  urlPath: "/blog/previous-post/"
  card:
    title: "Previous Post Title"

next:
  urlPath: "/blog/next-post/"
  card:
    title: "Next Post Title"
```

## HTML Structure

```html
<nav class="collection-links container" aria-label="Collection navigation">
  <!-- Previous item link (if exists) -->
  <a href="/blog/previous-post/" class="collection-link collection-link-prev">
    <span class="collection-link-label">← Previous</span>
    <span class="collection-link-title">Previous Post Title</span>
  </a>

  <!-- Next item link (if exists) -->
  <a href="/blog/next-post/" class="collection-link collection-link-next">
    <span class="collection-link-title">Next Post Title</span>
    <span class="collection-link-label">Next →</span>
  </a>
</nav>
```

## CSS Architecture

### Layout Structure
Uses flexbox for responsive navigation arrangement:
```css
.collection-links {
  display: flex;
  justify-content: center;
  gap: var(--space-l-2xl);
  flex-wrap: wrap;
}
```

### Responsive Behavior
- **Flexible spacing**: Uses CSS custom properties for consistent spacing
- **Wrap on small screens**: Navigation links stack vertically when needed
- **Center alignment**: Links centered within container by default
- **Adaptive gap**: Spacing adjusts based on design system variables

### Link Styling
- **Previous link**: Left-aligned with arrow pointing left
- **Next link**: Right-aligned with arrow pointing right
- **Block display**: Links are block-level for better click targets
- **Text decoration**: Removed by default for cleaner appearance

## Usage Patterns

### Basic Implementation
Simply include the collection-links component in your collection item template:
```njk
{% include "components/sections/collection-links/collection-links.njk" %}
```

### Integration in Blog Post Layout
```njk
{# blog-post.njk #}
<article class="blog-post">
  <!-- Blog post content -->
  {{ content | safe }}

  <!-- Navigation between posts -->
  {% include "components/sections/collection-links/collection-links.njk" %}
</article>
```

### Custom Wrapper
```njk
<div class="blog-post-footer">
  {% include "components/sections/collection-links/collection-links.njk" %}
  <!-- Other footer elements -->
</div>
```

## Dependencies

- **Container system**: Uses standard container class for consistent width
- **CSS custom properties**: Relies on design system spacing variables
- **Metalsmith collections**: Requires collections plugin for previous/next data

## Integration Requirements

### Metalsmith Collections Plugin
The component requires properly configured collections to provide previous/next data:
```javascript
// In metalsmith.js
.use(collections({
  blog: {
    pattern: 'blog/**/*.md',
    sortBy: 'date',
    reverse: true,
    metadata: {
      name: 'Blog Posts'
    }
  }
}))
```

### Collection Item Frontmatter
Each collection item needs proper card metadata:
```yaml
# In collection item frontmatter
card:
  title: "Item Title"
  # Other card properties...
```

## Customization

### Custom Classes
The component structure allows for additional styling through CSS:
```css
/* Custom navigation styles */
.collection-links {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-xl);
  margin-top: var(--space-2xl);
}

/* Custom link styling */
.collection-link {
  color: var(--color-primary);
  transition: color 0.2s ease;
}

.collection-link:hover {
  color: var(--color-primary-dark);
}
```

### Styling Hooks
Key CSS classes for customization:
- `.collection-links`: Main navigation container
- `.collection-link`: Individual navigation links
- `.collection-link-prev`: Previous item link
- `.collection-link-next`: Next item link
- `.collection-link-label`: Arrow and direction text
- `.collection-link-title`: Item title text

### Layout Variations
Override default layout with custom CSS:
```css
/* Space links apart */
.collection-links {
  justify-content: space-between;
}

/* Stack vertically on all screens */
.collection-links {
  flex-direction: column;
  align-items: center;
}
```

## Accessibility

- **Semantic HTML**: Uses `nav` element with proper ARIA label
- **Descriptive labels**: Clear "Previous" and "Next" text for screen readers
- **Link context**: Full item titles provide context for navigation
- **Keyboard navigation**: Fully keyboard accessible with standard link behavior
- **Focus indicators**: Maintains visible focus states for keyboard users

## Best Practices

1. **Placement**: Typically placed at the end of collection item content
2. **Consistency**: Use the same navigation style across all collection items
3. **Visual hierarchy**: Ensure navigation doesn't compete with main content
4. **Mobile consideration**: Test navigation on smaller screens
5. **Loading states**: Consider adding loading indicators if items load dynamically
6. **SEO benefits**: Sequential navigation helps search engines understand content structure

## Conditional Rendering

The component automatically handles edge cases:
- **First item**: Only shows "Next" link
- **Last item**: Only shows "Previous" link
- **Single item**: Component doesn't render if no other items exist
- **Missing metadata**: Gracefully handles missing previous/next data
