# Flip Cards Section Component

An interactive card section that displays a collection of flip cards with 3D rotation effects. Each card has a front and back side with different content, creating engaging hover and interaction experiences for showcasing features, team members, or services.

## Features

- **3D Flip Animation**: Smooth CSS 3D transforms with perspective
- **Multi-Interaction Support**: Mouse hover, touch, and keyboard accessibility
- **Flexible Content**: Front and back sides support text, icons, and CTAs
- **Responsive Grid**: Automatically adjusts card layout based on screen size
- **Icon Integration**: Built-in icon support with extensive icon library
- **Fixed Dimensions**: Consistent card sizing (18rem × 30rem) for uniform appearance
- **Centered Layout**: Cards are centered and evenly spaced
- **Touch-Friendly**: Optimized for mobile and tablet interactions
- **Keyboard Navigation**: Full keyboard accessibility with Enter/Space activation

## Data Structure

```yaml
- sectionType: flip-cards
  containerTag: aside  # aside, section, or div
  disabled: false
  id: ""
  classes: ""
  containerFields:
    inContainer: true
    isAnimated: true
    noMargin:
      top: true
      bottom: false
    noPadding:
      top: false
      bottom: false
    background:
      color: ""
      image: ""
      imageScreen: "none"  # light, dark, none
  cards:
    - front:
        icon: "activity"      # Optional icon name
        text:
          leadIn: "Feature"
          title: "Card Title"
          titleTag: "h3"
          subTitle: ""
          prose: |-
            Front side content with description
            and details about the feature.
        ctas:                 # Optional CTAs on front
          - url: "/learn-more"
            label: "Learn More"
            isButton: false
      back:
        text:
          leadIn: ""
          title: "More Details"
          titleTag: "h3"
          subTitle: ""
          prose: |-
            Back side content with additional
            information and call-to-action.
        ctas:
          - url: "/get-started"
            label: "Get Started"
            isButton: true
            buttonStyle: "primary"
    # Additional cards...
```

## HTML Structure

```html
<div class="container flip-cards content">
  <ul class="flip-cards-list">
    
    <!-- Individual Flip Card -->
    <li class="flip-card-wrapper" tabindex="0">
      
      <!-- Front Side -->
      <div class="flip-card flow">
        <!-- Optional Icon -->
        <svg class="icon activity">
          <!-- Icon content -->
        </svg>
        
        <!-- Flip Indicator -->
        <span class="flip-icon">
          <svg class="icon rotate-cw"><!-- Rotation icon --></svg>
        </span>
        
        <!-- Front Text Content -->
        <div class="text flow">
          <p class="lead-in">Feature</p>
          <h3>Card Title</h3>
          <div class="prose">Front side content...</div>
        </div>
        
        <!-- Optional Front CTAs -->
        <div class="ctas">
          <a class="cta link" href="/learn-more">Learn More</a>
        </div>
      </div>
      
      <!-- Back Side -->
      <div class="flip-card-back">
        <div class="text">
          <h3>More Details</h3>
          <div class="prose">Back side content...</div>
        </div>
        
        <div class="ctas">
          <a class="cta button primary" href="/get-started">Get Started</a>
        </div>
      </div>
      
    </li>
    
    <!-- Additional flip cards... -->
  </ul>
</div>
```

## CSS Architecture

### Card Layout System
```css
.flip-cards {
  --threshold: 20rem;  /* Custom threshold for responsive behavior */
  
  .flip-cards-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 1rem;
    
    > * {
      height: 30rem;        /* Fixed height */
      width: 18rem;         /* Fixed width */
      perspective: 1000px;  /* 3D perspective */
    }
  }
}
```

### 3D Flip Animation
The flip animation is controlled by JavaScript and uses CSS 3D transforms:
- **Perspective**: 1000px creates realistic 3D effect
- **Transform Origin**: Center-based rotation
- **Transition**: Smooth animation between front and back
- **Z-index Management**: Proper layering during flip

### CTA Positioning
```css
.ctas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-m-l);
  margin-top: auto;  /* Push to bottom of card */
}
```

## JavaScript Functionality

### Event Handling
The component includes comprehensive interaction support:

```javascript
// Hover events (desktop)
flipCard.addEventListener('mouseenter', () => {
  flipCard.classList.add('flip');
});

flipCard.addEventListener('mouseleave', () => {
  flipCard.classList.remove('flip');
});

// Touch events (mobile/tablet)
flipCard.addEventListener('touchstart', (e) => {
  e.preventDefault();
  flipCard.classList.toggle('flip');
});

// Keyboard accessibility
flipCard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    flipCard.classList.toggle('flip');
  }
});
```

### Accessibility Features
- **Tabindex**: Cards are keyboard focusable
- **ARIA support**: Screen reader compatible
- **Keyboard navigation**: Enter and Space key activation
- **Focus management**: Proper focus indicators

## Usage Patterns

### Feature Cards
```yaml
- sectionType: flip-cards
  cards:
    - front:
        icon: "settings"
        text:
          title: "Easy Setup"
          prose: "Quick and simple configuration process."
      back:
        text:
          title: "Get Started"
          prose: "Follow our step-by-step guide to begin."
        ctas:
          - url: "/setup"
            label: "Start Now"
            isButton: true
            buttonStyle: "primary"
```

