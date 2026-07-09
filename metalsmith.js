/**
 * Metalsmith Build Configuration
 *
 * This file configures how Metalsmith builds your site. Each section is documented
 * to help beginners understand what's happening at each step.
 */

// Apply File API polyfill if needed (for GitHub Actions compatibility)
import './file-polyfill.js';

import * as fs from 'node:fs'; // File system operations (read/write files)
import path, { dirname } from 'node:path'; // Handles file paths across different OS
import { performance } from 'node:perf_hooks'; // Measures build performance
// These are built-in Node.js modules needed for file paths and operations
import { fileURLToPath } from 'node:url'; // Converts file:// URLs to file paths
import collections from '@metalsmith/collections';
import drafts from '@metalsmith/drafts'; // Excludes draft content from builds
import layouts from '@metalsmith/layouts'; // Applies templates to content
import permalinks from '@metalsmith/permalinks'; // Creates clean URLs
import autoprefixer from 'autoprefixer'; // Adds browser prefixes to CSS
import browserSync from 'browser-sync'; // Live-reload development server
import cssnano from 'cssnano'; // Minifies CSS
// The main Metalsmith library and plugins that transform your content
import Metalsmith from 'metalsmith'; // The core static site generator
import componentDependencyBundler from 'metalsmith-bundled-components';
import menus from 'metalsmith-menu-plus'; // Generates navigation menus
import htmlMinifier from 'metalsmith-optimize-html'; // Minifies HTML in production
import optimizeImages from 'metalsmith-optimize-images'; // Optimizes images for web
import safeLinks from 'metalsmith-safe-links';
import collectionPages from 'metalsmith-sectioned-blog-pagination'; // Paging params for collection landing pages
import seo from 'metalsmith-seo'; // Adds SEO metadata to pages
import cpcClassPages from './plugins/metalsmith-cpc-class-pages.js'; // Generates one page per class offering
import cpcClasses from './plugins/metalsmith-cpc-classes.js'; // Fetches class data from the Google web app

/**
 * Load environment variables from .env (CPC_API_URL, CPC_SHEET_TOKEN).
 * Native to Node 22+, no dotenv dependency. The file is absent on CI,
 * where the platform injects the variables directly, hence the guard.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env file; environment variables must come from the platform
}

// These variables help determine the current directory and file paths
const thisFile = fileURLToPath(import.meta.url); // Gets the actual file path of this script
const thisDirectory = dirname(thisFile); // Gets the directory containing this script
const mainFile = process.argv[1]; // Gets the file that was executed by Node.js

/**
 * ESM (ECMAScript Modules) doesn't support importing JSON directly
 * So we read the package.json file manually to get dependency information
 * @type {Object}
 */
const dependencies = JSON.parse(fs.readFileSync('./package.json')).dependencies;

/**
 * TEMPLATE ENGINE SETUP
 * Import custom Nunjucks filters that extend the template engine
 * These filters provide additional functionality like date formatting,
 * string manipulation, and more.
 */
import * as nunjucksFilters from './nunjucks-filters/index.js';

/**
 * Configuration options for the Nunjucks template engine
 * @type {Object}
 */
const engineOptions = {
  path: ['lib/layouts'], // Where to find template files
  filters: nunjucksFilters // Custom filters for templates
};

/**
 * ENVIRONMENT SETUP
 * Determine if we're in production mode based on NODE_ENV environment variable
 * @type {boolean}
 */
const isProduction = process.env.NODE_ENV !== 'development';

/**
 * Base path for serving the site in a subdirectory
 * e.g., https://example.com/subdirectory/
 * or https://wernerglinka.github.io/metalsmith2025-structured-content-starter/
 */
const basePath = process.env.BASE_PATH || '';

// Variable to hold the development server instance
let devServer = null;

/**
 * Create a new Metalsmith instance
 * This is the core object that will build our site
 * @type {Metalsmith}
 */
const metalsmith = Metalsmith(thisDirectory);

