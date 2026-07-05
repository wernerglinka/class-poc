# Video Component

The video component provides a flexible solution for embedding videos from multiple providers into a Metalsmith site. Rather than implementing separate components for each video platform or display mode, this unified component handles YouTube, Vimeo, and Cloudinary videos seamlessly, presenting them either inSitu within your content flow or as modal overlays. The component employs modern web development practices including lazy loading with Intersection Observer, dynamic script loading to minimize initial page weight, and a single-player architecture that ensures only one video plays at a time across your entire page. Through event-driven design and factory pattern, the component maintains clean separation between providers while offering consistent behavior and user experience regardless of the video source. The architecture prioritizes performance through intelligent resource management, loading provider APIs only when needed and automatically cleaning up resources when videos are closed or switched, making it an ideal choice for content-rich sites where video engagement is important but page performance cannot be compromised.

## Features

- **Multiple Providers**: YouTube, Vimeo, and Cloudinary support
- **Display Modes**: inSitu playback or modal overlay
- **Responsive Design**: Automatic sizing across all devices
- **Performance Optimized**: Lazy loading, script caching, intersection observer
- **Time Controls**: Start and end time support for YouTube
- **Event-Driven**: Centralized event bus for component communication
- **Accessibility**: Full keyboard navigation and screen reader support
- **Modern Architecture**: Factory pattern, configuration management, error recovery

## Supported Providers

### YouTube

- Full YouTube IFrame API integration
- Player controls and state management
- Start/end time controls
- Autoplay prevention for better UX

### Vimeo

- Vimeo Player API integration
- Responsive embed support
- Event handling for play/pause/end

### Cloudinary

- Cloudinary Video Player support
- Cloud-based video optimization
- Custom player styling and controls

## Data Structure

```yaml
video:
  inSitu: true # true for inSitu, false for modal
  src: 'youtube' # 'youtube', 'vimeo', or 'cloudinary'
  id: 'dQw4w9WgXcQ' # Video ID or public ID
  cloudname: 'my-cloud' # Required for Cloudinary
  tn: '/assets/images/thumb.jpg' # Thumbnail for modal display
  start: 30 # Start time in seconds (YouTube only)
  end: 120 # End time in seconds (YouTube only)
  lazy: true # Enable lazy loading (default: true)
```

## Properties

- `inSitu`: Display video inSitu (true) or in modal overlay (false)
- `src`: Video provider ('youtube', 'vimeo', 'cloudinary'). Defaults to 'youtube' for backward compatibility
- `id`: Video identifier (YouTube video ID, Vimeo ID, or Cloudinary public ID)
- `cloudname`: Cloudinary cloud name (required for Cloudinary videos)
- `tn`: Thumbnail image path (used for modal display)
- `start`: Optional start time in seconds (YouTube only)
- `end`: Optional end time in seconds (YouTube only)
- `lazy`: Enable lazy loading with Intersection Observer (default: true)

## Usage Examples

### YouTube Videos

```yaml
video:
  inSitu: false
  src: youtube
  id: 'dQw4w9WgXcQ'
  tn: '/assets/images/youtube-thumb.jpg'
  start: 30 # optional
  end: 120 # optional
```

### Vimeo Videos

```yaml
video:
  inSitu: false # false for modal
  src: vimeo
  id: '123456789'
  tn: '/assets/images/vimeo-thumb.jpg'
```

### Cloudinary Videos

```yaml
video:
  inSitu: false # false for modal
  src: cloudinary
  id: 'my-video-public-id'
  cloudname: 'my-cloud-name'
  tn: '/assets/images/cloudinary-thumb.jpg'
```

## HTML Structure

### inSitu Video

```html
<div class="video media inSitu">
  <div class="inSitu-video-wrapper js-inSitu-video-wrapper">
    <div
      class="js-inSitu-video"
      data-videoid="dQw4w9WgXcQ"
      data-videosrc="youtube"
      data-starttime="30"
      data-endtime="120"
      data-lazy="true"
    ></div>
  </div>
  <button class="video-trigger">
    <div class="play-button"></div>
    <img src="/assets/images/thumb.jpg" alt="Video thumbnail" />
  </button>
  <button class="close" aria-label="Close video">×</button>
</div>
```

### Modal Video

```html
<div class="video media">
  <button
    class="js-modal-video"
    data-videoid="dQw4w9WgXcQ"
    data-videosrc="youtube"
    data-starttime="30"
    data-endtime="120"
  >
    <div class="play-button"></div>
    <img src="/assets/images/thumb.jpg" alt="Video thumbnail" />
  </button>
</div>
```

