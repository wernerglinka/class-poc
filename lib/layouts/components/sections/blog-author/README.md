# Blog Author Section Component

A comprehensive author profile component designed to showcase blog post authors with biographical information, social links, and areas of expertise. The component looks up author details from centralized author metadata based on the author's name, ensuring consistent author information across all blog posts.

## Features

- **Centralized Author Data**: Author information stored in `data/author` and referenced by name
- **Author Portrait**: Circular profile image with customizable border styling
- **Professional Information**: Name, title, and company display
- **Social Media Links**: Configurable social media profile links with icons
- **Biography Section**: Rich text area for author biography
- **Expertise Display**: Tag-based list of expertise areas
- **Responsive Layout**: Adapts gracefully to different screen sizes
- **Reversible Layout**: Option to switch profile and bio positions
- **Container Integration**: Works with standard container system

## Data Structure

### Blog Post Section Configuration
In blog post markdown files, reference the author by name:

```yaml
# In blog post frontmatter
- sectionType: blog-author
  containerTag: section  # section, article, or aside
  disabled: false
  id: ""
  classes: ""
  isReverse: false  # Swap profile and bio positions
  name: "Jane Doe"  # Must match name in data/author
  containerFields:
    inContainer: false
    isAnimated: true
    noMargin:
      top: false
      bottom: false
    noPadding:
      top: false
      bottom: false
    background:
      isDark: false
      color: ""
      image: ""
      imageScreen: "none"  # light, dark, none
```

### Author Metadata Structure
In `data/author.json` or `data/author.yaml`:

```yaml
# data/author.yaml
- name: "Jane Doe"  # This name must match 'name' field in blog posts
  title: "Senior Technical Writer"
  company: "Tech Company Inc."
  portrait:
    src: "/assets/images/authors/jane-doe.jpg"
    alt: "Jane Doe"
    caption: ""
  bio: |
    Jane is a senior technical writer with over 10 years of experience 
    in creating clear, concise documentation for complex software systems. 
    She specializes in API documentation and developer guides.
  expertise:
    - "Technical Writing"
    - "API Documentation"
    - "Developer Relations"
    - "Content Strategy"
    - "Information Architecture"
  social:
    - platform: "Twitter"
      url: "https://twitter.com/janedoe"
      icon: "<svg>...</svg>"  # Optional SVG icon
    - platform: "LinkedIn"
      url: "https://linkedin.com/in/janedoe"
      icon: "<svg>...</svg>"
    - platform: "GitHub"
      url: "https://github.com/janedoe"
      icon: "<svg>...</svg>"

- name: "John Smith"
  title: "Lead Developer"
  company: "Tech Corp"
  portrait:
    src: "/assets/images/authors/john-smith.jpg"
    alt: "John Smith"
  bio: "John has been developing software for over 15 years..."
  expertise:
    - "JavaScript"
    - "React"
    - "Node.js"
  social:
    - platform: "GitHub"
      url: "https://github.com/johnsmith"
```

## HTML Structure

```html
<div class="blog-author content container">
  
  <!-- Author Profile Section -->
  <div class="author-profile">
    <!-- Profile Portrait -->
    <div class="portrait">
      <img src="/assets/images/authors/jane-doe.jpg" alt="Jane Doe">
    </div>
    
    <!-- Author Info -->
    <div class="author-info">
      <div class="name">Jane Doe</div>
      <div class="title">Senior Technical Writer</div>
      <div class="company">Tech Company Inc.</div>
      
      <!-- Social Links -->
      <div class="social-links">
        <a href="https://twitter.com/janedoe" 
           class="social-link" 
           aria-label="Twitter" 
           target="_blank" 
           rel="noopener noreferrer">
          <span class="social-icon"><!-- SVG icon --></span>
        </a>
        <!-- Additional social links... -->
      </div>
    </div>
  </div>
  
  <!-- Author Biography Section -->
  <div class="author-bio">
    <div class="bio-text">
      <p>Jane is a senior technical writer with over 10 years of experience...</p>
    </div>
    
    <!-- Expertise Areas -->
    <div class="expertise">
      <h3>Areas of Expertise</h3>
      <ul class="expertise-list">
        <li>Technical Writing</li>
        <li>API Documentation</li>
        <li>Developer Relations</li>
        <!-- Additional expertise items... -->
      </ul>
    </div>
  </div>
  
</div>
```

## CSS Architecture

### Layout Structure
Implements the Every Layout Switcher pattern for responsive layout:
```css
.blog-author {
  --threshold: 50ch !important; /* Controls when layout switches */
  row-gap: var(--content-gap, 2rem);
  padding: var(--space-l-2xl);
}
```

The component inherits the Switcher pattern from the `.content` class in commons.css, which automatically switches between horizontal and vertical layouts based on the container width and the threshold value.

### Portrait Styling
Circular profile image with border:
```css
.portrait {
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-border-light);
}
```

### Social Links
Interactive circular social media buttons:
```css
.social-link {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}
```

### Expertise Tags
Pill-shaped expertise indicators:
```css
.expertise-list li {
  padding: var(--space-xs) var(--space-s);
  border-radius: var(--radius-full);
  background-color: var(--color-white);
  border: 1px solid var(--color-border-light);
}
```

