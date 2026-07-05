# Rich Text Section Component

A fundamental and versatile text-focused section component designed for article content, documentation, announcements, and any text-heavy layouts. Features optimal reading experience with fluid typography, centered alignment, and comprehensive Markdown support.

## Features

- **Optimal Reading Experience**: Fluid width design with clamp-based responsive typography (45ch-80ch)
- **Centered Layout**: Automatic text centering for balanced visual presentation
- **Full Markdown Support**: Complete Markdown formatting in prose content
- **Flexible Text Hierarchy**: Lead-in, title, subtitle, and prose content structure
- **Configurable Headings**: Supports H1-H6 heading levels with proper semantic structure
- **CTA Integration**: Optional call-to-action buttons and links
- **Typography Flow**: Proper vertical rhythm and spacing between elements
- **Responsive Design**: Adapts gracefully across all screen sizes
- **Semantic HTML**: Clean, accessible markup for SEO and screen readers
- **Container Flexibility**: Works with and without container constraints

## Data Structure

```yaml
- sectionType: rich-text
  containerTag: article  # article, section, or div
  disabled: false
  id: ""
  classes: ""
  containerFields:
    inContainer: false
    isAnimated: true
    noMargin:
      top: true
      bottom: true
    noPadding:
      top: false
      bottom: false
    background:
      color: ""
      image: ""
      imageScreen: "none"
  text:
    leadIn: "Optional introductory text"
    title: "Main Section Title"
    titleTag: "h2"         # h1, h2, h3, h4, h5, h6
    subTitle: "Optional subtitle"
    prose: |-
      Your Markdown content goes here. Supports **bold**, *italic*,
      [links](https://example.com), and other Markdown formatting.
      
      Multiple paragraphs are fully supported.
      
      ### Subheadings
      
      - Lists work perfectly
      - Both unordered and ordered
      - With proper formatting
  ctas:
    - url: "https://example.com"
      label: "Call to Action"
      isButton: true
      buttonStyle: "primary"
    - url: "/secondary"
      label: "Learn More"
      isButton: false
```

## HTML Structure

```html
<div class="rich-text content container">
  <div class="text flow">
    
    <!-- Text Content -->
    <div class="prose flow">
      <!-- Lead-in (Optional) -->
      <p class="lead-in">Optional introductory text</p>
      
      <!-- Main Title -->
      <h2>Main Section Title</h2>
      
      <!-- Subtitle (Optional) -->
      <p class="sub-title">Optional subtitle</p>
      
      <!-- Prose Content -->
      <div class="prose">
        <p>Your Markdown content goes here. Supports <strong>bold</strong>, 
        <em>italic</em>, <a href="https://example.com">links</a>, and other 
        Markdown formatting.</p>
        
        <p>Multiple paragraphs are fully supported.</p>
        
        <h3>Subheadings</h3>
        
        <ul>
          <li>Lists work perfectly</li>
          <li>Both unordered and ordered</li>
          <li>With proper formatting</li>
        </ul>
      </div>
    </div>
    
    <!-- Call-to-Actions (Optional) -->
    <div class="ctas">
      <a class="cta button primary" href="https://example.com">Call to Action</a>
      <a class="cta link" href="/secondary">Learn More</a>
    </div>
    
  </div>
</div>
```

## CSS Architecture

### Fluid Reading Width
Uses clamp-based responsive design for optimal reading experience:
```css
.section-wrapper .rich-text > * {
  max-width: clamp(45ch, 65ch, 80ch);  /* Fluid reading width */
  margin-inline: auto;                 /* Center the text block */
}
```

### Typography Hierarchy
```css
.rich-text h1,
.rich-text h2,
.rich-text h3,
.rich-text .sub-title {
  margin-bottom: var(--space-s);
  
  & + div {
    margin-top: 0;  /* Remove extra spacing after headings */
  }
}
```

### CTA Layout
```css
.rich-text .ctas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-m-l);
  
  * {
    margin: 0;  /* Reset margins for clean spacing */
  }
}
```

### Reading Optimization
- **Character-based width**: 45-80 characters for optimal readability
- **Centered alignment**: Balanced visual presentation
- **Vertical rhythm**: Consistent spacing between elements
- **Responsive scaling**: Adapts to container and viewport constraints

## Usage Patterns

### Article Introduction
```yaml
- sectionType: rich-text
  containerTag: article
  text:
    leadIn: "Feature Article"
    title: "Understanding Modern Web Development"
    titleTag: "h1"
    subTitle: "A comprehensive guide to current practices"
    prose: |-
      In today's rapidly evolving web landscape, understanding modern 
      development practices is crucial for success. This guide will 
      walk you through the essential concepts and tools.
  ctas:
    - url: "/full-article"
      label: "Read Full Article"
      isButton: true
      buttonStyle: "primary"
```

### Documentation Section
```yaml
- sectionType: rich-text
  containerTag: section
  containerFields:
    inContainer: true
  text:
    title: "Getting Started"
    titleTag: "h2"
    prose: |-
      Follow these steps to begin using our platform:
      
      1. **Create an account** on our registration page
      2. **Verify your email** using the link we send you
      3. **Complete your profile** with relevant information
      4. **Start exploring** the features available to you
```

