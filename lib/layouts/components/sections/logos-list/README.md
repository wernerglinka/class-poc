# Logos List Section Component

A dynamic marquee-style component for displaying collections of logos, client marks, partner organizations, awards, social proof, or social media links. Features intelligent scrolling behavior, fade effects, responsive design that automatically adapts to screen size and content width, and optional text/CTA sections.

## Features

- **Intelligent Auto-Scroll**: Automatically scrolls only when content exceeds viewport width
- **Smooth Marquee Animation**: CSS-based marquee with configurable speed and direction
- **Fade Edge Effects**: Gradient masks create smooth fade-in/fade-out at edges during scrolling
- **Text Content Support**: Optional text block with lead-in, title, subtitle, and prose
- **CTA Integration**: Optional call-to-action buttons below the logo list
- **Title Display**: Optional title display under each logo/icon for awards and social proof
- **Data Source Integration**: Connects to JSON data files for logo collections
- **Flexible Selection**: Display all logos or filter specific selections by title
- **Responsive Behavior**: Uses ResizeObserver for dynamic layout adjustments
- **Reverse Animation**: Optional reverse scrolling direction
- **Hover Pause**: Scrolling pauses on hover for better user interaction
- **Configurable Dimensions**: Customizable logo width and container sizing
- **Interactive States**: Hover effects for logos with smooth transitions
- **Centered Content Option**: Center-align text and CTAs when appropriate

## Data Structure

```yaml
- sectionType: logos-list
  containerTag: aside  # aside, section, or div
  disabled: false
  id: "logosList"
  classes: ""
  isReverse: false     # Enables reverse scrolling direction
  hasCenteredContent: false  # Centers text and CTAs
  containerFields:
    inContainer: false
    isAnimated: true
    noMargin:
      top: true
      bottom: false
    noPadding:
      top: true
      bottom: false
    background:
      color: ""
      image: ""
      imageScreen: "none"
  text:
    leadIn: ""
    title: "Our Partners"
    titleTag: "h2"
    subTitle: ""
    prose: "We work with industry-leading organizations"
  logos:
    source: "artMuseums"    # Name of JSON data file (without extension)
    logoWidth: 200          # Width in pixels for each logo
    scope: "all"            # "all" or "selections"
    selections: []          # Array of titles when scope is "selections"
    showTitle: false        # Display title under each logo (useful for awards)
  ctas:
    - url: "/partners"
      label: "View All Partners"
      isButton: true
      buttonStyle: "primary"

# Alternative with selections and awards display
- sectionType: logos-list
  hasCenteredContent: true
  text:
    title: "Awards & Recognition"
    prose: "Our work has been recognized by leading industry organizations"
  logos:
    source: "awards"
    logoWidth: 160
    scope: "all"
    showTitle: true  # Shows award titles
  ctas:
    - url: "/awards"
      label: "Learn More About Our Awards"
```

## HTML Structure

```html
<div class="container logo-list content">
  <!-- Optional text section -->
  <div class="text flow is-centered">
    <h2>Our Partners</h2>
    <p>We work with industry-leading organizations</p>
  </div>
  
  <div class="marquee" style="--list-width: 1400px">
    <div class="mask">
      <div class="logos-wrapper">
        
        <!-- First Copy of Logo List -->
        <ul class="logos js-logos-list">
          <li style="width: 200px;">
            <a href="https://example.com/">
              <img src="/assets/images/logo1.svg" alt="Company Logo">
            </a>
            <!-- Optional title display -->
            <div class="logo-title">Award Name</div>
          </li>
          <li style="width: 200px;">
            <a href="https://example.com/">
              <svg class="icon github"><!-- SVG icon content --></svg>
            </a>
          </li>
          <!-- Additional logos... -->
        </ul>
        
        <!-- Second Copy for Seamless Loop -->
        <ul class="logos js-logos-list">
          <!-- Duplicate of above for continuous scrolling -->
        </ul>
        
      </div>
    </div>
  </div>
  
  <!-- Optional CTAs section -->
  <div class="ctas flow is-centered">
    <a href="/partners" class="button primary">View All Partners</a>
  </div>
</div>
```

