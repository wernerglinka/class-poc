# Site building notes

All pages are built with section components. The section components are defined in the `lib/layouts/components/sections` directory. Each section component has a nunjucks template, a css file and a manifest.json file. The manifest.json file is used by the component bundler to determine the dependencies of the section component.

The section components define the structure of the section and related styles and scripts. All sections but one are monolithic, meaning they are single purpose elements. The exception is the composed section, which allows for multiple columns of content. The composed section is used to create any layout. In its extreme form, only the hero and composed sections are needed to build any page. But it may be more convenient to use the other sections for specific purposes. This maybe a matter of how the skill level of site editors varies.

The site is build with a global css file, `lib/assets/global-styles.css`, which contains all the global styles. The global styles are not bundled with the component styles, because they are not dependent on any component. The global styles are imported in the `head.njk` file.

Style implementation is following the principles of [Every Layout](https://every-layout.dev/) and [CUBE CSS](https://cube.fyi/)  plus using fluid typography and spacing principles as described on [Utopia](https://utopia.fyi/). The Utopia calculator uses type sizes from 16px for very small screens and and 20px for very large screens. The fluid spacing is based on the same principles as the fluid typography. 

The component styles are bundled into a single file, `assets/components.css`, by the component bundler and are imported in the `head.njk` file by the component bundler.

As all layout partials and sections have associated styles, when composing a new layout with the composed section, it will be largely styled by the styles of the components used in the layout. However, it maybe necessary to add additional styles to the composed section itself. These styles should be added to the `composed.css` file in the 'utility classes section. Custom classes may be added to the 'columns' container as well as to each 'column' which allows fine grade styling on the custom section.

Various examples are included on pages of this site to demonstrate the use of the section components.

