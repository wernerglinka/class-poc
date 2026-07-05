/**
 * @fileoverview Unit tests for the component installer's pure logic: the
 * not-installed catalog diff and the dependency-closure resolution (ordering,
 * skipping installed components, and rejecting unknown names).
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { availableNotInstalled, resolveClosure } from '../scripts/install-components.mjs';

const catalog = {
  sections: [
    { name: 'banner', type: 'section', requires: ['ctas', 'text', 'commons'] },
    { name: 'hero', type: 'section', requires: ['text', 'commons'] }
  ],
  partials: [
    { name: 'ctas', type: 'partial', requires: ['button', 'text-link'] },
    { name: 'text', type: 'partial', requires: [] },
    { name: 'button', type: 'partial', requires: [] },
    { name: 'text-link', type: 'partial', requires: [] },
    { name: 'commons', type: 'section', requires: [] }
  ]
};
const byName = new Map([...catalog.sections, ...catalog.partials].map((entry) => [entry.name, entry]));

describe('install-components pure logic', () => {
  describe('availableNotInstalled', () => {
    it('lists catalog entries that are not installed, sections first', () => {
      const installed = new Set(['text', 'commons']);
      const names = availableNotInstalled(catalog, installed).map((entry) => entry.name);
      assert.deepEqual(names, ['banner', 'hero', 'ctas', 'button', 'text-link']);
    });

    it('returns nothing when everything is installed', () => {
      const installed = new Set(['banner', 'hero', 'ctas', 'text', 'button', 'text-link', 'commons']);
      assert.deepEqual(availableNotInstalled(catalog, installed), []);
    });
  });

  describe('resolveClosure', () => {
    it('orders dependencies before dependents and skips installed', () => {
      const installed = new Set(['text', 'commons']);
      const order = resolveClosure(['banner'], byName, installed).map((entry) => entry.name);
      assert.deepEqual(order, ['button', 'text-link', 'ctas', 'banner']);
    });

    it('does not duplicate a dependency shared by two selections', () => {
      const order = resolveClosure(['banner', 'hero'], byName, new Set()).map((entry) => entry.name);
      assert.equal(order.filter((name) => name === 'text').length, 1);
      assert.equal(order.filter((name) => name === 'commons').length, 1);
      assert.ok(order.indexOf('text') < order.indexOf('hero'));
    });

    it('throws on a name absent from the catalog', () => {
      assert.throws(() => resolveClosure(['nope'], byName, new Set()), /not in the canonical catalog/);
    });
  });
});
