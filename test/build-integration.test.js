/**
 * @fileoverview Build Integration Tests
 *
 * This test suite validates the core Metalsmith build process for the structured content starter.
 * It ensures that all plugins work together correctly and that the build outputs are generated
 * as expected. These tests use real Metalsmith instances to validate the actual build pipeline.
 *
 * The tests cover:
 * - Basic build completion without errors
 * - HTML file generation from markdown sources
 * - Collections and pagination functionality
 * - Permalink generation for clean URLs
 * - Static asset handling
 * - Content structure preservation through the build process
 *
 * @author Werner Glinka <werner@glinka.co>
 * @since 1.0.0
 */

import { strict as assert } from 'node:assert';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import collections from '@metalsmith/collections';
import drafts from '@metalsmith/drafts';
import permalinks from '@metalsmith/permalinks';
import Metalsmith from 'metalsmith';

/**
 * Current directory path for test file location
 * @type {string}
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Project root directory path
 * @type {string}
 */
const projectRoot = join(__dirname, '..');

/**
 * Build Integration Test Suite
 *
 * Tests the complete Metalsmith build pipeline to ensure all components work together.
 * These integration tests validate that the structured content approach functions correctly
 * from source markdown files through to final HTML output.
 */
describe('Build Integration', () => {
  /**
   * Test build directory path - isolated from main build
   * @type {string}
   */
  const testBuildDir = join(projectRoot, 'test-build');

  /**
   * Setup: Clean test build directory before each test
   * This ensures each test starts with a clean slate and prevents conflicts
   */
  beforeEach(() => {
    if (existsSync(testBuildDir)) {
      rmSync(testBuildDir, { recursive: true, force: true });
    }
  });

  /**
   * Teardown: Clean test build directory after each test
   * This prevents test artifacts from accumulating
   */
  afterEach(() => {
    if (existsSync(testBuildDir)) {
      rmSync(testBuildDir, { recursive: true, force: true });
    }
  });

  /**
   * Basic Build Process Test Suite
   *
   * Tests the fundamental Metalsmith build functionality to ensure the core
   * pipeline works correctly with minimal plugin configuration.
   */
  describe('Basic Build Process', () => {
    /**
     * Test basic build completion
     *
     * Functional Purpose:
     * - Validates that a minimal Metalsmith build completes without throwing errors
     * - Ensures the source files can be processed through drafts and permalinks plugins
     * - Verifies the build pipeline is correctly configured
     *
     * What it tests:
     * - Metalsmith instance creation and configuration
     * - Source file reading from ./src directory
     * - Drafts plugin functionality (includes draft posts in test mode)
     * - Permalinks plugin for clean URL generation
     * - Build process completion without exceptions
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should complete a basic build without errors', (_t, done) => {
      const metalsmith = Metalsmith(projectRoot)
        .clean(false) // Don't clean to avoid conflicts with main build
        .source('./src')
        .destination(testBuildDir)
        .use(drafts(false)) // Include drafts in test
        .use(
          permalinks({
            match: '**/*.md'
          })
        );

      metalsmith.build((err) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);
        done();
      });
    });

    /**
     * Test HTML file generation from markdown sources
     *
     * Functional Purpose:
     * - Validates that markdown files are correctly converted to HTML
     * - Ensures permalink structure creates proper directory structure
     * - Verifies both main pages and blog posts are generated correctly
     *
     * What it tests:
     * - Markdown to HTML conversion process
     * - File system output structure (index.html files in directories)
     * - Blog post URL structure generation
     * - File existence after build completion
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should generate HTML files from markdown sources', (_t, done) => {
      const metalsmith = Metalsmith(projectRoot)
        .clean(false)
        .source('./src')
        .destination(testBuildDir)
        .use(drafts(false))
        .use(
          permalinks({
            match: '**/*.md'
          })
        );

      metalsmith.build((err) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

        // Check that index.html was created
        const indexPath = join(testBuildDir, 'index.html');
        assert.ok(existsSync(indexPath), 'index.html should be generated');

        // Check that blog posts were created
        const blogPostPath = join(testBuildDir, 'blog/getting-started-with-structured-content/index.html');
        assert.ok(existsSync(blogPostPath), 'Blog post HTML should be generated');

        done();
      });
    });
  });

  /**
   * Collections and Pagination Test Suite
   *
   * Tests the blog collection functionality and metadata generation for the
   * structured content system. Validates that blog posts are properly organized
   * and accessible through the collections plugin.
   */
  describe('Collections and Pagination', () => {
    /**
     * Test blog collection creation
     *
     * Functional Purpose:
     * - Validates that blog posts are correctly grouped into collections
     * - Ensures collection metadata is available for template rendering
     * - Tests that blog posts are sorted properly by date
     *
     * What it tests:
     * - Collections plugin configuration and execution
     * - Blog post pattern matching (blog/*.md)
     * - Metadata structure and accessibility
     * - Collection array generation and population
     * - Post sorting by card.date field
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should create blog collections correctly', (_t, done) => {
      const metalsmith = Metalsmith(projectRoot)
        .clean(false)
        .source('./src')
        .destination(testBuildDir)
        .use(drafts(false))
        .use(
          collections({
            blog: {
              pattern: 'blog/*.md',
              sort: 'card.date:asc'
            }
          })
        );

      metalsmith.build((err) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

        const metadata = metalsmith.metadata();
        assert.ok(metadata.collections, 'Collections should be created');
        assert.ok(metadata.collections.blog, 'Blog collection should exist');
        assert.ok(Array.isArray(metadata.collections.blog), 'Blog collection should be an array');
        assert.ok(metadata.collections.blog.length > 0, 'Blog collection should have posts');

        done();
      });
    });
  });

  /**
   * Permalinks Test Suite
   *
   * Tests the permalink generation functionality to ensure clean URLs are created
   * correctly. This is crucial for SEO and user experience in the structured content system.
   */
  describe('Permalinks', () => {
    /**
     * Test clean URL generation
     *
     * Functional Purpose:
     * - Validates that markdown files are converted to clean directory-based URLs
     * - Ensures proper file structure for web server compatibility
     * - Tests that all main pages receive proper permalink treatment
     *
     * What it tests:
     * - Permalinks plugin configuration and execution
     * - Directory structure creation (page-name/index.html)
     * - Root level page handling (index.html)
     * - Blog and about page URL generation
     * - File system output validation
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should generate clean URLs', (_t, done) => {
      const metalsmith = Metalsmith(projectRoot)
        .clean(false)
        .source('./src')
        .destination(testBuildDir)
        .use(drafts(false))
        .use(
          permalinks({
            match: '**/*.md'
          })
        );

      metalsmith.build((err) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

        // Check that clean URLs are generated (directories with index.html)
        assert.ok(existsSync(join(testBuildDir, 'index.html')), 'Root index.html should exist');
        assert.ok(existsSync(join(testBuildDir, 'about/index.html')), 'About page should have clean URL');
        assert.ok(existsSync(join(testBuildDir, 'blog/index.html')), 'Blog index should have clean URL');

        done();
      });
    });
  });

  /**
   * Asset Handling Test Suite
   *
   * Tests the static asset copying functionality to ensure all project assets
   * (images, CSS, JavaScript) are properly copied to the build directory.
   */
  describe('Asset Handling', () => {
    /**
     * Test static asset copying
     *
     * Functional Purpose:
     * - Validates that static assets are copied from lib/assets to build/assets
     * - Ensures the asset directory structure is preserved
     * - Tests that essential files like global CSS and images are available
     *
     * What it tests:
     * - Assets plugin configuration and execution
     * - Source to destination directory mapping
     * - File copying process completion
     * - Directory structure preservation
     * - Specific file existence validation
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should copy static assets', (_t, done) => {
      // Metalsmith 2.7's native .statik() copies directories under the source
      // tree verbatim. src/assets/ holds images and icons; main.css lives in
      // lib/assets/ and is processed by the bundler, so it is not a static copy.
      const metalsmith = Metalsmith(projectRoot)
        .clean(false)
        .source('./src')
        .destination(testBuildDir)
        .statik(['assets'])
        .use(drafts(false));

      metalsmith.build((err) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

        // Check that the static asset directories were copied verbatim
        assert.ok(existsSync(join(testBuildDir, 'assets')), 'Assets directory should be created');
        assert.ok(existsSync(join(testBuildDir, 'assets/images')), 'Images directory should be copied');
        assert.ok(existsSync(join(testBuildDir, 'assets/icons')), 'Icons directory should be copied');

        done();
      });
    });
  });

  /**
   * Content Structure Test Suite
   *
   * Tests the preservation of structured content data through the build process.
   * This is critical for the component-based approach where frontmatter defines
   * page structure and sections.
   */
  describe('Content Structure', () => {
    /**
     * Test frontmatter data preservation
     *
     * Functional Purpose:
     * - Validates that structured content data survives the build process
     * - Ensures sections arrays and metadata are accessible to templates
     * - Tests the core principle of the structured content approach
     *
     * What it tests:
     * - Frontmatter parsing and retention
     * - Sections array structure preservation
     * - Metadata accessibility in processed files
     * - File object structure integrity
     * - Data availability for template rendering
     *
     * @param {Function} done - Mocha callback for async test completion
     */
    it('should preserve frontmatter data in built files', (_t, done) => {
      const metalsmith = Metalsmith(projectRoot)
        .clean(false)
        .source('./src')
        .destination(testBuildDir)
        .use(drafts(false))
        .use(
          permalinks({
            match: '**/*.md'
          })
        );

      metalsmith.build((err, files) => {
        assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

        // Check that files have frontmatter data
        const indexFile = files['index.html'];
        assert.ok(indexFile, 'Index file should exist in files object');
        assert.ok(indexFile.sections, 'Index file should have sections data');
        assert.ok(Array.isArray(indexFile.sections), 'Sections should be an array');
        assert.ok(indexFile.sections.length > 0, 'Should have at least one section');

        done();
      });
    });
  });
});
