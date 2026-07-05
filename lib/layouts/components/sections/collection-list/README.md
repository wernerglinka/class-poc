# Blog List Section Component

A responsive blog listing component that displays a grid of blog post cards with pagination support. Designed to render collections of blog posts in an organized, accessible format with automatic pagination and responsive layout.

## Features

- **Responsive Grid Layout**: Automatically adjusts to screen size with CSS Grid
- **Pagination Support**: Integrated pagination for large blog collections
- **Card-Based Design**: Individual blog posts displayed as clickable cards
- **Flexible Card Types**: Supports both horizontal and vertical card layouts
- **Author and Date Display**: Built-in author and publication date information
- **Image Thumbnails**: Automatic thumbnail display for blog post images
- **Collection Integration**: Works seamlessly with Metalsmith blog collections
- **Excerpt Support**: Displays blog post excerpts with proper formatting

## Data Structure

```yaml
- sectionType: blog-list
  containerTag: section  # section, article, or aside
  disabled: false
  id: ""
  classes: ""
  containerFields:
    inContainer: false
    isAnimated: true
    noMargin:
      top: true
      bottom: false
    noPadding:
      top: false
      bottom: false
    background:
      isDark: true
      color: ""
      image: ""
      imageScreen: "none"  # light, dark, none
  hasPagingParams: true
  pagingParams:
    blockClass: ""          # Optional CSS class for styling
    horizontal: false       # Enable horizontal card layout
    numberOfBlogs: ""       # Total number of blog posts (auto-populated)
    numberOfPages: ""       # Total pages needed (auto-populated)
    pageLength: ""          # Posts per page (auto-populated)
    pageStart: ""           # Starting index for current page (auto-populated)
    pageNumber: ""          # Current page number (auto-populated)
```

## HTML Structure

```html
<div class="container block-all-blogposts">
  
  <!-- Top Pagination (if multiple pages) -->
  <nav class="blog-pagination" aria-label="Blog pagination">
    <ol class="pagination-list">
      <li><a href="/blog/">1</a></li>
      <li><a href="/blog/page/2/" aria-current="page">2</a></li>
      <li><a href="/blog/page/3/">3</a></li>
    </ol>
  </nav>
  
  <!-- Blog Post Grid -->
  <ul class="blog-list">
    <li class="simple-card">
      <a href="/blog/post-url/">
        <div class="image-wrapper">
          <img src="/assets/images/post-thumbnail.jpg" alt="Post Title">
        </div>
        <div class="text-wrapper flow">
          <h3 class="title">Blog Post Title</h3>
          <div class="author-date is-vertical">
            <span class="author">Author Name</span>
            <time datetime="2023-01-01">January 1, 2023</time>
          </div>
          <div class="prose">Post excerpt text...</div>
        </div>
      </a>
    </li>
    <!-- Additional blog cards... -->
  </ul>
  
  <!-- Bottom Pagination (if multiple pages) -->
  <nav class="blog-pagination" aria-label="Blog pagination">
    <!-- Same structure as top pagination -->
  </nav>
  
</div>
```

## CSS Architecture

### Grid Layout
Uses CSS Grid for responsive blog post arrangement:
```css
.blog-list {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  list-style: none;
  padding: 0;
  margin: 0;
}
```

### Responsive Behavior
- **Auto-fitting columns**: Automatically adjusts number of columns based on screen width
- **Minimum card width**: 250px minimum ensures readability on smaller screens
- **Flexible scaling**: Cards grow proportionally to fill available space
- **Gap consistency**: 1rem spacing between all cards

### Card Layout Options
- **Vertical Cards** (default): Image on top, content below
- **Horizontal Cards**: Image and content side-by-side (enabled via `horizontal: true`)

## Usage Patterns

### Basic Blog Listing
```yaml
- sectionType: blog-list
  containerTag: section
  containerFields:
    inContainer: false
    background:
      isDark: false
  hasPagingParams: true
  pagingParams:
    horizontal: false
```

### Horizontal Card Layout
```yaml
- sectionType: blog-list
  containerTag: section
  pagingParams:
    horizontal: true
    blockClass: "featured-posts"
```

### Custom Styling
```yaml
- sectionType: blog-list
  classes: "featured-blog-section"
  containerFields:
    background:
      color: "#f8f9fa"
  pagingParams:
    blockClass: "custom-cards"
```

## Blog Post Data Requirements

Each blog post in the collection should include:

```yaml
# In individual blog post frontmatter
card:
  title: "Blog Post Title"
  excerpt: "Post excerpt or summary text"
  image: "/assets/images/post-thumbnail.jpg"
  date: "2023-01-01"
  author: "Author Name"
```

## Dependencies

- `card`: Renders individual blog post cards
- `author-date`: Displays author and publication date information
- `blog-pagination`: Handles pagination navigation
- `commons`: Provides base container and styling utilities

## Integration Requirements

### Metalsmith Blog Lists Plugin
This component requires the `metalsmith-blog-lists` plugin to:
- Calculate pagination parameters
- Populate `pagingParams` with current values
- Handle page-based routing for blog listings

### Collection Setup
Requires a properly configured blog collection in Metalsmith:
```javascript
// In metalsmith.js
.use(collections({
  blog: {
    pattern: 'blog/**/*.md',
    sortBy: 'date',
    reverse: true
  }
}))
```

## Customization

### Custom Classes
Add styling through component classes:
```yaml
classes: "featured-blogs custom-grid"
pagingParams:
  blockClass: "special-cards"
```

### Styling Hooks
Key CSS classes for customization:
- `.blog-list`: Main grid container
- `.simple-card`: Individual card wrapper
- `.simple-card.is-horizontal`: Horizontal card layout
- `.block-all-blogposts`: Component wrapper
- `.text-wrapper`: Card content area
- `.image-wrapper`: Card image area

### Layout Customization
Override grid behavior with custom CSS:
```css
.custom-grid .blog-list {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 2rem;
}
```

## Accessibility

- **Semantic HTML**: Uses proper list structure (`ul`/`li`)
- **Navigation landmarks**: Pagination wrapped in `nav` elements
- **Link context**: Full blog post content accessible via card links
- **Image alt text**: Automatic alt text from post titles
- **Date formatting**: Proper `datetime` attributes for publication dates
- **Aria labels**: Pagination includes appropriate aria labels

## Best Practices

1. **Optimize thumbnails**: Use appropriately sized images for card thumbnails
2. **Consistent excerpts**: Maintain similar excerpt lengths for visual consistency
3. **Pagination configuration**: Set reasonable page lengths (8-12 posts typically)
4. **Performance**: Consider lazy loading for images on pages with many posts
5. **SEO**: Ensure proper heading hierarchy within blog post content
6. **Content structure**: Use consistent frontmatter structure across all blog posts