### Team Member Cards
```yaml
- sectionType: flip-cards
  cards:
    - front:
        text:
          title: "John Doe"
          subTitle: "Lead Developer"
          prose: "Passionate about creating amazing user experiences."
      back:
        text:
          title: "Contact John"
          prose: "Get in touch for project discussions."
        ctas:
          - url: "mailto:john@example.com"
            label: "Send Email"
            isButton: true
          - url: "/team/john"
            label: "View Profile"
            isButton: false
```

### Service Cards
```yaml
- sectionType: flip-cards
  containerFields:
    background:
      color: "#f8f9fa"
  cards:
    - front:
        icon: "code"
        text:
          leadIn: "Development"
          title: "Web Applications"
          prose: "Custom web application development using modern technologies."
      back:
        text:
          title: "Technologies"
          prose: "React, Node.js, TypeScript, and modern frameworks."
        ctas:
          - url: "/services/web-development"
            label: "Learn More"
            isButton: true
            buttonStyle: "primary"
```

### Product Feature Cards
```yaml
- sectionType: flip-cards
  cards:
    - front:
        icon: "shield"
        text:
          title: "Security First"
          prose: "Enterprise-grade security built into every feature."
      back:
        text:
          title: "Security Features"
          prose: "End-to-end encryption, secure authentication, and compliance."
        ctas:
          - url: "/security"
            label: "Security Details"
            isButton: true
          - url: "/compliance"
            label: "Compliance"
            isButton: false
```

## Card Content Structure

### Front Side Options
- **Icon**: Optional icon from the icon library
- **Text Content**: Lead-in, title, subtitle, and prose
- **CTAs**: Optional call-to-action buttons or links
- **Flip Indicator**: Automatic rotation icon

### Back Side Options
- **Text Content**: Title, subtitle, and detailed prose
- **CTAs**: Primary actions and secondary links
- **No Icon**: Back side typically focuses on content and actions

### Content Guidelines
1. **Front Side**: Brief, engaging preview content
2. **Back Side**: Detailed information and clear calls-to-action
3. **Text Balance**: Keep content length similar for visual consistency
4. **CTA Placement**: Primary actions on back, secondary on front

## Dependencies

- `flip-card`: Individual flip card partial component
- `text`: Text content rendering within cards
- `ctas`: Call-to-action buttons and links
- `icon`: Icon rendering system
- `commons`: Base container and styling utilities

## Customization

### Custom Classes
Add styling through component classes:
```yaml
classes: "feature-cards custom-flip"
```

### Styling Hooks
Key CSS classes for customization:
- `.flip-cards`: Main component container
- `.flip-cards-list`: Card grid container
- `.flip-card-wrapper`: Individual card wrapper
- `.flip-card`: Front side of card
- `.flip-card-back`: Back side of card
- `.flip-card.flip`: Flipped state (added by JavaScript)
- `.flip-icon`: Rotation indicator

### Custom Animations
Override flip animations:
```css
.custom-flip .flip-card-wrapper {
  transition: transform 0.6s ease-in-out;
}

.custom-flip .flip-card-wrapper.flip {
  transform: rotateY(180deg);
}
```

### Card Dimensions
Modify card sizes:
```css
.feature-cards .flip-cards-list > * {
  height: 25rem;  /* Shorter cards */
  width: 20rem;   /* Wider cards */
}
```

### Custom Layouts
Create alternative grid layouts:
```css
.minimal-cards .flip-cards-list {
  justify-content: flex-start;  /* Left-align cards */
  gap: 2rem;                   /* Larger spacing */
}
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support with Enter/Space activation
- **Focus Indicators**: Clear visual focus states
- **Screen Readers**: Proper semantic structure and content
- **Touch Accessibility**: Optimized for touch devices
- **Color Contrast**: Ensures sufficient contrast ratios
- **Motion Sensitivity**: Respects user preferences for reduced motion

## Best Practices

1. **Content Consistency**: Maintain similar content lengths across cards
2. **Icon Selection**: Choose meaningful, recognizable icons
3. **CTA Clarity**: Use clear, action-oriented button labels
4. **Performance**: Limit the number of cards for optimal performance
5. **Mobile Experience**: Test touch interactions on various devices
6. **Loading States**: Consider loading animations for dynamic content
7. **Error Handling**: Provide fallbacks for missing icons or content

## Browser Support

- **Modern Browsers**: Full support for CSS 3D transforms
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Browsers**: Optimized for iOS Safari and Chrome Mobile
- **Touch Support**: Native touch event handling

## Performance Considerations

- **CSS Animations**: Hardware-accelerated transforms for smooth performance
- **Event Throttling**: Efficient event handling to prevent performance issues
- **Image Optimization**: Optimize any background images or icons
- **Script Loading**: JavaScript loads after DOM content for faster initial rendering

The flip cards component provides an engaging way to present information while maintaining excellent usability and accessibility standards.