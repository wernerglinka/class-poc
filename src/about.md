---
layout: pages/sections.njk
bodyClasses: 'sections-page'
hasHero: true

navigation:
  navLabel: 'About'
  navIndex: 1

seo:
  title: About MS2025 Structured Content Starter
  description: 'A Metalsmith Starter to build modern websites using structured data and reusable components.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''

sections:
  - sectionType: hero
    containerTag: section
    classes: 'first-section'
    id: ''
    description: "This is a hero section with a background image and text overlay. The background image may be screened with a light or dark screen ( set with 'imageScreen' property in the background object ) so the text is not over powered by the image. The text area has a lead-in, title, sub-title, and prose. The prose is markdown text. All of the text parts are optional. There can be multiple CTAs, which are optional and may be buttons or links."
    isDisabled: false
    isFullScreen: false
    isReverse: true
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: true
        color: ''
        image: '/assets/images/sample7.jpg'
        imageScreen: 'dark' # light, dark, none
    text:
      leadIn: 'What is structured content?'
      title: About the Metalsmith2025 Structured Content Starter
      titleTag: 'h1'
      subTitle: ''
      prose: 'Structured content represents a shift in how we traditionally think about content creation and management for static websites. Instead of writing content as continuous Markdown text, structured content treats each piece of information as discrete, reusable data that can be presented consistently across different contexts.'
    ctas:
      - url: ''
        label: ''
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        This approach separates content from presentation in a way that benefits everyone involved in the web development process. Content creators can focus on the substance of their message without getting distracted by formatting concerns. Designers can ensure visual consistency without having to manually review every piece of content. Developers can build maintainable systems that scale gracefully as content requirements evolve.

        The structured content starter demonstrates these principles in action through a component-based architecture that makes complex layouts approachable and maintainable. Rather than asking content creators to learn markup languages or template syntax, the system provides a clear configuration interface that handles the technical details automatically.

    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner banner-accordion-header'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample7.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: Why move beyond Markdown?
      titleTag: 'h2'
      subTitle: ''
      prose: ''
    ctas: []
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: 'banner-accordion-content is-closed'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Markdown provides a simple way to add formatting to plain text, and it is an excellent choice for many use cases. However, as websites become more sophisticated and design requirements more complex, the limitations of Markdown-centric approaches become apparent.

        Modern websites require consistent design patterns, reusable components, and flexible layout options that go beyond what Markdown can easily provide. While you can use ebedded HTML in some Markdown implementations, it leads to learning curves that offset Markdown's simplicity benefits.

        The structured content approach embraces the reality that most modern websites are built from components rather than flowing text. By organizing content into discrete sections with clear interfaces, you gain the flexibility to create sophisticated layouts while maintaining the simplicity that makes content management approachable.

        This doesn't mean abandoning Markdown entirely. Rich text formatting still has its place, and the structured approach can incorporate Markdown processing where it makes sense. The key difference is that Markdown becomes one tool among many rather than the primary organizing principle for your content.

    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner banner-accordion-header'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample6.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: Features and capabilities
      titleTag: 'h2'
      subTitle: ''
      prose: ''
    ctas: []
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: 'banner-accordion-content is-closed'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: true
        color: ''
        image: '/assets/images/sample7.jpg'
        imageScreen: 'dark' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        The structured content starter includes a comprehensive set of components that demonstrate different approaches to content organization and presentation. Hero sections show how to create compelling page headers with configurable messaging and visual elements. Content blocks demonstrate how structured text can be more maintainable than traditional approaches while supporting rich formatting options.

        Media components illustrate how images, videos, and other assets can be integrated seamlessly into the structured content workflow. Gallery sections show how collections of related content can be managed through simple configuration rather than complex template logic. And as this page demonstrates accordions provide a way to organize content into expandable sections for better readability and scannability. Each component is truly self-contained, managing its own styles and JavaScript behavior with automatic dependency resolution that prevents conflicts and ensures optimal loading order.

        The entire system is built on Metalsmith's flexible architecture, enhanced with automatic component discovery and asset bundling. Components can declare dependencies on other components, and the build system automatically ensures everything loads in the correct sequence. PostCSS integration provides modern CSS processing capabilities, while JavaScript scope isolation prevents global namespace pollution.

        The component system handles the technical complexity while providing developers with intuitive configuration options. Add new components by simply creating the appropriate directory structure, and the build system discovers and integrates them automatically.

    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner banner-accordion-header'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample8.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: Part of the Metalsmith Redux series
      titleTag: 'h2'
      subTitle: ''
      prose: ''
    ctas: []
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: 'banner-accordion-content is-closed'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: false
        color: ''
        image: '/assets/images/sample7.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        This starter serves as a follow-up to the Metalsmith Redux blog series. While the articles in the series focused on traditional Markdown-based workflows, this starter represents an evolution toward more structured approaches that better serve complex website requirements.

        The series progression reflects the natural development path many developers follow when working with static site generators. You start with simple Markdown files and basic templates, then gradually discover the need for more sophisticated content organization as your projects grow in complexity.

        The structured content approach allows to balance simplicity with capability in static site generation. By treating content as data and emphasizing component reusability, you can build sophisticated websites without sacrificing maintainability or requiring extensive technical knowledge from content creators.

        Each technique demonstrated in this starter builds on concepts introduced in the Metalsmith2025 Simple Starter, creating a learning path that takes you from basic static site generation to advanced content architecture patterns.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner banner-accordion-header'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample9.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: The Metalsmith advantage
      titleTag: 'h2'
      subTitle: ''
      prose: ''
    ctas: []
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: 'banner-accordion-content is-closed'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: false
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Metalsmith's plugin-based architecture makes it uniquely well-suited for structured content approaches. Unlike opinionated frameworks that impose specific patterns, Metalsmith provides the flexibility to implement exactly the content workflow that makes sense for your project.

        The structured content starter leverages this flexibility to create a system that feels natural and intuitive. Content creators work with familiar YAML configuration syntax. Template authors use standard Nunjucks templating. The build system handles all the integration complexity automatically, including component discovery, dependency resolution, and asset bundling.

        Simple sites can be built with minimal configuration. Complex sites benefit from the same patterns without requiring fundamental changes to the approach. Components remain truly encapsulated units that can be developed, tested, and maintained independently.

        Metalsmith's minimalist core philosophy means you're not carrying the weight of features you don't need, while the rich plugin ecosystem ensures you can add capabilities as requirements evolve. The component bundling system enhances these benefits by providing automatic asset management that prevents the maintenance complexity that typically emerges as component libraries grow.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner banner-accordion-header'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample10.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: ''
      title: Getting started with your own project
      titleTag: 'h2'
      subTitle: ''
      prose: ''
    ctas: []
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: 'banner-accordion-content is-closed'
    id: 'section-id'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: false
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: ''
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Begin exploring the structured content approach by examining the configuration files included with this starter. Each page's frontmatter provides a complete specification of its structure and content, making it easy to understand how the component system works in practice.

        Try rearranging sections within existing pages. Once you're comfortable with the basic patterns, start building your own component templates to match your own design requirements. The component system provides clear separation between content logic and presentation details, making it easy to update styling without affecting content structure.

        The structured content approach rewards systematic thinking about content organization and component design, but it doesn't require you to plan everything in advance. Start with simple configurations and let the system grow naturally as you discover new requirements and opportunities for reuse.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
---
