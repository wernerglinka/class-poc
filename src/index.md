---
layout: pages/sections.njk
bodyClasses: 'sections-page'
hasHero: true

topMessage:
  text: '✨JUNE & JULY CLASSES✨'
  link:
    url: '/classes/'
    label: 'OPEN FOR REGISTRATION'
  dismissible: true

navigation:
  navLabel: 'Home'
  navIndex: 0

seo:
  title: MS2025 Structured Content Starter
  description: 'A Metalsmith Starter to build modern websites using structured data and reusable components.'
  socialImage: '/assets/images/sample2.jpg'
  canonicalURL: ''

sections:
  - sectionType: hero
    containerTag: section
    classes: 'first-section merge-with-next'
    id: ''
    description: "This is a hero section that merges with the next section. The hero section has a class of 'merge-with-next' which removes the bottom margin. The next section has 'containerFields.noMargin.top' set to true which removes the top margin. The hero section also has a class of 'main-hero' which is used to apply specific styles for this particulat hero implementation."

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
        image: '/assets/images/sample4.jpg'
        imageScreen: 'dark' # light, dark, none
    text:
      leadIn: ''
      title: Welcome to Metalsmith 2025 Structured Content Starter
      titleTag: 'h1'
      subTitle: 'Component-Driven Web Development Without the Framework Overhead'
      prose: Welcome to the Metalsmith2025 Structured Content Starter – a demonstration of how modern websites can be built using structured data and reusable components without relying on heavy Markdown content or complex JavaScript frameworks. This starter showcases a component-based approach to static site generation that prioritizes maintainability, consistency, and developer experience.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: columns
    containerTag: section
    classes: 'media-image hero-cta'
    id: ''
    description: "This is a composed section that merges with the previous hero section. The hero section has a class of 'merge-with-next' which removes the bottom margin. The composed section has 'containerFields.noMargin.top' set to true which removes the top margin. The composed section also has a class of 'in-container' which wraps the section in a container. This is a popular visual pattern in corporate and marketing websites."
    isDisabled: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: true
        bottom: false
      noPadding:
        top: true
        bottom: true
      background:
        color: ''
        image: ''
    contentClasses: 'glass-background'
    columns:
      - column:
        columnClasses: 'image'
        blocks:
          - image:
              src: '/assets/images/sample3.jpg'
              alt: 'nunjucks'
              caption: ''
      - column:
        columnClasses: 'text flow'
        blocks:
          - text:
              leadIn: This is different
              title: The Power of Composable Pages
              titleTag: 'h2'
              subTitle: ''
              prose: |-
                This is an example of a composed section. Rather then using a monolithic section, the composed section allows for multiple columns of content. Allowing the composition of custom layouts.
      - column:
        columnClasses: 'ctas align-center'
        blocks:
          - ctas:
              - url: 'https://glinka.co/blog/building-flexible-page-layouts/'
                label: 'Learn More'
                isButton: true
                buttonStyle: 'primary'

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
      leadIn: 'Simple Text Section'
      title: Rethinking Content Architecture
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Traditional static site generators encourage you to write long-form Markdown content mixed with occasional structured elements. While this works well for blogs and documentation sites, it can become unwieldy when building more complex websites that require consistent design patterns and reusable components.

        This starter takes a different approach by treating content as structured data organized into discrete sections. Instead of writing lengthy Markdown files, you define your content through frontmatter configuration and compose pages from reusable components.
        The benefits of this approach become clear when you consider real-world content management scenarios. Content creators can focus on the substance of their message without worrying about markup details. Designers can ensure visual consistency across the entire site. Developers can maintain a clean separation between content, presentation, and logic.

    ctas:
      - url: '/blog/architecture-philosophy'
        label: 'Read about the Architecture Philosophy'
        isButton: true
        buttonStyle: 'primary'

  - sectionType: logos-list
    containerTag: aside
    classes: ''
    id: 'logosList'
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: false
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    logos:
      source: 'artMuseums'
      logoWidth: 200
      scope: 'all'
      selections: []

  - sectionType: multi-media
    containerTag: aside
    classes: ''
    id: ''
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: false
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: 'And what is this?'
      title: Media Section Example
      titleTag: 'h2'
      subTitle: ''
      prose: Example of a media section with text and image. Change the image/text positions by setting the 'isReverse' property in the section data. The text area has a lead-in, title, sub-title, and prose. The prose is markdown text. All of the text parts are optional. There can be multiple CTAs, which are optional and may be buttons or links.
    ctas:
      - url: 'https://apple.com'
        label: 'go to apple'
        isButton: true
        buttonStyle: 'primary'
      - url: 'https://ibm.com'
        label: 'go to big brother'
        isButton: false
        buttonStyle: 'primary'
    mediaType: image
    image:
      src: '/assets/images/sample5.jpg'
      alt: 'nunjucks'
      caption: 'Tortor Bibendum Sit Egestas'

  - sectionType: banner
    containerTag: aside
    classes: 'cta-banner'
    id: ''
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: false
        bottom: false
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: '/assets/images/sample6.jpg'
        imageScreen: 'light' # light, dark, none
    text:
      leadIn: 'And what is this?'
      title: CTA Banner Example
      titleTag: 'h2'
      subTitle: May use background image of color
      prose: Example of a CTA banner section with text and backgroundimage. The text area has a lead-in, title, sub-title, and prose. The prose is markdown text. All of the text parts are optional. There can be multiple CTAs, which are optional and may be buttons or links.
    ctas:
      - url: 'https://metalsmith-components.com'
        label: 'Learn More'
        isButton: true
        buttonStyle: 'primary'
      - url: 'https://metalsmith.io'
        label: 'Be a Metalsmith'
        isButton: false
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
