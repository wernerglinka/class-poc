# Testimonial Section Component

A professional testimonial component designed to showcase customer quotes, reviews, and endorsements. Features flexible quotee information display, semantic HTML structure, and responsive design optimized for credibility and readability.

## Features

- **Semantic HTML Structure**: Uses proper `<blockquote>` and citation elements for SEO and accessibility
- **Flexible Quotee Information**: Supports portrait, name, title, company, and logo display
- **Responsive Typography**: Large, readable quote text with optimal line length
- **Citation Support**: Optional cite URL for quote attribution
- **Portrait Display**: Circular portrait images with proper sizing
- **Company Branding**: Optional company logo integration
- **Reverse Layout**: Alternative layout positioning for design variety
- **Character-Based Responsiveness**: Uses character count (25ch) for optimal text wrapping
- **Centered Alignment**: Professional centered layout for maximum impact
- **Typography Hierarchy**: Clear visual hierarchy with proper font sizing

## Data Structure

```yaml
- sectionType: testimonial
  containerTag: aside  # aside, section, or div
  disabled: false
  id: ""
  classes: ""
  isReverse: false     # Alternate layout positioning
  containerFields:
    inContainer: false  # Full-width background recommended
    isAnimated: true
    noMargin:
      top: true
      bottom: false
    noPadding:
      top: true
      bottom: true
    background:
      color: "lightgray"  # Background color for full section
      image: ""
      imageScreen: "none"
  quote:
    text: "Your testimonial quote text goes here. Keep it impactful and authentic."
    cite: "https://example.com/source"  # Optional citation URL
  quotee:
    portrait:
      src: "/assets/images/customer-photo.jpg"
      alt: "Customer Name"
    name: "John Smith"
    title: "CEO"                        # Optional job title
    company: "Company Name"             # Optional company name
    logo: "/assets/images/company-logo.svg"  # Optional company logo
```

## HTML Structure

```html
<div class="testimonial content container">
  
  <!-- Quotee Information -->
  <div class="quotee">
    <!-- Portrait (Optional) -->
    <div class="portrait">
      <img src="/assets/images/customer-photo.jpg" alt="John Smith">
    </div>
    
    <!-- Name (Required) -->
    <div class="name">John Smith</div>
    
    <!-- Title (Optional) -->
    <div class="title">CEO</div>
    
    <!-- Company (Optional) -->
    <div class="company">Company Name</div>
    
    <!-- Company Logo (Optional) -->
    <div class="logo">
      <img src="/assets/images/company-logo.svg" alt="Company Name">
    </div>
  </div>
  
  <!-- Quote -->
  <blockquote cite="https://example.com/source">
    <p>Your testimonial quote text goes here. Keep it impactful and authentic.</p>
  </blockquote>
  
</div>
```

## CSS Architecture

### Layout Structure
Implements the Every Layout Switcher pattern for responsive layout:
```css
.testimonial {
  --threshold: 25ch !important;  /* Controls when layout switches */
  padding: var(--space-l-2xl);
  overflow: hidden;
}
```

The component inherits the Switcher pattern from the `.content` class in commons.css, which automatically switches between horizontal and vertical layouts based on the container width and the threshold value. The threshold of `25ch` ensures the layout switches to vertical relatively early for optimal readability of the quote text.

### Quotee Styling
```css
.quotee {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 17rem;
  margin-inline: auto;
  text-align: center;
}
```

### Portrait Design
```css
.quotee .portrait {
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  overflow: hidden;
}
```

### Typography Hierarchy
```css
.quotee .name {
  font-size: var(--font-h5);
  font-weight: 500;
  line-height: 2;
}

.quotee .title,
.quotee .company {
  font-size: var(--font-p);
  line-height: 1.2;
}

blockquote {
  font-size: var(--font-h2);
  font-style: italic;
  max-width: 40ch;
  text-align: center;
  flex-grow: 2 !important;
}
```

### Logo Styling
```css
.quotee .logo {
  margin-block-start: 1.5em;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
}
```

### Responsive Behavior
- **Switcher Pattern**: Automatically switches between horizontal and vertical layouts
- **Threshold**: Set to `25ch` - switches based on container width relative to character width
- **Horizontal Layout**: When container is wider than threshold (quotee on left, quote on right)
- **Vertical Layout**: When container is narrower than threshold (quotee above quote)
- **Text-Responsive**: Using `ch` units means the breakpoint adapts to font size
- **Early Switch**: The low `25ch` threshold ensures vertical stacking for better quote readability

## Usage Patterns

### Customer Testimonial
```yaml
- sectionType: testimonial
  containerTag: section
  containerFields:
    inContainer: false
    background:
      color: "#f8f9fa"
  quote:
    text: "This product completely transformed our workflow. The results exceeded our expectations."
    cite: "https://company.com/case-study"
  quotee:
    portrait:
      src: "/assets/images/customers/sarah-johnson.jpg"
      alt: "Sarah Johnson"
    name: "Sarah Johnson"
    title: "Operations Director"
    company: "Tech Solutions Inc."
    logo: "/assets/images/logos/tech-solutions.svg"
```