## CSS Architecture

### Marquee Animation System
```css
@keyframes marquee {
  0% { transform: translate3d(var(--start-position, 0%), 0, 0); }
  100% { transform: translate3d(var(--end-position, -50%), 0, 0); }
}

.logos-wrapper {
  --logo-padding: 20px;
  --list-height: 160px;
  --start-position: 0%;
  --end-position: -50%;
  --animation-speed: 15s;
  
  animation: marquee var(--animation-speed) linear infinite;
  animation-play-state: paused;  /* Controlled by JavaScript */
}
```

### Fade Edge Effects
```css
.mask:has(.play):before,
.mask:has(.play):after {
  content: '';
  position: absolute;
  width: 15rem;
  height: 100%;
  pointer-events: none;
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 1) 0%,
    transparent 100%
  );
}
```

### Interactive States
```css
/* Hover pause */
.marquee:hover .logos-wrapper {
  animation-play-state: paused;
  transition-duration: 0.8s;
}

/* Logo hover effects */
.logos img {
  filter: grayscale(100%);
  opacity: 0.5;
  transition: all 0.3s ease-in-out;
}

.logos img:hover {
  filter: grayscale(0);
  opacity: 1;
}

/* Title styling for awards */
.logo-title {
  margin-top: var(--space-xs);
  font-size: var(--font-size-sm);
  text-align: center;
  color: var(--color-text-secondary);
}
```

## JavaScript Functionality

### Intelligent Scrolling Logic
```javascript
// Check if scrolling is needed
if (logosList.offsetWidth > viewportWidth) {
  logosList.parentElement.classList.add('play');
} else {
  // Stop scrolling if content fits
  completeAnimationAndRemovePlay(logosList);
}
```

### Dynamic Responsiveness
- **ResizeObserver**: Monitors viewport changes
- **Animation Control**: Starts/stops scrolling based on content width
- **Smooth Transitions**: Completes animation cycles before stopping
- **Performance Optimization**: Prevents memory leaks and excessive event listeners

### Animation State Management
- **Play State**: Controls when animation is active
- **Stopping State**: Prevents multiple listeners during transition
- **Fallback Timers**: Ensures cleanup even if animation events fail

## Data Source Requirements

### Logo Data Structure
For image-based logos:
```json
[
  {
    "url": "https://company.com/",
    "logo": "/assets/images/company-logo.svg",
    "title": "Company Name"
  }
]
```

### Icon Data Structure
For icon-based entries (social links):
```json
[
  {
    "url": "https://linkedin.com/in/username/",
    "icon": "linkedin",
    "title": "LinkedIn"
  }
]
```

### Awards Data Structure
For awards and recognition:
```json
[
  {
    "url": "/awards/best-design",
    "logo": "/assets/images/award-logo.svg",
    "title": "Best Design Award 2024"
  }
]
```

### Selection Filtering
When using `scope: "selections"`, the component filters by the `title` field:
```yaml
logos:
  source: "socialLinks"
  scope: "selections"
  selections:
    - "LinkedIn"    # Matches title: "LinkedIn" in JSON
    - "GitHub"      # Matches title: "GitHub" in JSON
```

## Usage Patterns

### Client Logos Showcase
```yaml
- sectionType: logos-list
  containerTag: section
  containerFields:
    inContainer: true
    background:
      color: "#f8f9fa"
  text:
    title: "Trusted by Leading Brands"
    prose: "Join thousands of companies that trust our platform"
  logos:
    source: "clientLogos"
    logoWidth: 180
    scope: "all"
  ctas:
    - url: "/clients"
      label: "View Case Studies"
      isButton: true
```

### Awards & Recognition
```yaml
- sectionType: logos-list
  containerTag: section
  hasCenteredContent: true
  text:
    title: "Awards & Recognition"
    titleTag: "h2"
    prose: "Our commitment to excellence has been recognized by industry leaders"
  logos:
    source: "awards"
    logoWidth: 160
    scope: "all"
    showTitle: true  # Display award names
  ctas:
    - url: "/about/awards"
      label: "Learn More"
      isButton: true
      buttonStyle: "secondary"
```

