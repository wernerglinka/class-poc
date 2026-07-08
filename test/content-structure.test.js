/**
 * @fileoverview Content Structure Validation Tests
 *
 * This test suite validates the structure and integrity of content files in the
 * structured content system. Unlike traditional Markdown-based static sites,
 * this starter uses frontmatter to define page structure and component composition.
 *
 * The structured content approach enables:
 * - Component-based page composition through frontmatter sections
 * - Consistent data structures across all content types
 * - Validation of content against expected schemas
 * - SEO and navigation metadata standardization
 * - Blog post structure and metadata validation
 *
 * Test Coverage:
 * - Global data file validation (JSON structure and required fields)
 * - Page frontmatter structure and completeness
 * - Sections-based page validation and component references
 * - Blog post metadata and structure validation
 * - SEO and navigation metadata consistency
 *
 * @author Werner Glinka <werner@glinka.co>
 * @since 1.0.0
 */

import { strict as assert } from 'node:assert';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

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
 * Content Structure Test Suite
 *
 * Validates the structured content approach where pages are defined through
 * frontmatter rather than Markdown body content. This system allows for
 * component-based page composition and consistent data structures.
 *
 * The tests ensure that:
 * - Global data files provide essential site configuration
 * - All pages have proper frontmatter structure
 * - Section-based pages reference existing components
 * - Blog posts follow consistent metadata patterns
 * - SEO and navigation data is properly structured
 */