## Architecture

### Module Structure

```
video/
├── video.js                # Main component with single-player management
├── video.css               # Component styles
├── modules/
│   ├── helpers/
│   │   ├── load-script.js      # Script loading utility
│   │   ├── load-styles.js      # CSS loading utility
│   │   ├── load-youtube-api.js # YouTube API loader
│   │   └── video-utils.js      # DOM utilities, modal controls, observers
│   └── providers/
│       ├── youtube.js      # YouTube provider (modal & inSitu)
│       ├── vimeo.js        # Vimeo provider (modal & inSitu)
│       └── cloudinary.js   # Cloudinary provider (modal & inSitu)
```

### Provider Interface

Each provider implements:

- `createProviderModalPlayer(videoId, targetId, cloudName, options)` - Creates modal player
- `createProviderinSituPlayer(element, videoId, cloudName, options)` - Creates inSitu player
- **Single-player architecture** - automatically stops other players when starting
- **Event-driven state management** - emits standardized events
- **Error handling with recovery** - proper error reporting via events
- **Resource cleanup** - automatic player cleanup and memory management

## Provider-Specific Features

### YouTube Integration

- **YouTube IFrame API**: Automatic loading and initialization
- **Player States**: Full state management (playing, paused, ended)
- **Time Controls**: Start and end time parameters
- **Player Variables**: Configurable player options

```javascript
const playerVars = {
  autoplay: 0, // Manual start
  controls: 1, // Show controls
  enablejsapi: 1, // Enable API
  rel: 0, // No related videos
  start: startTime, // Start time
  end: endTime // End time
};
```

### Vimeo Integration

- **Vimeo Player API**: Dynamic loading of player script
- **Event Handling**: Play, pause, and end events
- **Responsive Sizing**: Automatic aspect ratio handling

### Cloudinary Integration

- **Video Player SDK**: Cloudinary's video player library
- **CSS Loading**: Dynamic stylesheet loading
- **Cloud Optimization**: Automatic video optimization
- **Percent Events**: Playback completion tracking

## Modal Functionality

### Modal Features

- **Close Button**: Click the [Close] button to close the modal
- **Fade Animations**: Smooth fade in/out transitions using CSS animations
- **Scroll Lock**: Prevents background scrolling when modal is open (via `body.modal-active`)
- **Single Player**: Opening a modal stops any playing inSitu videos
- **Auto Cleanup**: Player and DOM elements are cleaned up on close

### Modal Overlay Structure

```html
<div id="video-overlay" class="js-video-overlay">
  <span class="close">[Close]</span>
  <div class="responsive-wrapper">
    <div class="video-container">
      <!-- Provider-specific player inserted here -->
    </div>
  </div>
</div>
```

## CSS Classes

- `.video`: Main video container
- `.media`: Media wrapper class
- `.inSitu`: inSitu display mode
- `.js-inSitu-video`: JavaScript hook for inSitu videos
- `.js-modal-video`: JavaScript hook for modal videos
- `.js-inSitu-video-wrapper`: Wrapper for inSitu video containers
- `.video-playing`: Applied during video playback
- `.video-trigger`: Play button for inSitu videos
- `.play-button`: Play button styling

## Performance Optimization

### Optimized Script Loading

- **Simple and reliable**: Basic script loading with duplicate prevention
- **Promise-based**: Clean async/await patterns
- **Error handling**: Proper error recovery and reporting
- **CSS support**: Dynamic stylesheet loading for Cloudinary

```javascript
// Simple script and style loading
import loadScript from './modules/helpers/load-script.js';
import loadStyles from './modules/helpers/load-styles.js';

// Load provider assets
await loadScript('https://www.youtube.com/iframe_api');
await loadStyles('https://unpkg.com/cloudinary-video-player@latest/dist/cld-video-player.min.css');
```

### Lazy Loading with Intersection Observer

- **Viewport Detection**: inSitu videos initialize when entering viewport
- **Root Margin**: 100px before viewport edge (hardcoded)
- **Graceful Fallback**: Works without IntersectionObserver support
- **Note**: Always enabled for inSitu videos, cannot be configured

### Single-Player Management

- **Active Player Tracking**: Only one video plays at a time
- **Automatic Switching**: Starting a new video stops the current one
- **Memory Efficiency**: Single player state instead of complex registries
- **Clean Transitions**: Proper cleanup when switching between videos

## Modern Features

### Event-Driven Architecture

