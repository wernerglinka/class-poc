# Slider Pagination Component

Navigation component for sliders providing dot-style pagination with accessibility features and customizable styling.

## Features

- **Dot Navigation**: Visual indicators for slider position
- **Active State**: Clear indication of current slide
- **Keyboard Support**: Arrow key navigation between dots
- **Screen Reader Support**: Proper ARIA labels and roles
- **Click Navigation**: Direct navigation to any slide
- **Customizable Styling**: Easy theming and visual customization

## Data Structure

```yaml
pagination:
  slides: 
    - title: "Slide 1"
    - title: "Slide 2" 
    - title: "Slide 3"
  current: 0
  ariaLabel: "Slide navigation"
```

## Properties

- `slides`: Array of slide objects with titles
- `current`: Currently active slide index (0-based)
- `ariaLabel`: Accessibility label for the pagination group

## HTML Structure

```html
<nav class="slider-pagination" role="tablist" aria-label="Slide navigation">
  <button class="slider-pagination-button active" 
          role="tab" 
          aria-selected="true"
          aria-controls="slide-0"
          aria-label="Go to slide 1">
    <span class="slider-pagination-dot"></span>
  </button>
  
  <button class="slider-pagination-button" 
          role="tab" 
          aria-selected="false"
          aria-controls="slide-1"
          aria-label="Go to slide 2">
    <span class="slider-pagination-dot"></span>
  </button>
  
  <button class="slider-pagination-button" 
          role="tab" 
          aria-selected="false"
          aria-controls="slide-2"
          aria-label="Go to slide 3">
    <span class="slider-pagination-dot"></span>
  </button>
</nav>
```

## CSS Classes

- `.slider-pagination`: Main pagination container
- `.slider-pagination-button`: Individual pagination button
- `.slider-pagination-dot`: Visual dot indicator
- `.active`: Applied to current slide button
- `.slider-pagination-vertical`: Vertical layout variant

## Usage Examples

### Basic Slider Pagination
```yaml
pagination:
  slides:
    - title: "Welcome Slide"
    - title: "Features Slide"
    - title: "Contact Slide"
  current: 0
  ariaLabel: "Main slider navigation"
```

### Image Gallery Pagination
```yaml
pagination:
  slides:
    - title: "Product Image 1"
    - title: "Product Image 2"
    - title: "Product Image 3"
    - title: "Product Image 4"
  current: 0
  ariaLabel: "Product gallery navigation"
```

### Testimonial Pagination
```yaml
pagination:
  slides:
    - title: "Customer Review 1"
    - title: "Customer Review 2"
    - title: "Customer Review 3"
  current: 0
  ariaLabel: "Testimonial navigation"
```

## CSS Styling

```css
.slider-pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.slider-pagination-button {
  border: none;
  background: transparent;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.slider-pagination-dot {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  transition: all 0.3s ease;
}

.slider-pagination-button.active .slider-pagination-dot,
.slider-pagination-button:hover .slider-pagination-dot {
  background-color: #007bff;
  transform: scale(1.2);
}

.slider-pagination-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
```

## Variants

### Large Dots
```css
.slider-pagination-large .slider-pagination-dot {
  width: 16px;
  height: 16px;
}
```

### Number Pagination
```css
.slider-pagination-numbers .slider-pagination-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #666;
  font-weight: bold;
}

.slider-pagination-numbers .slider-pagination-button.active {
  background-color: #007bff;
  color: white;
}
```

### Vertical Pagination
```css
.slider-pagination-vertical {
  flex-direction: column;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}
```

## JavaScript Integration

### Update Active State
```javascript
function updatePagination(currentIndex, totalSlides) {
  const buttons = document.querySelectorAll('.slider-pagination-button');
  
  buttons.forEach((button, index) => {
    if (index === currentIndex) {
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-selected', 'false');
    }
  });
}
```

### Handle Click Events
```javascript
document.addEventListener('click', (e) => {
  if (e.target.closest('.slider-pagination-button')) {
    const button = e.target.closest('.slider-pagination-button');
    const buttons = [...button.parentElement.children];
    const slideIndex = buttons.indexOf(button);
    
    // Navigate to slide
    goToSlide(slideIndex);
    updatePagination(slideIndex, buttons.length);
  }
});
```

### Keyboard Navigation
```javascript
document.addEventListener('keydown', (e) => {
  const focusedButton = document.activeElement;
  if (!focusedButton.classList.contains('slider-pagination-button')) return;
  
  const buttons = [...focusedButton.parentElement.children];
  const currentIndex = buttons.indexOf(focusedButton);
  
  let nextIndex = currentIndex;
  
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % buttons.length;
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  }
  
  if (nextIndex !== currentIndex) {
    buttons[nextIndex].focus();
    goToSlide(nextIndex);
  }
});
```

## Accessibility Features

- **ARIA Roles**: Uses `tablist` and `tab` roles for proper semantics
- **ARIA States**: `aria-selected` indicates current slide
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support with arrow keys
- **Focus Management**: Proper focus indicators and management

## Responsive Design

```css
@media (max-width: 768px) {
  .slider-pagination {
    gap: 0.25rem;
  }
  
  .slider-pagination-button {
    padding: 0.25rem;
  }
  
  .slider-pagination-dot {
    width: 10px;
    height: 10px;
  }
}
```

## Animation Effects

### Smooth Transitions
```css
.slider-pagination-dot {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Pulse Effect
```css
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.slider-pagination-button.active .slider-pagination-dot {
  animation: pulse 2s infinite;
}
```

### Progress Dots
```css
.slider-pagination-dot {
  position: relative;
  overflow: hidden;
}

.slider-pagination-dot::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  transition: left 0.5s;
}

.slider-pagination-button.active .slider-pagination-dot::after {
  left: 100%;
}
```

## Best Practices

1. **Clear Indicators**: Make active state clearly visible
2. **Touch Targets**: Ensure buttons are large enough for touch
3. **Consistent Spacing**: Maintain consistent spacing between dots
4. **Color Contrast**: Ensure sufficient contrast for accessibility
5. **Animation Performance**: Use CSS transforms for smooth animations

## Browser Support

- **Modern Browsers**: Full support in all current browsers
- **IE11**: Requires some CSS fallbacks
- **Mobile**: Excellent touch support on all devices
- **Screen Readers**: Full compatibility with assistive technologies