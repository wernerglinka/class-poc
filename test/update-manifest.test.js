/**
 * @fileoverview Unit tests for the manifest reconciliation helper's pure logic.
 * Covers the field diff, the envelope/`$extends` exclusions, the field-change
 * application (preserving `$extends`), and the field-type entry builders.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  applyFieldChanges,
  contentKeys,
  diffFields,
  ENVELOPE_KEYS,
  FIELD_TYPES,
  manifestFieldNames,
  titleCase
} from '../scripts/update-manifest.mjs';

describe('update-manifest pure logic', () => {
  describe('contentKeys', () => {
    it('drops the shared envelope keys and keeps content fields', () => {
      const example = {
        sectionType: 'banner',
        containerTag: 'aside',
        containerFields: {},
        isReverse: false,
        text: {},
        ctas: []
      };
      assert.deepEqual(contentKeys(example), ['isReverse', 'text', 'ctas']);
    });

    it('treats every envelope key as excluded', () => {
      const example = Object.fromEntries(ENVELOPE_KEYS.map((key) => [key, true]));
      assert.deepEqual(contentKeys(example), []);
    });
  });

  describe('manifestFieldNames', () => {
    it('lists declared fields and ignores $extends', () => {
      const fields = { isReverse: {}, text: { $use: 'text' }, $extends: ['commons'] };
      assert.deepEqual(manifestFieldNames(fields), ['isReverse', 'text']);
    });

    it('handles a missing fields block', () => {
      assert.deepEqual(manifestFieldNames(undefined), []);
    });
  });

  describe('diffFields', () => {
    it('reports added and removed against the manifest', () => {
      const result = diffFields(['text', 'image', 'mediaType'], ['text', 'image', 'ctas']);
      assert.deepEqual(result.added, ['mediaType']);
      assert.deepEqual(result.removed, ['ctas']);
    });

    it('is empty when example and manifest agree', () => {
      const result = diffFields(['text', 'ctas'], ['ctas', 'text']);
      assert.deepEqual(result.added, []);
      assert.deepEqual(result.removed, []);
    });
  });

  describe('applyFieldChanges', () => {
    it('removes, adds, and keeps $extends at the end', () => {
      const fields = { isReverse: { widget: 'checkbox' }, ctas: { $use: 'ctas' }, $extends: ['commons'] };
      const next = applyFieldChanges(fields, ['ctas'], { mediaType: { widget: 'select', enum: [], default: '' } });
      assert.deepEqual(Object.keys(next), ['isReverse', 'mediaType', '$extends']);
      assert.deepEqual(next.$extends, ['commons']);
      assert.equal(next.ctas, undefined);
    });

    it('preserves untouched fields verbatim', () => {
      const text = { $use: 'text' };
      const fields = { text };
      const next = applyFieldChanges(fields, [], {});
      assert.equal(next.text, text);
    });
  });

  describe('titleCase', () => {
    it('splits camelCase and capitalizes', () => {
      assert.equal(titleCase('mediaType'), 'Media Type');
      assert.equal(titleCase('isReverse'), 'Is Reverse');
    });
  });

  describe('FIELD_TYPES builders', () => {
    it('checkbox defaults to false', () => {
      const checkbox = FIELD_TYPES.find((type) => type.key === 'checkbox');
      assert.deepEqual(checkbox.build('isReverse'), { widget: 'checkbox', label: 'Is Reverse', default: false });
    });

    it('select carries an empty enum', () => {
      const select = FIELD_TYPES.find((type) => type.key === 'select');
      const entry = select.build('mediaType');
      assert.equal(entry.widget, 'select');
      assert.deepEqual(entry.enum, []);
    });
  });
});
