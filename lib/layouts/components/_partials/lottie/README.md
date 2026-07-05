# Lottie Animation Component

High-quality, lightweight animation component using Lottie JSON animations with playback controls and responsive behavior.

## Features

- **Vector Animations**: Resolution-independent Lottie animations
- **Playback Controls**: Autoplay, loop, and manual control options
- **Lightweight**: Small file sizes compared to video formats
- **Interactive**: Programmatic control over animation playback
- **Responsive**: Scales perfectly across all screen sizes
- **Performance**: Hardware-accelerated rendering when possible

## Data Structure

```yaml
lottie:
  src: "/assets/lotties/animation.json"
  control:
    autoplay: true
    loop: true
    speed: 1.0
```

## Properties

- `src`: Path to the Lottie JSON animation file
- `control.autoplay`: Start animation automatically (default: true)
- `control.loop`: Loop the animation continuously (default: true)
- `control.speed`: Animation playback speed multiplier (default: 1.0)

## HTML Structure

```html
<div class="lottie-wrapper">
  <div class="lottie-player" 
       data-src="/assets/lotties/animation.json"
       data-autoplay="true"
       data-loop="true"
       data-speed="1.0">
  </div>
</div>
```

## JavaScript Integration

```javascript
// Initialize Lottie animation
const animation = lottie.loadAnimation({
  container: document.querySelector('.lottie-player'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: '/assets/lotties/animation.json'
});

// Control playback
animation.play();
animation.pause();
animation.stop();
animation.setSpeed(2.0);
```

## Usage Examples

### Loading Animation
```yaml
lottie:
  src: "/assets/lotties/loading-spinner.json"
  control:
    autoplay: true
    loop: true
    speed: 1.5
```

### Hero Animation
```yaml
lottie:
  src: "/assets/lotties/hero-illustration.json"
  control:
    autoplay: true
    loop: false
    speed: 0.8
```

### Interactive Button
```yaml
lottie:
  src: "/assets/lotties/button-hover.json"
  control:
    autoplay: false
    loop: false
    speed: 1.0
```

### Background Animation
```yaml
lottie:
  src: "/assets/lotties/floating-particles.json"
  control:
    autoplay: true
    loop: true
    speed: 0.5
```

## Animation Types

### UI Micro-interactions
- Button hover effects
- Loading indicators
- Form validation feedback
- Navigation transitions

### Illustrations
- Hero section graphics
- Feature explanations
- Process workflows
- Character animations

### Background Elements
- Subtle particle effects
- Ambient animations
- Geometric patterns
- Environmental effects

## Performance Optimization

### File Size Tips
1. **Optimize Vectors**: Simplify paths and reduce anchor points
2. **Limit Colors**: Use fewer colors and gradients
3. **Reduce Layers**: Minimize composition complexity
4. **Frame Rate**: Use appropriate frame rates (24-30fps)

### Loading Strategies
```javascript
// Lazy load animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadLottieAnimation(entry.target);
    }
  });
});
```

## Responsive Behavior

```css
.lottie-wrapper {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1 / 1;
}

.lottie-player {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .lottie-wrapper {
    max-width: 300px;
  }
}
```

## Control Methods

### Basic Controls
```javascript
// Play/Pause toggle
function toggleAnimation(animation) {
  if (animation.isPaused) {
    animation.play();
  } else {
    animation.pause();
  }
}

// Speed control
function setAnimationSpeed(animation, speed) {
  animation.setSpeed(speed);
}
```

### Advanced Controls
```javascript
// Seek to specific frame
animation.goToAndStop(frameNumber, true);

// Play segment
animation.playSegments([startFrame, endFrame], true);

// Reverse playback
animation.setDirection(-1);
animation.play();
```

## Event Handling

```javascript
animation.addEventListener('complete', () => {
  console.log('Animation completed');
});

animation.addEventListener('loopComplete', () => {
  console.log('Animation loop completed');
});

animation.addEventListener('enterFrame', (e) => {
  console.log('Current frame:', e.currentTime);
});
```

## Browser Support

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **IE Support**: Requires polyfills for older versions
- **Mobile**: Excellent performance on iOS and Android
- **Fallbacks**: Provide static images for unsupported browsers

## Best Practices

1. **File Optimization**: Keep JSON files under 100KB when possible
2. **Progressive Enhancement**: Provide fallback images
3. **Performance Testing**: Test on lower-end devices
4. **Accessibility**: Consider users who prefer reduced motion
5. **Loading States**: Show placeholders during asset loading

## Creating Lottie Files

### From After Effects
1. Use the Bodymovin plugin
2. Export as JSON
3. Optimize settings for web

### From Design Tools
- **Figma**: Use Lottie plugins
- **Sketch**: Export via third-party tools
- **Adobe XD**: Use Lottie export plugins

## Accessibility Considerations

```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lottie-player {
    animation-play-state: paused !important;
  }
}
```

```javascript
// Check for motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  // Disable autoplay or provide controls
  animation.autoplay = false;
}
```

## Troubleshooting

### Common Issues
1. **Large File Size**: Optimize animation complexity
2. **Performance**: Reduce frame rate or simplify paths
3. **Loading Errors**: Check file path and JSON validity
4. **Mobile Issues**: Test thoroughly on actual devices

### Debug Tools
```javascript
// Check animation status
console.log('Is paused:', animation.isPaused);
console.log('Current frame:', animation.currentFrame);
console.log('Total frames:', animation.totalFrames);
```