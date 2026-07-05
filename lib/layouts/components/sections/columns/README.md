# Columns Section Component

A flexible multi-column section component that enables custom layouts by composing different content blocks. Each column can contain one or more blocks like text, images, or CTAs, providing maximum layout flexibility and reusability.

## Features

- **Multi-Column Layouts**: Create custom column arrangements (2, 3, or more columns)
- **Flexible Block System**: Combine text, images, and CTAs within columns
- **Reverse Direction**: Optional column order reversal
- **Custom Column Classes**: Individual styling control for each column
- **Built-in Layout Presets**: Pre-configured layouts like text-image-cta and image galleries
- **Container Query Support**: Responsive behavior using modern CSS container queries
- **Composition Architecture**: Reusable blocks that can be mixed and matched
- **Unsupported Block Handling**: Graceful handling of unknown block types

## Data Structure

```yaml
- sectionType: columns
  containerTag: section  # section, article, or div
  disabled: false
  id: ""
  classes: "text-image-cta"  # Pre-built layout classes
  containerFields:
    inContainer: true
    isAnimated: true
    noMargin:
      top: false
      bottom: true
    noPadding:
      top: true
      bottom: true
    background:
      isDark: false
      color: "#f8f8f8"
      image: ""
      imageScreen: "none"
  columnsDirection: "normal"  # normal or reverse
  contentClasses: ""          # Additional classes for content wrapper
  columns:
    - column:
        columnClasses: "text flow"
        blocks:
          - text:
              leadIn: "See what we have here"
              title: "Column Title"
              titleTag: "h2"
              subTitle: "Column subtitle"
              prose: |-
                This is multi-column content that can include
                rich text formatting and multiple paragraphs.
    - column:
        columnClasses: "image"
        blocks:
          - image:
              src: "/assets/images/sample.jpg"
              alt: "Image description"
              caption: "Optional image caption"
    - column:
        columnClasses: "ctas align-center"
        blocks:
          - ctas:
              - url: "/action"
                label: "Take Action"
                isButton: true
                buttonStyle: "primary"
```

## HTML Structure

```html
<div class="columns content text-image-cta cols3">
  
  <!-- Text Column -->
  <div class="column text flow">
    <div class="prose flow">
      <p class="lead-in">See what we have here</p>
      <h2>Column Title</h2>
      <p class="sub-title">Column subtitle</p>
      <div class="prose">Multi-column content...</div>
    </div>
  </div>
  
  <!-- Image Column -->
  <div class="column image">
    <figure>
      <img src="/assets/images/sample.jpg" alt="Image description">
      <figcaption>Optional image caption</figcaption>
    </figure>
  </div>
  
  <!-- CTA Column -->
  <div class="column ctas align-center">
    <div class="ctas flow">
      <a class="cta button primary" href="/action">Take Action</a>
    </div>
  </div>
  
</div>
```

## CSS Architecture

### Automatic Column Classes
The component automatically adds classes based on structure:
- `cols2`, `cols3`, `cols4`: Based on number of columns
- `reverse`: When `columnsDirection: "reverse"`

### Built-in Layout Presets

#### Text-Image-CTA Layout
```css
.text-image-cta {
  .text {
    flex-grow: 2;  /* Text takes more space */
  }
  
  .image,
  .ctas {
    flex-grow: 1;  /* Image and CTAs equal space */
  }
  
  .ctas {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-block: var(--space-xl-2xl);
  }
}
```

#### Hero-CTA Layout
Special layout for hero combinations with visual enhancements:
```css
.hero-cta .content {
  container-type: inline-size;
  box-shadow: 0 2px 4px var(--color-shadow);
  border-radius: var(--space-2xs-xs);
  background-color: var(--color-text-highlight-light);
}
```

#### Container Queries
Responsive behavior using modern CSS:
```css
@container (max-width: 60rem) {
  .hero-cta .content .column.image {
    display: none;  /* Hide image on smaller containers */
  }
}
```

## Block Types

### Supported Blocks
The component supports these block types within columns:

#### Text Block
```yaml
- text:
    leadIn: "Optional lead-in text"
    title: "Block Title"
    titleTag: "h2"
    subTitle: "Optional subtitle"
    prose: |-
      Rich text content with Markdown support.
      Can include multiple paragraphs.
```

#### Image Block
```yaml
- image:
    src: "/assets/images/example.jpg"
    alt: "Descriptive alt text"
    caption: "Optional caption text"
```

#### CTAs Block
```yaml
- ctas:
    - url: "/action"
      label: "Button Text"
      isButton: true
      buttonStyle: "primary"
    - url: "/secondary"
      label: "Link Text"
      isButton: false
```

### Unsupported Block Handling
Unknown block types display an error message:
```html
<p>Unsupported block type: [type-name]</p>
```

## Usage Patterns

### Basic Two-Column Layout
```yaml
- sectionType: columns
  classes: "basic-two-column"
  columns:
    - column:
        columnClasses: "text"
        blocks:
          - text:
              title: "Left Column"
              prose: "Content for the left side."
    - column:
        columnClasses: "text"
        blocks:
          - text:
              title: "Right Column"
              prose: "Content for the right side."
```

