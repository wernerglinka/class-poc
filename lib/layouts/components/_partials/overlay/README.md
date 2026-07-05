# Overlay Component

Modal overlay component for displaying content above the main page content with backdrop and close functionality.

## Features

- **Modal Display**: Content appears above page with backdrop
- **Close Functionality**: Multiple ways to close the overlay
- **Backdrop Click**: Click outside content to close
- **Keyboard Support**: ESC key to close, focus management
- **Scroll Lock**: Prevents background scrolling when open
- **Smooth Animations**: Fade in/out transitions

## Data Structure

```yaml
overlay:
  id: "unique-overlay-id"
  title: "Overlay Title"
  content: "Overlay content goes here"
  closeLabel: "Close"
  backdrop: true
```

## Properties

- `id`: Unique identifier for the overlay
- `title`: Overlay title/heading
- `content`: Main overlay content (supports markdown)
- `closeLabel`: Text for close button (accessibility)
- `backdrop`: Enable/disable backdrop click to close

## HTML Structure

```html
<div id="unique-overlay-id" class="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
  <div class="overlay-backdrop"></div>
  <div class="overlay-content">
    <header class="overlay-header">
      <h2 id="overlay-title">Overlay Title</h2>
      <button class="overlay-close" aria-label="Close overlay">
        <span aria-hidden="true">&times;</span>
      </button>
    </header>
    
    <main class="overlay-body">
      <p>Overlay content goes here</p>
    </main>
  </div>
</div>
```

## CSS Classes

- `.overlay`: Main overlay container
- `.overlay-backdrop`: Semi-transparent background
- `.overlay-content`: Content container
- `.overlay-header`: Header with title and close button
- `.overlay-body`: Main content area
- `.overlay-close`: Close button
- `.overlay-open`: Applied to body when overlay is active
- `.overlay-visible`: Applied to show overlay

## Usage Examples

### Image Gallery Overlay
```yaml
overlay:
  id: "image-gallery"
  title: "Image Gallery"
  content: '<img src="/assets/images/gallery-1.jpg" alt="Gallery image">'
  closeLabel: "Close gallery"
```

### Video Overlay
```yaml
overlay:
  id: "video-modal"
  title: "Watch Video"
  content: '<video controls><source src="/assets/video/demo.mp4"></video>'
  closeLabel: "Close video"
```

### Contact Form Overlay
```yaml
overlay:
  id: "contact-form"
  title: "Get In Touch"
  content: '<form class="contact-form">...</form>'
  closeLabel: "Close form"
  backdrop: false
```

### Information Overlay
```yaml
overlay:
  id: "terms-conditions"
  title: "Terms & Conditions"
  content: "Full terms and conditions text..."
  closeLabel: "Close terms"
```

## JavaScript Integration

### Opening Overlay
```javascript
function openOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  overlay.classList.add('overlay-visible');
  document.body.classList.add('overlay-open');
  
  // Focus management
  overlay.querySelector('.overlay-close').focus();
}
```

### Closing Overlay
```javascript
function closeOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  overlay.classList.remove('overlay-visible');
  document.body.classList.remove('overlay-open');
  
  // Return focus to trigger element
  document.querySelector(`[data-overlay="${overlayId}"]`).focus();
}
```

### Event Listeners
```javascript
// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('overlay-open')) {
    closeOverlay(getCurrentOverlayId());
  }
});

// Backdrop click to close
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('overlay-backdrop')) {
    closeOverlay(e.target.closest('.overlay').id);
  }
});
```

## CSS Styling

```css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.overlay-visible {
  opacity: 1;
  visibility: visible;
}

.overlay-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
}

.overlay-content {
  position: relative;
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
```

## Accessibility Features

- **ARIA Attributes**: Proper `role="dialog"` and `aria-modal="true"`
- **Focus Management**: Traps focus within overlay when open
- **Keyboard Navigation**: ESC key closes, tab navigation works properly
- **Screen Reader Support**: Proper labeling and structure
- **Focus Return**: Returns focus to trigger element on close

## Responsive Design

```css
@media (max-width: 768px) {
  .overlay-content {
    width: 95vw;
    max-height: 95vh;
    margin: 2.5vh 2.5vw;
  }
  
  .overlay-header {
    padding: 1rem;
  }
  
  .overlay-body {
    padding: 0 1rem 1rem;
  }
}
```

## Animation Options

### Fade Animation
```css
.overlay {
  transition: opacity 0.3s ease;
}
```

### Scale Animation
```css
.overlay-content {
  transform: scale(0.7);
  transition: transform 0.3s ease;
}

.overlay-visible .overlay-content {
  transform: scale(1);
}
```

### Slide Animation
```css
.overlay-content {
  transform: translateY(-50px);
  transition: transform 0.3s ease;
}

.overlay-visible .overlay-content {
  transform: translateY(0);
}
```

## Best Practices

1. **Focus Management**: Always manage focus properly for accessibility
2. **Scroll Lock**: Prevent body scrolling when overlay is open
3. **ESC Key**: Always allow ESC to close overlays
4. **Backdrop Click**: Make backdrop clickable to close (unless disabled)
5. **Mobile Considerations**: Ensure overlays work well on touch devices

## Browser Support

- **Modern Browsers**: Full support in all current browsers
- **IE11**: Requires polyfills for some CSS features
- **Mobile**: Excellent support on iOS and Android
- **Touch Devices**: Full touch interaction support

## Performance

- **CSS Transforms**: Use transforms for animations (GPU accelerated)
- **Lazy Loading**: Load overlay content only when needed
- **Event Delegation**: Use event delegation for multiple overlays
- **Memory Management**: Clean up event listeners when removing overlays