### Social Media Links
```yaml
- sectionType: logos-list
  containerTag: aside
  logos:
    source: "socialLinks"
    logoWidth: 60
    scope: "selections"
    selections:
      - "LinkedIn"
      - "Twitter" 
      - "GitHub"
```

### Partner Organizations
```yaml
- sectionType: logos-list
  isReverse: true
  text:
    title: "Our Partners"
    prose: "We collaborate with organizations that share our vision"
  logos:
    source: "partners"
    logoWidth: 200
    scope: "all"
  ctas:
    - url: "/partnerships"
      label: "Become a Partner"
      isButton: true
```

### Technology Stack Display
```yaml
- sectionType: logos-list
  text:
    title: "Built With Best-in-Class Technology"
  logos:
    source: "technologies"
    logoWidth: 120
    scope: "selections"
    selections:
      - "React"
      - "Node.js"
      - "TypeScript"
      - "MongoDB"
```

## Customization Options

### Animation Speed
Modify scrolling speed via CSS custom properties:
```css
.custom-speed .logos-wrapper {
  --animation-speed: 20s;  /* Slower scrolling */
}
```

### Logo Dimensions
Adjust individual logo sizing:
```css
.large-logos .logos li {
  width: 250px !important;  /* Override inline width */
}
```

### Custom Fade Effects
Modify edge gradient effects:
```css
.subtle-fade .mask:has(.play):before,
.subtle-fade .mask:has(.play):after {
  width: 10rem;  /* Smaller fade area */
  background-image: linear-gradient(
    to right,
    rgba(248, 249, 250, 1) 0%,
    transparent 100%
  );
}
```

### Reverse Animation Override
```css
.is-reverse .logos-wrapper.play {
  animation-direction: reverse;
}
```

## Dependencies

- `logo`: Renders individual logo images with links
- `icon`: Renders SVG icons for social links and icon-based entries
- `text`: Renders text content block (lead-in, title, subtitle, prose)
- `ctas`: Renders call-to-action buttons
- `commons`: Provides base container and styling utilities

## Required Nunjucks Filters
- `getSelections`: Custom filter for filtering data by selections array
- `hasText`: Check if text object has meaningful content
- `hasCtas`: Check if CTAs array has valid entries

## Accessibility

- **Semantic HTML**: Uses proper list structure for logo collections
- **Alt Text**: Comprehensive alt text for all logo images
- **Link Context**: Clear link destinations and purposes
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Reduced Motion**: Respects user preferences for reduced motion
- **Screen Readers**: Proper markup for assistive technology

## Best Practices

1. **Image Optimization**: Use SVG logos when possible for crisp scaling
2. **Data Organization**: Keep JSON data files organized and up-to-date
3. **Performance**: Limit logo count for better performance (recommended: 6-12 logos)
4. **Consistent Sizing**: Use similar aspect ratios for visual consistency
5. **Load Testing**: Test with various screen sizes and logo counts
6. **Content Strategy**: Group related logos logically (clients, partners, awards, etc.)
7. **Fallbacks**: Provide fallback images for external logo dependencies
8. **Award Titles**: Use `showTitle: true` for awards and social proof sections
9. **Text Content**: Include descriptive text to provide context for logo collections
10. **CTAs**: Add clear calls-to-action to guide users to more information

## Performance Considerations

- **CSS Animations**: Uses hardware-accelerated transforms for smooth performance
- **Event Optimization**: Efficient ResizeObserver usage with debouncing
- **Memory Management**: Proper cleanup of event listeners and timers
- **Image Loading**: Consider lazy loading for large logo collections
- **Animation Efficiency**: Pauses animations when not visible using Intersection Observer

## Browser Support

- **Modern Browsers**: Full support for CSS animations and ResizeObserver
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Optimization**: Touch-friendly interactions and responsive behavior
- **Performance**: Optimized for various device capabilities

The logos list component provides an elegant solution for showcasing organizational relationships, awards, social presence, and brand partnerships while maintaining excellent performance and user experience.