### Text-Image-CTA Layout
```yaml
- sectionType: columns
  classes: "text-image-cta"
  containerFields:
    inContainer: true
    background:
      color: "#f8f8f8"
  columns:
    - column:
        columnClasses: "text flow"
        blocks:
          - text:
              title: "Featured Content"
              prose: "Compelling description"
    - column:
        columnClasses: "image"
        blocks:
          - image:
              src: "/assets/images/feature.jpg"
              alt: "Feature illustration"
    - column:
        columnClasses: "ctas align-center"
        blocks:
          - ctas:
              - url: "/learn-more"
                label: "Learn More"
                isButton: true
                buttonStyle: "primary"
```

### Image Gallery Layout
```yaml
- sectionType: columns
  classes: "image-gallery"
  columns:
    - column:
        columnClasses: "image"
        blocks:
          - image:
              src: "/assets/images/gallery1.jpg"
              alt: "Gallery image 1"
    - column:
        columnClasses: "image"
        blocks:
          - image:
              src: "/assets/images/gallery2.jpg"
              alt: "Gallery image 2"
    - column:
        columnClasses: "image"
        blocks:
          - image:
              src: "/assets/images/gallery3.jpg"
              alt: "Gallery image 3"
```

### Mixed Content Columns
```yaml
- sectionType: columns
  columns:
    - column:
        columnClasses: "text-and-cta"
        blocks:
          - text:
              title: "Multi-Block Column"
              prose: "This column has multiple blocks."
          - ctas:
              - url: "/action"
                label: "Take Action"
                isButton: true
    - column:
        columnClasses: "images"
        blocks:
          - image:
              src: "/assets/images/hero.jpg"
              alt: "Hero image"
          - image:
              src: "/assets/images/secondary.jpg"
              alt: "Secondary image"
```

## Layout Presets

### Text-Image-CTA
- **Purpose**: Product features, service highlights
- **Structure**: Text content, supporting image, call-to-action
- **Flexbox ratios**: Text (2:1), Image (1:1), CTA (1:1)

### Image Gallery
- **Purpose**: Portfolio displays, product showcases
- **Structure**: Multiple equal-width image columns
- **Responsive**: Columns stack on smaller screens

### Hero-CTA
- **Purpose**: Enhanced hero sections with overlays
- **Structure**: Image, text content, prominent CTA
- **Features**: Box shadows, rounded corners, background colors
- **Responsive**: Hides image on smaller containers

## Dependencies

- `text`: Renders text content within blocks
- `image`: Renders image content within blocks
- `ctas`: Renders call-to-action buttons and links
- `commons`: Provides base container and styling utilities

## Customization

### Custom Classes
Add styling through component and column classes:
```yaml
classes: "custom-layout special-styling"
contentClasses: "enhanced-content"
columns:
  - column:
      columnClasses: "highlighted-column custom-text"
```

### Styling Hooks
Key CSS classes for customization:
- `.columns`: Main container
- `.columns.cols[n]`: Number-based column classes
- `.columns.reverse`: Reversed column order
- `.column`: Individual column wrapper
- `.column.[custom-classes]`: Custom column styling
- `.[content-classes]`: Content wrapper styling

### Creating Custom Layouts
Define new layout presets:
```css
.custom-layout {
  .column.featured {
    flex-grow: 3;
    background: var(--color-accent);
  }
  
  .column.sidebar {
    flex-grow: 1;
    padding: var(--space-m);
  }
}
```

### Container Queries
Use modern responsive techniques:
```css
.custom-layout {
  container-type: inline-size;
}

@container (max-width: 768px) {
  .custom-layout .column {
    flex-basis: 100%;
  }
}
```

## Accessibility

- **Semantic Structure**: Uses appropriate heading hierarchy within text blocks
- **Image Alt Text**: Required alt attributes for all images
- **Link Context**: Clear CTA labeling and button semantics
- **Content Flow**: Logical reading order maintained across columns
- **Focus Management**: Proper tab order through interactive elements

## Best Practices

1. **Logical Column Order**: Arrange columns in reading order for accessibility
2. **Consistent Block Types**: Use similar block combinations across sections
3. **Image Optimization**: Provide appropriate image sizes for column layouts
4. **Content Balance**: Distribute content evenly across columns
5. **Mobile-First**: Design columns to stack gracefully on smaller screens
6. **Performance**: Limit the number of blocks per column for optimal rendering
7. **Semantic Headers**: Use proper heading hierarchy within text blocks

## Advanced Features

### Multiple Blocks per Column
Combine different content types within a single column:
```yaml
- column:
    columnClasses: "rich-content"
    blocks:
      - text:
          title: "Section Title"
      - image:
          src: "/assets/images/inline.jpg"
      - text:
          prose: "Additional content after image"
      - ctas:
          - url: "/action"
            label: "Final CTA"
```

### Dynamic Column Classes
Use column classes to create specialized layouts:
```yaml
- column:
    columnClasses: "featured highlight-box centered-content"
    blocks:
      - text:
          title: "Featured Content"
```

This flexible architecture makes the composed section one of the most powerful components for creating custom, maintainable page layouts.