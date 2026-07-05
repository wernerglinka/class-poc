# Audio Component

Audio player component with visual background support for podcast episodes, music samples, and audio content.

## Features

- **Dual Format Support**: MP3 and OGG formats for broad browser compatibility
- **Background Image**: Visual background enhances the audio experience
- **Responsive Design**: Adapts to different screen sizes automatically
- **Accessible Controls**: Standard HTML5 audio controls with proper labeling
- **Fallback Support**: Progressive enhancement for older browsers

## Data Structure

```yaml
audio:
  bgImage: "/assets/images/audio-bg.jpg"
  ogg: "/assets/audio/sample.ogg"
  mpeg: "/assets/audio/sample.mp3"
```

## Properties

- `bgImage`: Background image displayed with the audio player
- `ogg`: Path to OGG audio file (for Firefox and older browsers)
- `mpeg`: Path to MP3 audio file (for broad compatibility)

## HTML Structure

```html
<div class="audio media">
  <div class="audio-bg" style="background-image: url('/assets/images/audio-bg.jpg')">
    <audio controls preload="metadata">
      <source src="/assets/audio/sample.ogg" type="audio/ogg">
      <source src="/assets/audio/sample.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
</div>
```

## Usage Examples

### Podcast Episode
```yaml
audio:
  bgImage: "/assets/images/podcast-cover.jpg"
  mpeg: "/assets/audio/episode-001.mp3"
  ogg: "/assets/audio/episode-001.ogg"
```

### Music Sample
```yaml
audio:
  bgImage: "/assets/images/album-art.jpg"
  mpeg: "/assets/audio/track-preview.mp3"
  ogg: "/assets/audio/track-preview.ogg"
```

## Browser Support

- **MP3**: Supported by all modern browsers
- **OGG**: Required for Firefox and some open-source browsers
- **HTML5 Audio**: Graceful degradation for unsupported browsers

## Best Practices

1. **File Optimization**: Compress audio files for web delivery
2. **Format Support**: Always provide both MP3 and OGG formats
3. **Background Images**: Use high-quality images that complement the audio content
4. **File Naming**: Use descriptive, web-safe filenames
5. **Preload**: Uses `preload="metadata"` for faster initial loading

## Accessibility

- Standard HTML5 audio controls for keyboard navigation
- Proper fallback text for unsupported browsers
- Screen reader compatible audio element structure