### Responsive Behavior
- **Switcher Pattern**: Automatically switches between horizontal and vertical layouts
- **Threshold**: Set to `50ch` - switches based on container width relative to character width
- **Horizontal Layout**: When container is wider than threshold
- **Vertical Layout**: When container is narrower than threshold, with `row-gap` spacing
- **Text-Responsive**: Using `ch` units means the breakpoint adapts to font size

## Usage Patterns

### Basic Author Profile
In blog post:
```yaml
- sectionType: blog-author
  containerTag: section
  name: "John Smith"  # References data/author entry
```

### With Custom Styling
```yaml
- sectionType: blog-author
  containerTag: article
  name: "Sarah Johnson"
  classes: "featured-author"
  containerFields:
    background:
      color: "#f8f9fa"
```

### Reversed Layout
```yaml
- sectionType: blog-author
  isReverse: true  # Bio appears before profile
  name: "Jane Doe"
```

### Dark Background Theme
```yaml
- sectionType: blog-author
  name: "John Smith"
  containerFields:
    background:
      isDark: true
      color: "#1a1a1a"
```

## Dependencies

- `text`: Handles rich text rendering for biography
- `image`: Manages portrait image display
- `commons`: Provides base container and styling utilities

## Integration Requirements

### Metalsmith Configuration
Ensure that author data is loaded into Metalsmith's metadata:

```javascript
// In metalsmith.js
const author = require('./data/author.json');
// or load YAML
const yaml = require('js-yaml');
const fs = require('fs');
const author = yaml.load(fs.readFileSync('./data/author.yaml', 'utf8'));

metalsmith
  .metadata({
    author: author,
    // other metadata...
  })
```

### Author Data File Structure
Create `data/author.json` or `data/author.yaml` with your author data:

```yaml
# data/author.yaml
- name: "Full Name"  # This must match 'name' field in blog posts
  title: "Professional Title"
  company: "Company Name"
  portrait:
    src: "/path/to/image.jpg"
    alt: "Alt text"
  bio: "Biography text..."
  expertise: ["Skill 1", "Skill 2"]
  social: [...]
```

### Social Media Icons
Social links can include custom SVG icons or rely on text labels:
```yaml
social:
  - platform: "Twitter"
    url: "https://twitter.com/handle"
    icon: '<svg>...</svg>'  # Optional custom icon
```

## Customization

### Custom Classes
Add styling through component classes:
```yaml
classes: "featured-author custom-profile"
```

### Styling Hooks
Key CSS classes for customization:
- `.blog-author`: Main component container
- `.author-profile`: Profile section wrapper
- `.portrait`: Profile image container
- `.author-info`: Text information wrapper
- `.social-links`: Social media links container
- `.author-bio`: Biography section
- `.expertise`: Expertise area section
- `.expertise-list`: Skills tags container

### Color Customization
Override default colors with CSS variables:
```css
.blog-author {
  --color-heading: #2c3e50;
  --color-text-secondary: #6c757d;
  --color-border-light: #e9ecef;
  --color-background-secondary: #f8f9fa;
}
```

### Layout Modifications
Adjust the switcher threshold and spacing:
```css
.custom-profile {
  --threshold: 60ch; /* Switch layout at different width */
  row-gap: 3rem; /* Adjust vertical spacing */
}

.custom-profile .portrait {
  width: 12rem;
  height: 12rem;
}

.custom-profile .author-bio {
  max-width: 75ch;
}
```

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and structure
- **ARIA Labels**: Social links include platform-specific labels
- **Link Attributes**: External links use `target="_blank"` with `rel="noopener noreferrer"`
- **Alt Text**: Portrait images include descriptive alt text
- **Focus States**: Interactive elements have visible focus indicators
- **Keyboard Navigation**: Full keyboard support for all interactive elements

## Best Practices

1. **Image Optimization**: Use appropriately sized portrait images (400x400px recommended)
2. **Biography Length**: Keep biographies concise (150-300 words)
3. **Expertise Tags**: Limit to 5-8 most relevant skills
4. **Social Links**: Include only active, professional social profiles
5. **Consistent Data**: Ensure author data is consistent across all posts
6. **Mobile First**: Test layout on mobile devices for optimal display
7. **Icon Consistency**: Use consistent icon style across social links

## Performance Considerations

- **Lazy Loading**: Consider lazy loading portrait images
- **Icon Optimization**: Use optimized SVG icons for social links
- **CSS Containment**: Component uses overflow hidden for layout stability
- **Minimal JavaScript**: Pure CSS implementation for better performance

## Examples

### Blog Post Author Box
Place at the end of blog posts to provide author context:
```yaml
# At the end of blog post sections
- sectionType: blog-author
  containerFields:
    background:
      color: "#f8f9fa"
  author: 
    # Use post's author data
```

### Author Archive Page
Create dedicated author pages with full profiles:
```yaml
# author-page.md
- sectionType: blog-author
  isReverse: false
  author:
    # Complete author profile
```

### Team Member Profile
Adapt for team or about pages:
```yaml
- sectionType: blog-author
  classes: "team-member"
  author:
    # Team member data
```