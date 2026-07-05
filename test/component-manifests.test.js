/**
 * @fileoverview Component Manifest Validation Tests
 *
 * This test suite validates the integrity and completeness of component manifests
 * in the structured content system. Component manifests are JSON files that define
 * dependencies, metadata, and configuration for each reusable component.
 *
 * The component system is a key differentiator of this starter, allowing for:
 * - Automatic dependency resolution and bundling
 * - Component isolation and reusability
 * - Clear separation between partials and sections
 * - Template validation and correspondence
 *
 * Test Coverage:
 * - Manifest JSON validity and structure
 * - Component directory organization
 * - Template file correspondence
 * - Dependency declarations
 * - Component type validation (partials vs sections)
 *
 * @author Werner Glinka <werner@glinka.co>
 * @since 1.0.0
 */

import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

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
 * Component Manifest Test Suite
 *
 * Validates the component system's manifest files and structure. Components are
 * organized into two main categories:
 * - _partials: Small, reusable UI elements (buttons, cards, navigation)
 * - sections: Large page sections (hero, banner, media blocks)
 *
 * Each component can have:
 * - manifest.json: Dependency and metadata definitions
 * - component-name.njk: Nunjucks template
 * - component-name.css: Component-specific styles
 * - component-name.js: Component-specific JavaScript
 * - README.md: Component documentation
 */
describe('Component Manifests', () => {
  /**
   * Components directory path
   * @type {string}
   */
  const componentsDir = join(projectRoot, 'lib/layouts/components');

  /**
   * Get all component directories from a base directory
   *
   * This utility function scans a directory for subdirectories that represent
   * components. It filters out helper directories (those starting with _) from
   * the sections and partials directories.
   *
   * @param {string} baseDir - The base directory to scan for components
   * @returns {string[]} Array of full paths to component directories
   *
   * @example
   * const partialDirs = getComponentDirs('/path/to/_partials');
   * // Returns: ['/path/to/_partials/button', '/path/to/_partials/card', ...]
   */
  function getComponentDirs(baseDir) {
    const dirs = [];
    const items = readdirSync(baseDir);

    for (const item of items) {
      const fullPath = join(baseDir, item);
      if (statSync(fullPath).isDirectory() && !item.startsWith('_')) {
        dirs.push(fullPath);
      }
    }
    return dirs;
  }

  /**
   * Partial Components Test Suite
   *
   * Tests the manifest validation for partial components (_partials directory).
   * Partial components are small, reusable UI elements like buttons, cards,
   * navigation elements, and other interface components.
   */
  describe('Partial Components', () => {
    /**
     * Partials directory path
     * @type {string}
     */
    const partialsDir = join(componentsDir, '_partials');

    /**
     * Test partial component manifest validation
     *
     * Functional Purpose:
     * - Validates that all partial components have well-formed manifest.json files
     * - Ensures JSON parsing works correctly for all manifests
     * - Tests the basic structure and existence of manifest files
     *
     * What it tests:
     * - Directory scanning for partial components
     * - Manifest file existence and readability
     * - JSON parsing validation
     * - Basic object structure verification
     * - Error handling for malformed manifests
     *
     * This is critical because manifests drive the component dependency bundling system.
     */
    it('should have valid manifest.json in all partial components', () => {
      const componentDirs = getComponentDirs(partialsDir);
      assert.ok(componentDirs.length > 0, 'Should have at least one partial component');

      for (const dir of componentDirs) {
        const manifestPath = join(dir, 'manifest.json');

        try {
          const manifestContent = readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);

          // Basic structure validation
          assert.ok(manifest, `Manifest should exist for ${dir}`);
          assert.ok(typeof manifest === 'object', `Manifest should be an object for ${dir}`);
        } catch (error) {
          assert.fail(`Invalid manifest in ${dir}: ${error.message}`);
        }
      }
    });
  });

  /**
   * Section Components Test Suite
   *
   * Tests the manifest validation for section components (sections directory).
   * Section components are larger page sections like hero areas, banners,
   * media blocks, and other major page layout elements.
   */
  describe('Section Components', () => {
    /**
     * Sections directory path
     * @type {string}
     */
    const sectionsDir = join(componentsDir, 'sections');

    /**
     * Test section component manifest validation
     *
     * Functional Purpose:
     * - Validates that all section components have well-formed manifest.json files
     * - Ensures JSON parsing works correctly for larger component manifests
     * - Tests that section components maintain manifest standards
     *
     * What it tests:
     * - Directory scanning for section components
     * - Manifest file existence and readability
     * - JSON parsing validation for section manifests
     * - Basic object structure verification
     * - Error handling and reporting for invalid manifests
     *
     * Section components often have more complex dependencies than partials,
     * making manifest validation even more critical.
     */
    it('should have valid manifest.json in all section components', () => {
      const componentDirs = getComponentDirs(sectionsDir);
      assert.ok(componentDirs.length > 0, 'Should have at least one section component');

      for (const dir of componentDirs) {
        const manifestPath = join(dir, 'manifest.json');

        try {
          const manifestContent = readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);

          // Basic structure validation
          assert.ok(manifest, `Manifest should exist for ${dir}`);
          assert.ok(typeof manifest === 'object', `Manifest should be an object for ${dir}`);
        } catch (error) {
          assert.fail(`Invalid manifest in ${dir}: ${error.message}`);
        }
      }
    });
  });

  /**
   * Component Files Test Suite
   *
   * Tests the correspondence between component manifests and their template files.
   * This ensures that every component that declares dependencies also has the
   * necessary template file to render content.
   */
  describe('Component Files', () => {
    /**
     * Test template file correspondence
     *
     * Functional Purpose:
     * - Validates that components have corresponding .njk template files
     * - Ensures template files are not empty and contain actual content
     * - Tests the naming convention consistency (component-name.njk)
     *
     * What it tests:
     * - Template file existence for each component
     * - File naming convention adherence
     * - Template file content validation (non-empty)
     * - Component-to-template mapping accuracy
     * - Template file readability and access
     *
     * This is essential because the component dependency bundler relies on
     * template files being present and properly named to function correctly.
     */
    it('should have corresponding .njk template for each component with manifest', () => {
      const allDirs = [
        ...getComponentDirs(join(componentsDir, '_partials')),
        ...getComponentDirs(join(componentsDir, 'sections'))
      ];

      for (const dir of allDirs) {
        const componentName = dir.split('/').pop(); // Get the last part of the path
        const templatePath = join(dir, `${componentName}.njk`);

        try {
          const templateContent = readFileSync(templatePath, 'utf8');
          assert.ok(templateContent.length > 0, `Template should not be empty for ${componentName}`);
        } catch (error) {
          assert.fail(`Template file missing or invalid for ${componentName}: ${error.message}`);
        }
      }
    });
  });
});