// Pass DEBUG environment variable if it exists
if (process.env.DEBUG) {
  metalsmith.env('DEBUG', process.env.DEBUG);
}

/**
 * Configure the basic Metalsmith settings
 * These determine how Metalsmith will process our files
 */
metalsmith
  // Clean the destination directory before building
  .clean(true)
  // Ignore macOS system files
  .ignore(['**/.DS_Store'])
  .watch(isProduction ? false : ['src/', 'lib/layouts/', 'lib/assets/', 'lib/data/'])
  // Pass NODE_ENV to plugins
  .env('NODE_ENV', process.env.NODE_ENV)
  // Where to find source files
  .source('./src')
  // Where to output the built site
  .destination('./build')
  // Static files in src/assets/ copied directly without plugin processing
  .statik(['assets'])
  .metadata({
    msVersion: dependencies.metalsmith,
    nodeVersion: process.version
  })

  /**
   * Load external data files into metadata
   * This runs on each build, so changes to data files are picked up during watch mode
   * Each JSON file in lib/data becomes a key under metadata.data (e.g., site.json -> data.site)
   */
  .use((_files, metalsmith, done) => {
    const dataDir = path.join(metalsmith.directory(), 'lib', 'data');
    const dataFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
    const data = dataFiles.reduce((obj, file) => {
      const key = file.replace('.json', '');
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      obj[key] = JSON.parse(content);
      return obj;
    }, {});
    metalsmith.metadata().data = data;
    done();
  })

  /**
   * Fetch CPC class data from the Google Apps Script web app and
   * attach it to global metadata as `classes` (approved offerings,
   * sorted by first session date, sessions nested inside).
   * In watch mode the response is cached for five minutes so file-save
   * rebuilds stay fast; production builds always fetch fresh.
   */
  .use(
    cpcClasses({
      apiUrl: process.env.CPC_API_URL,
      token: process.env.CPC_SHEET_TOKEN,
      ttlSeconds: isProduction ? 0 : 300
    })
  )

  /**
   * Generate one structured-content page per class offering
   * (classes/<offeringId>/) from the fetched data. Must run after
   * cpcClasses and before permalinks.
   */
  .use(cpcClassPages({ apiUrl: process.env.CPC_API_URL }))

  // Exclude draft content in production mode
  .use(drafts(!isProduction))

  /**
   * Group the generated class pages into a collection, soonest first,
   * for the classes landing page (src/classes.md).
   * Learn more: https://github.com/metalsmith/collections
   */
  .use(
    collections({
      classes: {
        pattern: 'classes/*.md',
        sort: 'card.date:asc',
        limit: Infinity
      }
    })
  )

  /**
   * Create paging metadata for the classes landing page.
   * Learn more: https://github.com/wernerglinka/metalsmith-sectioned-blog-pagination
   */
  .use(
    collectionPages({
      pagesPerPage: 6,
      blogDirectory: 'classes/',
      mainTemplate: 'classes.md',
      // Count pages from the collection, not a classes/ directory scan,
      // so non-class files under classes/ can never skew the page count
      collectionName: 'classes'
    })
  )

  /**
   * We are not using any markdown contents, only frontmatter
   * to define structured pages. Markdown content of section
   * properties will be done with a Nunjucks filter
   * Learn more: https://github.com/metalsmith/permalinks
   */
  .use(
    permalinks({
      match: '**/*.md'
    })
  )

  /**
   * Generate navigation menus
   * Learn more: https://github.com/wernerglinka/metalsmith-menu-plus
   */
  .use(
    menus({
      metadataKey: 'mainMenu', // Where to store menu data
      usePermalinks: true, // Use clean URLs in menu
      // Exclude generated class detail pages (classes/<id>/...) and
      // pagination pages from the menu; the classes landing page
      // itself (classes/index.html) stays in.
      navExcludePatterns: ['404.html', 'robots.txt', 'classes/*/**']
    })
  )

  /*
    .use( function( files, metalsmith, done ) {
      console.log( 'meta:' );
      // log metadata as json string
      // Replace line 192 with:
      console.log( JSON.stringify( metalsmith.metadata().collections, ( key, value ) => {
        if ( key === 'previous' || key === 'next' ) {
          return value ? { title: value.title, path: value.path } : null;
        }
        return value;
      }, 2 ) );
      done();
    } )
  */

  /**
   * Apply templates to content
   * Learn more: https://github.com/metalsmith/layouts
   */
  .use(
    layouts({
      directory: 'lib/layouts', // Where to find templates
      transform: 'nunjucks', // Template engine to use
      pattern: ['**/*.html'], // Files to apply templates to
      engineOptions // Options for the template engine
    })
  )

  /**
   * Process all links so external links have
   * target="_blank" and rel="noopener noreferrer"
   * attributes and internal links are relative
   * This plugin also supports a basePath option which is necessary
   * when deploying a site to a subdirectory. In this case 'basePath'
   * is set above from the BASE_PATH environment variable.
   * Learn more: https://github.com/wernerglinka/metalsmith-safe-links
   */
  .use(
    safeLinks({
      hostnames: ['http://localhost:3000/', 'wernerglinka.github.io'],
      basePath: basePath
    })
  )

  .use(
    componentDependencyBundler({
      basePath: 'lib/layouts/components/_partials',
      sectionsPath: 'lib/layouts/components/sections',
      schema: {
        // Emit the composed editor schema (build/assets/components-schema.json)
        // for the in-situ editor and Claude to consume as the contract.
        enabled: true
      },
      postcss: {
        enabled: true,
        plugins: [autoprefixer(), cssnano({ preset: 'default' })],
        options: {
          // Additional PostCSS options if needed
        }
      }
    })
  );

