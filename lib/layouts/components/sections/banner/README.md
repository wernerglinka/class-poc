# Banner Section Component

A call-to-action banner section that can use either a background image or color. Perfect for highlighting important messages, promotions, or calls to action. This versatile component can also function as an accordion header when paired with accordion content sections.

## Features

- **Flexible Layout**: Supports rich-text, image-only, or combined layouts
- **Background Options**: Use either background images with customizable screen overlays or solid background colors
- **Container Control**: Configure full viewport width or restrict to content width
- **CTA Support**: Multiple call-to-action buttons or links with customizable styles
- **Accordion Mode**: Can function as an accordion header when using the `banner-accordion-header` class
- **Responsive Design**: Fluid layout that adapts to viewport size
- **Content Flexibility**: All text elements and CTAs are optional

## Data Structure

```yaml
- sectionType: banner
  containerTag: aside # or section, div
  classes: '' # Optional: use "banner-accordion-header" for accordion mode
  id: ''
  isDisabled: false
  isAnimated: true
  containerFields:
    inContainer: false # true restricts width to content width, false stretches across viewport
    noMargin:
      top: true
      bottom: true
    noPadding:
      top: false
      bottom: false
    background:
      color: '' # Optional: background color (e.g., '#333333')
      isDark: false # Set to true when using dark backgrounds
      image: '' # Optional: background image URL
      imageScreen: 'none' # Screen overlay: 'light', 'dark', or 'none'
  text:
    leadIn: ''
    title: 'Banner Title'
    titleTag: 'h2'
    subTitle: ''
    prose: |-
      Banner description text that can span
      multiple paragraphs in Markdown format.
  ctas:
    - url: 'https://example.com'
      label: 'Call to Action'
      isButton: true
      buttonStyle: 'primary'
    - url: 'https://example.com/more'
      label: 'Learn More'
      isButton: false
      buttonStyle: 'primary'
```

## HTML Structure

```html
<div class="container banner content">
  <!-- Text Content and CTAs -->
  <div class="text flow">
    <div class="prose flow">
      <p class="lead-in">Special Offer</p>
      <h2>Banner Title</h2>
      <p class="sub-title">Compelling subtitle</p>
      <div class="prose">Banner description...</div>
    </div>

    <div class="ctas flow">
      <a class="cta button primary" href="/get-started">Get Started</a>
      <a class="cta link" href="/learn-more">Learn More</a>
    </div>
  </div>
</div>
```

## CSS Architecture

### Layout Variations

- **Standard**: Default banner layout
- **Full Width**: Set `containerFields.inContainer: false` for viewport-wide banners
- **Accordion Header**: Use `classes: 'banner-accordion-header'` for accordion functionality

### Background Options

- **Image Backgrounds**: Configure with `containerFields.background.image`
- **Screen Overlays**: Use `imageScreen` property with values:
  - `'light'`: Light overlay for better text contrast on bright images
  - `'dark'`: Dark overlay for better text contrast on dark images
  - `'none'`: No overlay
- **Solid Colors**: Set `containerFields.background.color` with hex values
- **Dark Mode**: Set `isDark: true` when using dark backgrounds for proper text colors

## Usage Patterns

### Banner with Background Image

```yaml
- sectionType: banner
  containerTag: aside
  containerFields:
    inContainer: false
    background:
      image: '/assets/images/sample8.jpg'
      imageScreen: 'light' # Adds light overlay for better text contrast
  text:
    leadIn: 'With Background Image'
    title: CTA Banner Example
    titleTag: 'h2'
    subTitle: Uses light image screen for better text contrast
    prose: Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
  ctas:
    - url: 'https://apple.com'
      label: 'go to apple'
      isButton: true
      buttonStyle: 'primary'
    - url: 'https://ibm.com'
      label: 'go to big brother'
      isButton: false
```

### Banner with Background Color

```yaml
- sectionType: banner
  containerTag: aside
  containerFields:
    inContainer: false
    background:
      color: '#333333'
      isDark: true
  text:
    leadIn: 'With Background Color'
    title: CTA Banner Example
    titleTag: 'h2'
    prose: Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
  ctas:
    - url: 'https://apple.com'
      label: 'go to apple'
      isButton: true
      buttonStyle: 'primary'
```

### Accordion Header Banner

```yaml
# First, the accordion header using banner
- sectionType: banner
  containerTag: aside
  classes: 'banner-accordion-header'
  containerFields:
    inContainer: false
    background:
      image: '/assets/images/sample9.jpg'
      imageScreen: 'dark'
  text:
    title: Fancy Accordion Header
    titleTag: 'h3'

# Then, the accordion content
- sectionType: rich-text
  containerTag: article
  classes: 'banner-accordion-content is-closed'
  containerFields:
    inContainer: false
  text:
    prose: |-
      Etiam porta sem malesuada magna mollis euismod. 
      Vestibulum id ligula porta felis euismod semper.
```

## Dependencies

- `ctas`: For rendering call-to-action buttons and links
- `text`: For rendering text content (lead-in, title, subtitle, prose)
- `commons`: For shared utilities and base styles

## Customization

### Custom Classes

Add custom styling through the classes field:

```yaml
classes: 'custom-banner special-promotion'
```

### Styling Hooks

Key CSS classes for customization:

- `.banner`: Main container
- `.banner .content`: CTA banner specific styling
- `.text`: Text content container

## Accessibility

- Uses semantic HTML elements (`aside`, `section`)
- Proper heading hierarchy with configurable `titleTag`
- Alt text support for images
- Screen reader friendly CTA structure

## Key Properties

### Container Fields

- `containerFields.inContainer`: Controls width behavior
  - `true`: Restricts banner to content width
  - `false`: Stretches banner across full viewport width
- `containerFields.background.image`: Background image URL (optional)
- `containerFields.background.color`: Background color (optional)
- `containerFields.background.imageScreen`: Screen overlay for text readability
- `containerFields.background.isDark`: Set to `true` for dark backgrounds

### Content Fields

- `text`: Standard text block with leadIn, title, subtitle, and prose
- `ctas`: Array of call-to-action buttons or links

## Best Practices

1. **Use appropriate container tags**: `aside` for promotional content, `section` for main content
2. **Set proper background contrast**: Use `imageScreen` to ensure text readability over images
3. **Configure isDark correctly**: Set `isDark: true` when using dark backgrounds for proper text colors
4. **Keep CTAs focused**: Limit to 1-2 primary actions per banner
5. **Test responsively**: Verify banner appearance across different viewport sizes
6. **Accordion usage**: When using as accordion header, keep prose empty and pair with a `rich-text` section with `banner-accordion-content is-closed` classes
