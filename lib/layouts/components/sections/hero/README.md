# Hero Section Component

A flexible hero section component that supports full-screen layouts, background images, text content, and call-to-action buttons.

## Features

- **Flexible Layout**: Supports rich-text, image-only, or combined layouts
- **Full-Screen Mode**: Optional full-screen hero with scroll-to-next functionality
- **Background Images**: Configurable background images with optional screen overlays
- **Responsive Design**: Fluid text width that adapts to viewport size
- **Glass Effect**: Optional glass background effect for text content
- **Breadcrumb Integration**: Automatic breadcrumb rendering for non-hero pages
- **Reverse Layout**: Optional reverse layout for text positioning

## Data Structure

```yaml
- sectionType: hero
  containerTag: section
  disabled: false
  id: ''
  classes: ''
  isFullScreen: true # Enables full-screen mode with scroll button
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
      isDark: false
      color: ''
      image: '/assets/images/hero-bg.jpg'
      imageScreen: 'light' # light, dark, none
  reverse: false # Reverses text positioning
  text:
    leadIn: 'Welcome to'
    title: 'Hero Section Title'
    titleTag: 'h1'
    subTitle: 'Compelling subtitle'
    prose: |-
      Hero description text that can span
      multiple paragraphs in Markdown.
  ctas:
    - url: '/get-started'
      label: 'Get Started'
      isButton: true
      buttonStyle: 'primary'
    - url: '/learn-more'
      label: 'Learn More'
      isButton: false
  image:
    src: '/assets/images/hero-image.jpg'
    alt: 'Hero image description'
```

## HTML Structure

```html
<div class="container hero" role="banner" aria-label="Hero Section Title">
  <!-- Breadcrumbs (if not full-screen) -->
  <ul class="breadcrumbs" aria-label="Breadcrumb">
    <li><a href="/">Home</a></li>
    <li><span aria-current="page">Current Page</span></li>
  </ul>

  <!-- Optional Hero Image -->
  <div class="image">
    <img src="hero.jpg" alt="Description" />
  </div>

  <!-- Text Content -->
  <div class="text flow">
    <div class="flow">
      <p class="lead-in">Welcome to</p>
      <h1>Hero Section Title</h1>
      <p class="sub-title">Compelling subtitle</p>
      <div class="prose">Hero description...</div>
    </div>

    <div class="ctas flow">
      <a class="cta button primary" href="/get-started">Get Started</a>
      <a class="cta link" href="/learn-more">Learn More</a>
    </div>
  </div>

  <!-- Full-Screen Scroll Button -->
  <a class="full-screen" href="#first-section" aria-label="Scroll to next section">
    <svg><!-- arrow-down icon --></svg>
    <span class="sr-only">Scroll to next section</span>
  </a>
</div>
```

## CSS Architecture

### Responsive Text Width

Uses fluid design principles for optimal reading experience:

- Below 600px: 100% width
- Above 600px: Gradually reduces to minimum 60% width
- Formula: `calc(100% - clamp(0px, calc((100vw - 600px) * 2), 40%))`

### Layout Variations

- **Standard**: Text positioned over background image
- **Reverse**: Text positioned to the right (via `is-reverse` class)
- **Full-Screen**: Takes full viewport height with scroll button
- **Merge Mode**: Removes bottom margin to merge with next section

### Glass Effect

Optional glass background effect for text content:

- Semi-transparent background
- Backdrop blur filter
- Subtle box shadow
- Rounded corners

## Dependencies

- `ctas`: For rendering call-to-action buttons and links
- `text`: For rendering text content (lead-in, title, subtitle, prose)
- `image`: For rendering responsive images
- `breadcrumbs`: For navigation breadcrumbs
- `commons`: For shared utilities and base styles

## Customization

### Custom Classes

Add custom styling through the classes field:

```yaml
classes: 'main-hero custom-styling'
```

### Styling Hooks

Key CSS classes for customization:

- `.hero`: Main container
- `.hero.is-reverse`: Reversed layout
- `.text`: Text content container
- `.full-screen`: Scroll button
- `.sr-only`: Screen reader only content
