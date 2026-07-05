# Multi-Media Section Component

A flexible section component that renders text content alongside various media types. Supports images, videos, audio, icons, and Lottie animations with reversible layouts and responsive behavior.

## Supported Media Types

- **image**: Static images with optional captions
- **video**: YouTube, Vimeo, or self-hosted videos (inSitu or modal display)
- **audio**: MP3/OGG audio with background image
- **icon**: SVG icons from the component library
- **lottie**: JSON animations with playback controls

## Data Structure

```yaml
- sectionType: multi-media
  containerTag: aside  # aside, section, or div
  disabled: false
  id: ""
  classes: ""
  isReverse: false     # Reverses media/text positioning
  mediaType: image     # Required: 'image', 'video', 'audio', 'icon', or 'lottie'
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
      color: ""
      image: ""
      imageScreen: "none"  # light, dark, none
  text:
    leadIn: "Optional lead-in text"
    title: "Section Title"
    titleTag: "h2"
    isCentered: false
    subTitle: "Optional subtitle"
    prose: "Markdown-formatted content"
  ctas:
    - url: "https://example.com"
      label: "Learn More"
      isButton: true
      buttonStyle: "primary"
```

## Media Type Properties

### Image
```yaml
mediaType: image
image:
  src: "/assets/images/example.jpg"
  alt: "Descriptive alt text"
  caption: "Optional caption"
```

### Video
```yaml
mediaType: video
video:
  inSitu: true          # true for inSitu, false for modal
  src: youtube          # 'youtube', 'vimeo', or video file path
  id: "VIDEO_ID"        # For YouTube/Vimeo
  tn: "/assets/images/thumbnail.jpg"  # Thumbnail for modal
```

### Audio
```yaml
mediaType: audio
audio:
  bgImage: "/assets/images/audio-bg.jpg"
  ogg: "/assets/audio/sample.ogg"
  mpeg: "/assets/audio/sample.mp3"
```

### Icon
```yaml
mediaType: icon
icon:
  icon: "feather"       # Icon identifier
  title: "Icon Title"   # For accessibility
  url: ""               # Optional link
```

### Lottie Animation
```yaml
mediaType: lottie
lottie:
  src: "/assets/lotties/animation.json"
  control:
    autoplay: true
    loop: true
```

## HTML Structure

```html
<div class="multi-media content">
  
  <!-- Media Container -->
  <div class="media-wrapper">
    <!-- Rendered based on mediaType -->
  </div>
  
  <!-- Text Container -->
  <div class="text flow">
    <div class="prose flow">
      <p class="lead-in">Lead-in text</p>
      <h2>Title</h2>
      <p class="sub-title">Subtitle</p>
      <div class="prose">Content</div>
    </div>
    
    <div class="ctas flow">
      <a class="cta button primary" href="#">CTA</a>
    </div>
  </div>
  
</div>
```

## CSS Architecture

### Layout Structure
Uses the Every Layout Switcher pattern for responsive behavior:
```css
.section-wrapper .multi-media.content {
  --threshold: 50rem;  /* Breakpoint for layout switch */
  container-type: inSitu-size;
}
```

### Container Queries
Fine-tuned responsive adjustments:
```css
@container (max-width: 50rem) {
  .text {
    /* Stacked layout adjustments */
  }
}
```

### Layout Variations
- **Standard**: Media left, text right
- **Reverse**: Media right, text left (`isReverse: true`)
- **Responsive**: Stacks vertically below 50rem

## Component Dependencies

### Required Partials
- `text`: Renders text content
- `ctas`: Renders call-to-action buttons/links
- `image`: Image rendering (when `mediaType: image`)
- `video`: Video player (when `mediaType: video`)
- `audio`: Audio player (when `mediaType: audio`)
- `icon`: Icon rendering (when `mediaType: icon`)
- `lottie`: Animation player (when `mediaType: lottie`)

### Manifest Structure
```json
{
  "name": "multi-media",
  "version": "1.0.0",
  "description": "Section with text and various media types",
  "author": "Werner Glinka",
  "license": "MIT",
  "dependencies": {
    "audio": "^1.0.0",
    "ctas": "^1.0.0",
    "icon": "^1.0.0",
    "image": "^1.0.0",
    "lottie": "^1.0.0",
    "text": "^1.0.0",
    "video": "^1.0.0"
  }
}
```

## Usage Examples

### Image with Caption
```yaml
- sectionType: multi-media
  mediaType: image
  text:
    title: "Feature Overview"
    prose: "Detailed description of the feature"
  image:
    src: "/assets/images/feature.jpg"
    alt: "Feature screenshot"
    caption: "Figure 1: Feature in action"
```

### inSitu Video
```yaml
- sectionType: multi-media
  mediaType: video
  isReverse: true
  text:
    title: "Video Tutorial"
    prose: "Learn how to use this feature"
  video:
    inSitu: true
    src: youtube
    id: "dQw4w9WgXcQ"
```

### Audio with Background
```yaml
- sectionType: multi-media
  mediaType: audio
  text:
    title: "Podcast Episode"
    prose: "Listen to our latest episode"
  audio:
    bgImage: "/assets/images/podcast-bg.jpg"
    mpeg: "/assets/audio/episode.mp3"
    ogg: "/assets/audio/episode.ogg"
```

### Icon Feature
```yaml
- sectionType: multi-media
  mediaType: icon
  text:
    title: "Security Features"
    prose: "Enterprise-grade security"
  icon:
    icon: "shield"
    title: "Security Shield"
```

### Lottie Animation
```yaml
- sectionType: multi-media
  mediaType: lottie
  isReverse: true
  text:
    title: "Interactive Experience"
    prose: "Engaging animations enhance UX"
  lottie:
    src: "/assets/lotties/interaction.json"
    control:
      autoplay: true
      loop: false
```

## Responsive Behavior

- **Above 50rem**: Side-by-side layout
- **Below 50rem**: Stacked layout (media above text)
- **Container Queries**: Component-level responsiveness
- **Lazy Loading**: Media assets load on demand

## Performance Considerations

1. **Image Optimization**: Use appropriate formats (WebP, AVIF)
2. **Video Thumbnails**: Provide thumbnails for modal videos
3. **Audio Formats**: Include both OGG and MP3 for compatibility
4. **Lottie File Size**: Keep animation files under 100KB
5. **Icon Loading**: Icons are inSitud as SVG

## Accessibility

- **Alt Text**: Required for images
- **Video Captions**: Support for closed captions
- **Audio Transcripts**: Link to transcripts when available
- **Icon Titles**: Descriptive titles for screen readers
- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labeling for interactive elements

## Browser Support

- **Container Queries**: Chrome 105+, Firefox 110+, Safari 16+
- **Video Formats**: H.264 for broad compatibility
- **Audio Formats**: MP3 fallback for older browsers
- **Lottie Animations**: Requires JavaScript enabled
- **Progressive Enhancement**: Graceful degradation

## Customization

### CSS Variables
```css
.multi-media {
  --threshold: 60rem;  /* Custom breakpoint */
  --media-max-width: 600px;
  --text-max-width: 500px;
}
```

### Custom Classes
```yaml
classes: "featured dark-theme"
```

## Best Practices

1. **Media Selection**: Choose media type based on content purpose
2. **File Optimization**: Compress all media assets
3. **Fallbacks**: Provide fallback content for unsupported features
4. **Text Length**: Keep prose concise for better visual balance
5. **CTA Placement**: Limit to 2-3 CTAs per section
6. **Layout Alternation**: Use `isReverse` for visual variety