describe('Content Structure', () => {
  /**
   * Source directory path containing all content files
   * @type {string}
   */
  const srcDir = join(projectRoot, 'src');

  /**
   * Recursively get all markdown files from a directory
   *
   * This utility function traverses a directory tree to find all .md files,
   * including those in subdirectories (like blog posts). It's essential for
   * validating content structure across the entire site.
   *
   * @param {string} dir - The directory to scan for markdown files
   * @returns {string[]} Array of full paths to all markdown files found
   *
   * @example
   * const allMarkdown = getMarkdownFiles('/path/to/src');
   * // Returns: ['/path/to/src/index.md', '/path/to/src/blog/post1.md', ...]
   */
  function getMarkdownFiles(dir) {
    const files = [];
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getMarkdownFiles(fullPath));
      } else if (extname(item) === '.md') {
        files.push(fullPath);
      }
    }
    return files;
  }

  /**
   * Global Data Files Test Suite
   *
   * Tests the validity and structure of global data files that provide
   * site-wide configuration and metadata. These JSON files are crucial
   * for the structured content system as they define site identity,
   * navigation, and other global settings.
   */
  describe('Global Data Files', () => {
    /**
     * Data directory path containing global JSON files
     * @type {string}
     */
    const dataDir = join(projectRoot, 'lib/data');

    /**
     * Test global data file JSON validity
     *
     * Functional Purpose:
     * - Validates that all global data files contain well-formed JSON
     * - Ensures data files can be parsed without errors
     * - Tests the accessibility and readability of data files
     *
     * What it tests:
     * - JSON file discovery in the data directory
     * - File reading and parsing capabilities
     * - JSON syntax validation
     * - Data structure integrity
     * - Error handling for malformed JSON
     *
     * These files are loaded into Metalsmith metadata and must be valid
     * for the build process to succeed and for templates to access data.
     */
    it('should have valid JSON in all data files', () => {
      const dataFiles = readdirSync(dataDir).filter((file) => file.endsWith('.json'));
      assert.ok(dataFiles.length > 0, 'Should have at least one data file');

      for (const file of dataFiles) {
        const filePath = join(dataDir, file);

        try {
          const content = readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          assert.ok(data, `Data file ${file} should contain valid JSON`);
        } catch (error) {
          assert.fail(`Invalid JSON in ${file}: ${error.message}`);
        }
      }
    });

    /**
     * Test site.json essential fields
     *
     * Functional Purpose:
     * - Validates that the main site configuration file has required fields
     * - Ensures essential site metadata is available for templates and SEO
     * - Tests the structure of the most critical data file
     *
     * What it tests:
     * - Site.json file existence and parsability
     * - Required field presence (title, url, description)
     * - Field type validation (strings)
     * - Data completeness for site functionality
     *
     * The site.json file is used throughout templates for meta tags,
     * social sharing, and site identity, making these fields essential.
     */
    it('should have required site.json with essential fields', () => {
      const siteDataPath = join(dataDir, 'site.json');
      const content = readFileSync(siteDataPath, 'utf8');
      const siteData = JSON.parse(content);

      assert.ok(siteData.title, 'site.json should have title');
      assert.ok(siteData.url, 'site.json should have url');
      assert.ok(siteData.description, 'site.json should have description');
    });
  });

  /**
   * Page Structure Test Suite
   *
   * Tests the fundamental structure of all pages in the structured content system.
   * This validates that pages follow the expected frontmatter patterns and
   * have the necessary metadata for the build process.
   */
  describe('Page Structure', () => {
    /**
     * All markdown files in the source directory
     * @type {string[]}
     */
    const markdownFiles = getMarkdownFiles(srcDir);

    /**
     * Test frontmatter validity across all pages
     *
     * Functional Purpose:
     * - Validates that all markdown files have parseable frontmatter
     * - Ensures the gray-matter parser can process all content files
     * - Tests the basic structure of page metadata
     *
     * What it tests:
     * - Markdown file discovery and access
     * - Frontmatter parsing with gray-matter
     * - YAML syntax validation in frontmatter
     * - Data object structure verification
     * - Error handling for malformed frontmatter
     *
     * This is foundational since the entire structured content system
     * depends on frontmatter data being accessible and well-formed.
     */
    it('should have valid frontmatter in all markdown files', () => {
      assert.ok(markdownFiles.length > 0, 'Should have at least one markdown file');

      for (const filePath of markdownFiles) {
        try {
          const content = readFileSync(filePath, 'utf8');
          const parsed = matter(content);

          assert.ok(parsed.data, `${filePath} should have frontmatter`);
          assert.ok(typeof parsed.data === 'object', `${filePath} frontmatter should be an object`);
        } catch (error) {
          assert.fail(`Invalid frontmatter in ${filePath}: ${error.message}`);
        }
      }
    });

    it('should have layout specified in all pages', () => {
      for (const filePath of markdownFiles) {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        assert.ok(data.layout, `${filePath} should specify a layout`);
        assert.ok(typeof data.layout === 'string', `${filePath} layout should be a string`);
      }
    });
  });

  describe('Sections-based Pages', () => {
    it('should have valid sections structure in section-based pages', () => {
      const sectionsFiles = getMarkdownFiles(srcDir).filter((filePath) => {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        return data.sections && Array.isArray(data.sections);
      });

      assert.ok(sectionsFiles.length > 0, 'Should have at least one sections-based page');

      for (const filePath of sectionsFiles) {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        assert.ok(Array.isArray(data.sections), `${filePath} sections should be an array`);

        // Validate each section
        for (let i = 0; i < data.sections.length; i++) {
          const section = data.sections[i];
          assert.ok(section.sectionType, `Section ${i} in ${filePath} should have sectionType`);
          assert.ok(typeof section.sectionType === 'string', `Section ${i} sectionType should be a string`);
        }
      }
    });

    it('should reference existing section components', () => {
      const sectionsDir = join(projectRoot, 'lib/layouts/components/sections');
      const availableSections = readdirSync(sectionsDir).filter((item) => {
        const itemPath = join(sectionsDir, item);
        return statSync(itemPath).isDirectory();
      });

      const sectionsFiles = getMarkdownFiles(srcDir).filter((filePath) => {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        return data.sections && Array.isArray(data.sections);
      });

      for (const filePath of sectionsFiles) {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        for (const section of data.sections) {
          if (section.sectionType) {
            assert.ok(
              availableSections.includes(section.sectionType),
              `Section type '${section.sectionType}' in ${filePath} should exist in components/sections`
            );
          }
        }
      }
    });
  });

  describe('Blog Posts', () => {
    const blogDir = join(srcDir, 'blog');

    it('should have valid blog post structure', () => {
      // statSync throws on a missing path, so check existence first;
      // this project has no blog, making this test a deliberate no-op.
      if (!existsSync(blogDir) || !statSync(blogDir).isDirectory()) {
        return; // Skip if no blog directory
      }

      const blogPosts = getMarkdownFiles(blogDir);
      assert.ok(blogPosts.length > 0, 'Should have at least one blog post');

      for (const postPath of blogPosts) {
        const content = readFileSync(postPath, 'utf8');
        const { data } = matter(content);

        // Blog posts should have card metadata
        assert.ok(data.card, `${postPath} should have card metadata`);
        assert.ok(data.card.title, `${postPath} should have card.title`);
        assert.ok(data.card.date, `${postPath} should have card.date`);

        // Validate date format
        const date = new Date(data.card.date);
        assert.ok(!Number.isNaN(date.getTime()), `${postPath} card.date should be a valid date`);
      }
    });
  });

  describe('SEO and Navigation', () => {
    it('should have SEO metadata in pages', () => {
      const mainPages = getMarkdownFiles(srcDir).filter(
        (filePath) => !filePath.includes('/blog/') // Exclude blog posts
      );

      for (const filePath of mainPages) {
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        if (data.seo) {
          assert.ok(data.seo.title, `${filePath} SEO should have title`);
          assert.ok(data.seo.description, `${filePath} SEO should have description`);
        }
      }
    });

    it('should have navigation metadata in main pages', () => {
      const content = readFileSync(join(srcDir, 'index.md'), 'utf8');
      const { data } = matter(content);

      if (data.navigation) {
        assert.ok(data.navigation.navLabel, 'Navigation should have navLabel');
        assert.ok(typeof data.navigation.navIndex === 'number', 'Navigation should have numeric navIndex');
      }
    });
  });
});
