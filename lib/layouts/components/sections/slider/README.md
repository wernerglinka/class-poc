# Slider Component

A responsive slider section component inspired by: [Pointy Slider by CodyHouse](https://codyhouse.co/gem/pointy-slider).

## Features

- **Smooth Animation**: New slide slides in from the right with smooth animation
- **Keyboard Navigation**: Arrow key support for accessibility (left/right arrows)
- **Pagination Controls**: Visual indicators with click navigation
- **Multiple Slider Support**: Can have multiple independent sliders on one page
- **Responsive Design**: Adapts layout at 40rem breakpoint (side-by-side to stacked)
- **Flexible Content**: Supports images, text content, and multiple CTAs per slide

## Animation Behavior

The slider uses a consistent "slide over" animation pattern:
- **All slides slide in from the right** regardless of navigation direction
- **Old slide stays in place** while new slide covers it with higher z-index
- **Unified movement**: The entire slide (image and content together) animates as one unit
- **Responsive adaptation**: Animation behavior remains consistent across all screen sizes

## Technical Implementation

### Pure CSS Class Management
- No inline styles - all positioning handled via CSS classes
- Predictable state management through class addition/removal
- High specificity control through CSS cascade

### Key Classes
- `is-visible`: Final positioned state (slide at `translateX(0%)`)
- `sliding-in`: High z-index (100) for incoming slide to appear above others
- `reset`: Instant off-screen positioning without animation for cleanup

### Animation Sequence
1. **Setup**: Incoming slide gets `sliding-in` class for high z-index
2. **Animate**: Incoming slide gets `is-visible` class, entire slide slides from right
3. **Cleanup**: After animation, old slides get `reset` class for instant off-screen positioning

## Data Structure

The slider section uses the standard section configuration with a `slides` array containing the slide content.

```yaml
- sectionType: slider
  containerTag: section
  disabled: false
  id: ""
  classes: ""
  containerFields:
    inContainer: true
    isAnimated: true
    noMargin:
      top: false
      bottom: false
    noPadding:
      top: true
      bottom: true
    background:
      isDark: false
      color: ""
      image: ""
  reverse: false  # Optional: reverses image/content order
  slides:
    - slideClasses: ""  # Optional: custom classes for this slide
      image:
        src: "/assets/images/slide1.jpg"
        alt: "Slide 1 description"
      text:
        leadIn: "Optional lead-in text"
        title: "Main Slide Title"
        titleTag: "h2"
        subTitle: "Optional subtitle"
        prose: |-
          Main content text for the slide.
          Can be multiple paragraphs in Markdown.
      ctas:
        - url: "/example-link"
          label: "Button Text"
          isButton: true
          buttonStyle: "primary"
        - url: "/another-link"
          label: "Link Text"
          isButton: false
          buttonStyle: "secondary"
    # Additional slides...
```

### Required Fields
- `sectionType`: Must be "slider"
- `slides`: Array of slide objects (minimum 1 slide)
- Each slide must have an `image` object with `src` and `alt`
- Each slide should have either `text`, `ctas`, or both

### Optional Fields
- `slideClasses`: Custom CSS classes for individual slides
- `reverse`: Boolean to reverse image/content order (applies to all slides)
- All standard section container configuration options

## HTML Structure

The component generates this HTML structure:

```html
<div class="container slider">
  <div class="slider-wrapper"
       role="region"
       aria-roledescription="carousel"
       aria-label="Image carousel"
       tabindex="0">

    <ul class="slides" aria-live="polite" aria-atomic="false">
      <li class="slide is-visible"
          role="group"
          aria-roledescription="slide"
          aria-label="Slide 1 of 3">

        <div class="image">
          <img src="image.jpg" alt="Description">
        </div>

        <div class="slide-content">
          <div class="text">
            <p class="lead-in">Optional lead-in</p>
            <h2>Slide Title</h2>
            <p class="subtitle">Optional subtitle</p>
            <div class="prose">Main content...</div>
          </div>
          <div class="ctas">
            <a href="/link" class="button">Button</a>
          </div>
        </div>
      </li>
      <!-- More slides... -->
    </ul>

    <ul class="slider-pagination"
        role="group"
        aria-label="Choose slide to display">
      <li>
        <button type="button"
                class="slider-pagination-button active"
                aria-label="Go to slide 1"
                aria-disabled="true">
          <span aria-hidden="true">1</span>
        </button>
      </li>
      <li>
        <button type="button"
                class="slider-pagination-button"
                aria-label="Go to slide 2"
                aria-disabled="false">
          <span aria-hidden="true">2</span>
        </button>
      </li>
      <!-- More pagination buttons... -->
    </ul>
  </div>
</div>
```

### Key Structure Notes
- **ARIA Container**: Carousel wrapper has proper ARIA roles and labels
- **Focusable**: Slider wrapper is focusable for keyboard navigation
- **Live Region**: Slides list announces changes to screen readers
- **Semantic Slides**: Each list item has proper group role and descriptive label
- **Button Controls**: Native buttons with descriptive labels and disabled states
- **List Structure**: Uses semantic `<ul>` and `<li>` elements for slides and pagination
- **Image First**: Image div comes before slide-content in the markup

## CSS Architecture

### Default State
- All slides positioned off-screen right: `transform: translateX(100%)`
- Slides are absolutely positioned within the slider wrapper
- Natural HTML stacking order for z-index behavior

### Responsive Layout
- **Above 40rem**: Side-by-side layout using flexbox (50% each for image and content)
- **Below 40rem**: Stacked layout with image on top, each section 50% height
- Slider wrapper height: 30rem (desktop) / 40rem (mobile)

### Animation Properties
- **Transition**: `transform 0.6s ease-in-out` for smooth sliding
- **Transform**: Entire slide moves as one unit from `translateX(100%)` to `translateX(0%)`

### Z-Index Management
- Default slides: Natural HTML stacking order
- Incoming slide: `z-index: 100` via `sliding-in` class
- Pagination: `z-index: 1000` to stay above slide content
- Ensures proper layering regardless of HTML order

## JavaScript API

### Initialization
- Automatically initializes on `DOMContentLoaded` for all `.slider-wrapper` elements
- Supports multiple independent sliders on the same page
- Each slider maintains its own state and event handlers

### Navigation Methods
- **Keyboard**: Arrow left/right keys (when carousel is focused)
- **Pagination**: Click on pagination buttons (native button elements)
- **Internal Functions**:
  - `showNextSlide()`: Advances to next slide (wraps to first)
  - `showPreviousSlide()`: Goes to previous slide (wraps to last)
  - `showSlide(index)`: Jumps directly to specific slide
  - `updateSlider()`: Core function that handles slide transitions

### Event Handling
- **Event Delegation**: Single click listener on pagination container
- **Transition End**: Cleanup listeners on each slide for animation completion
- **Keyboard Events**: Scoped to carousel container (not global)
- **State Management**: Updates slide visibility, pagination states, and ARIA attributes
- **Focus Management**: Proper keyboard focus handling for accessibility

### Animation Flow
1. **Setup Phase**: Remove old `sliding-in` classes, add to new slide
2. **Animation Phase**: Add `is-visible` class to trigger CSS transition
3. **Cleanup Phase**: Remove old slide classes and add `reset` for instant repositioning
4. **Restoration**: Remove `reset` class after 50ms to restore transitions

## Browser Compatibility

- Modern browsers with CSS transform and transition support
- Uses standard DOM APIs (no jQuery dependency)
- Graceful degradation for older browsers (slides still functional without animation)

## Performance Considerations

- **GPU Acceleration**: CSS transforms leverage hardware acceleration
- **Minimal JavaScript**: CSS handles all animations, JS only manages state
- **Efficient Event Delegation**: Single listeners handle multiple elements


## Dependencies

The slider component depends on several partial components:
- `ctas`: For rendering call-to-action buttons and links
- `text`: For rendering text content (lead-in, title, subtitle, prose)
- `image`: For rendering responsive images
- `commons`: For shared utilities and base styles

## Customization

### Custom Slide Classes
Add custom CSS classes to individual slides:
```yaml
slides:
  - slideClasses: "featured-slide dark-theme"
    # ... slide content
```

### Styling Hooks
Key CSS classes available for customization:
- `.slider`: Main container
- `.slider-wrapper`: Slider viewport (focusable carousel container)
- `.slides`: Slides container (live region)
- `.slide`: Individual slide container (group role)
- `.slide-content`: Content area within slide
- `.slider-pagination`: Pagination container (group role)
- `.slider-pagination-button`: Individual pagination buttons (native buttons)