### Announcement
```yaml
- sectionType: rich-text
  containerFields:
    background:
      color: "#f0f8ff"
  text:
    leadIn: "Important Update"
    title: "New Features Available"
    titleTag: "h2"
    prose: |-
      We're excited to announce several new features that will enhance 
      your experience with our platform. These updates focus on 
      improving usability and performance.
  ctas:
    - url: "/whats-new"
      label: "See What's New"
      isButton: true
    - url: "/release-notes"
      label: "View Release Notes"
      isButton: false
```

### FAQ Answer
```yaml
- sectionType: rich-text
  containerTag: div
  classes: "faq-answer"
  text:
    title: "How do I reset my password?"
    titleTag: "h3"
    prose: |-
      To reset your password, follow these simple steps:
      
      1. Go to the login page
      2. Click "Forgot Password"
      3. Enter your email address
      4. Check your email for reset instructions
      5. Follow the link to create a new password
```

### About Section
```yaml
- sectionType: rich-text
  text:
    leadIn: "About Us"
    title: "Our Story"
    titleTag: "h2"
    subTitle: "Building better solutions since 2020"
    prose: |-
      We started with a simple mission: to create tools that make 
      people's work easier and more effective. Today, we serve 
      thousands of customers worldwide.
      
      ### Our Values
      
      - **Innovation**: Always pushing boundaries
      - **Quality**: Excellence in everything we do
      - **Support**: Standing behind our customers
  ctas:
    - url: "/team"
      label: "Meet the Team"
      isButton: true
      buttonStyle: "secondary"
```

## Content Structure

### Text Elements
- **leadIn**: Introductory text above the main title
- **title**: Main heading content (required)
- **titleTag**: HTML heading level (h1-h6)
- **subTitle**: Secondary text below the main title
- **prose**: Main content body with full Markdown support

### Markdown Support
The prose field supports comprehensive Markdown formatting:
- **Text formatting**: Bold, italic, strikethrough
- **Links**: Internal and external links
- **Lists**: Ordered and unordered lists
- **Headings**: H3-H6 subheadings within content
- **Code**: Inline code and code blocks
- **Blockquotes**: Quote formatting
- **Tables**: Markdown table syntax
- **Line breaks**: Paragraph and line break handling

### CTA Integration
- **Flexible positioning**: CTAs appear below text content
- **Multiple styles**: Button and link variants
- **Responsive layout**: Wraps and centers based on screen size

## Dependencies

- `text`: Core text rendering partial for structured content
- `ctas`: Call-to-action buttons and links rendering
- `commons`: Base container and styling utilities

## Customization

### Custom Classes
Add styling through component classes:
```yaml
classes: "featured-content highlight-section"
```

### Styling Hooks
Key CSS classes for customization:
- `.rich-text`: Main component container
- `.text`: Text content wrapper with flow layout
- `.prose`: Content area with Markdown output
- `.ctas`: Call-to-action container
- `.lead-in`: Lead-in text styling
- `.sub-title`: Subtitle styling

### Width Customization
Modify reading width for specific use cases:
```css
.wide-text .rich-text > * {
  max-width: clamp(60ch, 80ch, 100ch);
}

.narrow-text .rich-text > * {
  max-width: clamp(30ch, 45ch, 60ch);
}
```

### Typography Adjustments
Customize typography for different content types:
```css
.documentation .rich-text {
  font-size: var(--font-small);
  line-height: 1.6;
}

.featured-text .rich-text .title {
  font-size: var(--font-h1);
  color: var(--color-primary);
}
```

### Layout Variations
Create alternative layouts:
```css
.left-aligned .rich-text > * {
  margin-inline: 0;  /* Remove centering */
}

.full-width .rich-text > * {
  max-width: none;   /* Remove width constraints */
}
```

## Accessibility

- **Semantic Structure**: Proper heading hierarchy and HTML5 elements
- **Alt Text**: Comprehensive alt text for any embedded images
- **Link Context**: Clear link labeling in prose content
- **Reading Flow**: Logical content order for screen readers
- **Focus Management**: Proper keyboard navigation for CTAs
- **Color Contrast**: Sufficient contrast ratios for all text

## Best Practices

1. **Heading Hierarchy**: Use appropriate heading levels (h1 for page titles, h2-h6 for sections)
2. **Content Length**: Keep prose sections scannable with proper paragraph breaks
3. **CTA Placement**: Limit to 1-2 primary actions per text section
4. **Markdown Structure**: Use proper Markdown syntax for consistent formatting
5. **Reading Flow**: Structure content with clear introduction, body, and conclusion
6. **Responsive Testing**: Verify readability across different screen sizes

## SEO Benefits

- **Semantic HTML**: Proper heading structure aids search engine understanding
- **Clean Markup**: Optimized HTML output for search engine crawling
- **Content Structure**: Clear content hierarchy improves page ranking
- **Internal Linking**: Markdown links support internal site navigation
- **Mobile Optimization**: Responsive design improves mobile search rankings

## Performance Considerations

- **Minimal CSS**: Lightweight styling focused on typography
- **No JavaScript**: Pure CSS implementation for fast loading
- **Efficient Markup**: Clean HTML output without unnecessary elements
- **Font Optimization**: Uses system fonts and CSS custom properties
- **Layout Stability**: Consistent spacing prevents layout shifts

The rich-text component provides a solid foundation for content-focused sections while maintaining excellent readability, accessibility, and performance across all devices and use cases.