- **Centralized Event Bus**: Component communication via custom events
- **Custom Event Hooks**: Extensible event system for third-party integration

```javascript
// Listen for video events
import eventBus, { VIDEO_EVENTS } from './modules/helpers/event-bus.js';

eventBus.on(VIDEO_EVENTS.PLAY, (detail) => {
  console.log('Video started:', detail.provider);
});

eventBus.on(VIDEO_EVENTS.ENDED, (detail) => {
  console.log('Video ended:', detail.videoId);
});
```

### Configuration Management

- **Centralized Settings**: Single source of configuration truth
- **Runtime Configuration**: Dynamic settings via data attributes
- **Provider-Specific Options**: Customizable per-provider settings
- **Validation**: Built-in configuration validation

```javascript
// Configure video component
import { videoConfig } from './modules/config/video-config.js';

videoConfig.set({
  performance: {
    lazyLoad: true,
    maxConcurrentLoads: 3
  },
  providers: {
    youtube: {
      defaultPlayerVars: {
        modestbranding: 1,
        playsinSitu: 1
      }
    }
  }
});
```

## Accessibility Considerations

- **Close Button**: Text-based [Close] button is keyboard accessible
- **Thumbnail Alt Text**: Provide descriptive alt text for video thumbnails
- **Semantic HTML**: Uses button elements for interactive controls

## Browser Support

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **Mobile**: Excellent support on iOS and Android
- **Provider APIs**: Dependent on provider browser support
- **Fallbacks**: Graceful degradation for unsupported features

## Best Practices

1. **Provider Selection**: Choose the right provider for your needs
2. **Thumbnail Quality**: Use high-quality thumbnails for modal videos
3. **Lazy Loading**: Enable lazy loading for videos below the fold (default: true)
4. **Alt Text**: Always provide descriptive alt text for thumbnails
5. **Error Handling**: Component includes automatic error recovery

## Troubleshooting

### Common Issues

**API Loading:**

- Ensure providers' APIs can load (check network/CORS)
- YouTube requires HTTPS in production

**Cloudinary:**

- Verify cloud name is correct
- Check video public ID exists
- Ensure video is set to public

**Vimeo:**

- Verify video ID is correct
- Check video privacy settings

### Debug Methods

```javascript
// Enable debug mode
import { videoConfig } from './modules/config/video-config.js';
videoConfig.set('debug', true);

// Listen for error events
import eventBus, { VIDEO_EVENTS } from './modules/helpers/event-bus.js';
eventBus.on(VIDEO_EVENTS.PLAYER_ERROR, (detail) => {
  console.error('Video error:', detail);
});

// Check script loading status
import { isScriptLoaded } from './modules/helpers/script-loader.js';
console.log('YouTube API loaded:', isScriptLoaded('https://www.youtube.com/iframe_api'));

// Performance monitoring
performance
  .getEntriesByType('measure')
  .filter((entry) => entry.name.includes('video'))
  .forEach((entry) => console.log(`${entry.name}: ${entry.duration}ms`));
```

## Auto-Initialization

The component automatically initializes when the DOM is ready:

```javascript
// Auto-initialization in video.js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

This pattern ensures the component works whether the script loads before or after the DOM is ready.

### Key Features

1. **Backward compatible** - Works with existing templates
2. **Lazy loading** - Automatic for inSitu videos (always enabled)
3. **Single-player management** - Only one video plays at a time
4. **Smooth animations** - Modal uses CSS animations with `animationend` events

## Extending with New Providers

To add a new provider using functional patterns:

1. Create provider module in `modules/providers/` using factory pattern
2. Implement modal and inSitu player factory functions
3. Export provider configuration and utilities
4. Add to provider maps in main modules
5. Update templates with new provider data attributes

```javascript
// Example provider implementation
export const createNewProviderModalPlayer = async (videoId, targetId, options) => {
  // Load provider assets
  await loadScript('https://provider.com/api.js');

  // Create player
  const player = new ProviderAPI.Player(targetId, { videoId, ...options });

  // Register with player manager
  setActivePlayer(player, 'newprovider', videoId);

  // Setup events
  player.on('play', () => eventBus.emit(VIDEO_EVENTS.PLAY, { provider: 'newprovider', videoId }));
  player.on('ended', () => eventBus.emit(VIDEO_EVENTS.ENDED, { provider: 'newprovider', videoId }));

  return player;
};

export const createNewProviderinSituPlayer = async (element, videoId, options) => {
  // Similar pattern for inSitu players
  // Include trigger/close button setup
  // Integrate with single-player management
};
```
