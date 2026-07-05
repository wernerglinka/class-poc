# Flip Card Component

Interactive card component that flips to reveal additional content on hover, touch, or keyboard interaction. Perfect for team profiles, product showcases, or feature highlights.

## Features

- **3D Flip Animation**: Smooth CSS3 transform animations
- **Multiple Triggers**: Responds to hover, touch, and keyboard events
- **Accessibility Support**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works seamlessly across all device sizes
- **Customizable Content**: Flexible front and back content structures

## Data Structure

```yaml
flipCard:
  front:
    image:
      src: "/assets/images/team-member.jpg"
      alt: "John Doe"
    title: "John Doe"
    subtitle: "Lead Developer"
  back:
    title: "About John"
    content: "Experienced developer with expertise in modern web technologies."
    ctas:
      - url: "mailto:john@example.com"
        label: "Contact"
        isButton: true
```

## Properties

### Front Side
- `front.image.src`: Front side image path
- `front.image.alt`: Image alt text
- `front.title`: Main title on front
- `front.subtitle`: Subtitle text on front

### Back Side
- `back.title`: Title on back side
- `back.content`: Content text (supports markdown)
- `back.ctas`: Array of call-to-action buttons/links

## HTML Structure

```html
<div class="flip-card-wrapper" tabindex="0">
  <div class="flip-card">
    <div class="flip-card-front">
      <img src="/assets/images/team-member.jpg" alt="John Doe">
      <div class="flip-card-content">
        <h3>John Doe</h3>
        <p>Lead Developer</p>
      </div>
    </div>
    
    <div class="flip-card-back">
      <div class="flip-card-content">
        <h3>About John</h3>
        <p>Experienced developer with expertise in modern web technologies.</p>
        <div class="flip-card-actions">
          <a href="mailto:john@example.com" class="button">Contact</a>
        </div>
      </div>
    </div>
  </div>
</div>
```

## CSS Classes

- `.flip-card-wrapper`: Outer container with interaction handling
- `.flip-card`: Main card container with 3D transform
- `.flip-card-front`: Front side content
- `.flip-card-back`: Back side content (initially hidden)
- `.flip-card-content`: Content wrapper for both sides
- `.flip-card-actions`: CTA container on back side
- `.flip`: Applied when card is flipped

## Usage Examples

### Team Member Card
```yaml
flipCard:
  front:
    image:
      src: "/assets/images/sarah-wilson.jpg"
      alt: "Sarah Wilson"
    title: "Sarah Wilson"
    subtitle: "UX Designer"
  back:
    title: "About Sarah"
    content: "Passionate about creating intuitive user experiences with 5+ years in design."
    ctas:
      - url: "/team/sarah"
        label: "View Profile"
        isButton: true
      - url: "https://linkedin.com/in/sarah-wilson"
        label: "LinkedIn"
        isButton: false
```

### Product Feature Card
```yaml
flipCard:
  front:
    image:
      src: "/assets/images/feature-security.svg"
      alt: "Security Feature"
    title: "Advanced Security"
    subtitle: "Enterprise-grade protection"
  back:
    title: "Security Details"
    content: "End-to-end encryption, multi-factor authentication, and regular security audits."
    ctas:
      - url: "/security"
        label: "Learn More"
        isButton: true
```

### Service Card
```yaml
flipCard:
  front:
    image:
      src: "/assets/images/service-consulting.jpg"
      alt: "Consulting Services"
    title: "Web Consulting"
    subtitle: "Expert guidance for your project"
  back:
    title: "Our Approach"
    content: "We provide strategic consulting to help you make the right technology decisions."
    ctas:
      - url: "/contact"
        label: "Get Started"
        isButton: true
      - url: "/case-studies"
        label: "Case Studies"
        isButton: false
```

## JavaScript Interactions

The component responds to:

1. **Mouse Events**: `mouseenter` and `mouseleave`
2. **Touch Events**: `touchstart` to toggle flip state
3. **Keyboard Events**: `Enter` and `Space` keys to toggle
4. **Focus Management**: Proper tabindex for keyboard navigation

## CSS Animation

```css
.flip-card {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.flip {
  transform: rotateY(180deg);
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

## Accessibility Features

- **Keyboard Navigation**: Cards are focusable and respond to keyboard input
- **Screen Reader Support**: Proper semantic structure with headings
- **ARIA Labels**: Descriptive labels for interactive elements
- **Focus Indicators**: Clear visual focus states
- **Content Access**: Both sides accessible to screen readers

## Best Practices

1. **Content Balance**: Keep front and back content lengths similar
2. **Visual Hierarchy**: Use consistent heading levels across cards
3. **Image Quality**: Use high-quality images optimized for web
4. **Performance**: Avoid too many flip cards on a single page
5. **Mobile Experience**: Ensure touch interactions work smoothly

## Browser Support

- **3D Transforms**: IE10+ and all modern browsers
- **CSS Transitions**: Supported in all modern browsers
- **Touch Events**: Full mobile device support
- **Progressive Enhancement**: Graceful degradation for older browsers

## Customization

### Animation Speed
```css
.flip-card {
  transition: transform 0.3s; /* Faster flip */
}
```

### Flip Direction
```css
.flip-card.flip {
  transform: rotateX(180deg); /* Vertical flip */
}
```

### Custom Effects
```css
.flip-card {
  transform-origin: center center;
  transition: transform 0.6s ease-in-out;
}
```