// These plugins only run in production mode to optimize the site
if (isProduction) {
  metalsmith
    /**
     * Optimize images for faster loading
     * Learn more: https://github.com/wernerglinka/metalsmith-optimize-images
     */
    .use(
      optimizeImages({
        // Enable progressive loading
        isProgressive: false
      })
    )

    /**
     * Intelligent metadata generation, social media tags, and structured data including Open Graph tags,
     * Twitter Cards, JSON-LD structured data object, a sitemap and a robots.txt file
     * Learn more: https://github.com/wernerglinka/metalsmith-seo
     */
    .use(
      seo({
        metadataPath: 'data.site' // Object in metadata points to where to find site metadata
      })
    )

    /**
     * Optimize HTML by Minify HTML to reduce file size
     * Learn more: https://github.com/wernerglinka/metalsmith-optimize-html
     */
    .use(htmlMinifier());
}

/**
 * BUILD EXECUTION
 * This section handles the actual build process and development server
 * It only runs when this file is executed directly (not when imported)
 */
if (mainFile === thisFile) {
  // Start timing the build for performance measurement
  let t1 = performance.now();

  // Execute the Metalsmith build
  metalsmith.build((err) => {
    // Handle any build errors
    if (err) {
      throw err;
    }

    // Log build success and time taken
    /* eslint-disable no-console */
    console.log(`Build success in ${((performance.now() - t1) / 1000).toFixed(1)}s`);

    // If watch mode is enabled, set up the development server
    if (metalsmith.watch()) {
      if (devServer) {
        t1 = performance.now();
        devServer.reload();
      } else {
        devServer = browserSync.create();

        const config = {
          host: 'localhost',
          port: 3000,
          injectChanges: false,
          reloadThrottle: 0
        };

        if (basePath) {
          // Serve with subdirectory simulation
          config.server = {
            baseDir: './build',
            routes: {
              [`/${basePath}`]: './build'
            }
          };
          config.startPath = `/${basePath}/`;
        } else {
          // Normal serving
          config.server = './build';
        }

        devServer.init(config);
      }
    }
  });
}

// Export the Metalsmith instance for use in other files
export default metalsmith;