### Client Review
```yaml
- sectionType: testimonial
  containerFields:
    background:
      color: "#e8f4f8"
  quote:
    text: "Outstanding service and attention to detail. Highly recommended for any business."
  quotee:
    portrait:
      src: "/assets/images/clients/michael-chen.jpg"
      alt: "Michael Chen"
    name: "Michael Chen"
    title: "Founder"
    company: "StartupCorp"
```

### Employee Testimonial
```yaml
- sectionType: testimonial
  isReverse: true
  quote:
    text: "Working here has been the most rewarding experience of my career."
  quotee:
    portrait:
      src: "/assets/images/team/alice-smith.jpg"
      alt: "Alice Smith"
    name: "Alice Smith"
    title: "Senior Developer"
    company: "Our Company"
```

### Product Review
```yaml
- sectionType: testimonial
  containerFields:
    inContainer: false
    background:
      color: "#fff8f0"
  quote:
    text: "The best investment we've made for our business. ROI was immediate and substantial."
    cite: "https://reviews.com/product-review"
  quotee:
    portrait:
      src: "/assets/images/reviews/david-brown.jpg"
      alt: "David Brown"
    name: "David Brown"
    title: "Business Owner"
```

## Content Structure

### Required Fields
- `quote.text`: The testimonial content
- `quotee.name`: Name of the person giving the testimonial

### Optional Fields
- `quote.cite`: URL for quote attribution
- `quotee.portrait`: Customer/client photo
- `quotee.title`: Job title or role
- `quotee.company`: Company or organization name
- `quotee.logo`: Company logo image
- `isReverse`: Layout variation flag

### Content Guidelines
1. **Quote Length**: Keep testimonials concise but impactful (1-3 sentences ideal)
2. **Authenticity**: Use real quotes from actual customers/clients
3. **Relevance**: Match testimonial content to page context
4. **Attribution**: Include proper citation when possible
5. **Visual Elements**: Use high-quality portrait photos and logos

## Dependencies

- `image`: Handles portrait and logo image rendering
- `text`: Provides text formatting utilities (if needed)
- `ctas`: Call-to-action support (if extended)
- `commons`: Base container and styling utilities

## Customization

### Custom Classes
Add styling through component classes:
```yaml
classes: "featured-testimonial highlight-review"
```

### Styling Hooks
Key CSS classes for customization:
- `.testimonial`: Main component container
- `.testimonial.is-reverse`: Reverse layout variant
- `.quotee`: Quotee information container
- `.quotee .portrait`: Portrait image container
- `.quotee .name`: Name styling
- `.quotee .title`: Title/role styling
- `.quotee .company`: Company name styling
- `.quotee .logo`: Company logo container
- `blockquote`: Quote text container

### Background Customization
Since testimonials often need full-width backgrounds:
```yaml
containerFields:
  inContainer: false  # Allows full-width background
  background:
    color: "#custom-color"
```

### Typography Adjustments
Modify quote and quotee typography:
```css
.custom-testimonial blockquote {
  font-size: var(--font-h3);  /* Smaller quote text */
  max-width: 50ch;            /* Wider text block */
}

.custom-testimonial .quotee .name {
  font-size: var(--font-h4);
  color: var(--color-primary);
}
```

### Layout Variations
Create alternative layouts:
```css
.horizontal-testimonial {
  display: grid;
  grid-template-columns: 1fr 2fr;
  text-align: left;
}

.minimal-testimonial .quotee .portrait {
  width: 5rem;
  height: 5rem;
}
```

## Accessibility

- **Semantic HTML**: Proper `<blockquote>` and citation structure
- **Alt Text**: Required alt attributes for all images
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Semantic structure aids screen reader navigation
- **Focus Management**: Proper focus indicators for any interactive elements
- **Citation Links**: Proper link context when cite URLs are provided

## Best Practices

1. **Authenticity**: Use genuine testimonials from real customers
2. **Permissions**: Obtain proper permissions to use customer photos and company logos
3. **Quality Images**: Use high-resolution portraits and logos
4. **Consistency**: Maintain consistent formatting across multiple testimonials
5. **Context**: Place testimonials strategically within content flow
6. **Variety**: Mix different types of testimonials (customers, employees, partners)
7. **Updates**: Keep testimonials current and relevant

## SEO Benefits

- **Structured Data**: Semantic blockquote markup aids search engines
- **Citation Links**: Proper attribution can provide SEO value
- **Trust Signals**: Customer testimonials improve page trustworthiness
- **Content Freshness**: Regular testimonial updates signal active engagement
- **Social Proof**: Testimonials enhance overall page credibility

## Performance Considerations

- **Image Optimization**: Optimize portrait and logo images for web
- **Lazy Loading**: Consider lazy loading for non-critical images
- **Font Loading**: Ensure italic fonts load efficiently
- **Layout Shift**: Use proper image dimensions to prevent layout shifts
- **Accessibility**: Balance visual impact with screen reader performance

The testimonial component provides a professional solution for showcasing customer feedback and building trust while maintaining excellent accessibility and performance standards.