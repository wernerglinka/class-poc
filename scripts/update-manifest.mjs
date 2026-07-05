/* eslint-disable no-console */

/**
 * Manifest reconciliation helper.
 *
 * Keeps a component's manifest `fields` in step with its example object after a
 * developer changes the component's data contract. It diffs the example (`.yml`)
 * against the manifest `fields`: for each field in the example that the manifest
 * does not declare, it asks the developer to pick a field type and adds it; for
 * each field the manifest declares that the example no longer has, it asks and
 * deletes if confirmed. Nothing is inferred and nothing is changed without a
 * prompt. Fields present in both are left untouched, which preserves existing
 * widget choices and `$use`/`$extends` composition.
 *
 * Usage:
 *   node scripts/update-manifest.mjs <component-name>
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');

/**
 * Envelope keys provided by the shared container (`$extends: ["commons"]`), not
 * declared as the component's own fields. Excluded from the diff.
 * @type {string[]}
 */
export const ENVELOPE_KEYS = [
  'sectionType',
  'containerTag',
  'classes',
  'id',
  'isDisabled',
  'isAnimated',
  'containerFields'
];

/**
 * The selectable field types and how each builds a manifest `fields` entry.
 * `$use` is handled separately because it needs a partial name.
 * @type {Array<{key: string, label: string, build: (fieldName: string) => object}>}
 */
export const FIELD_TYPES = [
  {
    key: 'text',
    label: 'text (single line)',
    build: (name) => ({ widget: 'text', label: titleCase(name), default: '' })
  },
  {
    key: 'textarea',
    label: 'textarea (multi line)',
    build: (name) => ({ widget: 'textarea', label: titleCase(name), default: '' })
  },
  {
    key: 'markdown',
    label: 'markdown',
    build: (name) => ({ widget: 'markdown', label: titleCase(name), default: '' })
  },
  {
    key: 'checkbox',
    label: 'checkbox (boolean)',
    build: (name) => ({ widget: 'checkbox', label: titleCase(name), default: false })
  },
  { key: 'number', label: 'number', build: (name) => ({ widget: 'number', label: titleCase(name), default: 0 }) },
  {
    key: 'select',
    label: 'select (single choice)',
    build: (name) => ({ widget: 'select', label: titleCase(name), enum: [], default: '' })
  },
  {
    key: 'multiselect',
    label: 'multiselect',
    build: (name) => ({ widget: 'multiselect', label: titleCase(name), enum: [], default: [] })
  },
  {
    key: 'array',
    label: 'array (repeatable)',
    build: (name) => ({ widget: 'array', label: titleCase(name), default: [] })
  },
  { key: 'image', label: 'image', build: (name) => ({ widget: 'image', label: titleCase(name), default: '' }) }
];

/**
 * Turn a field name into a readable label (camelCase to words, capitalized).
 * @param {string} name - Field name
 * @returns {string} Human label
 */
export const titleCase = (name) => {
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * The component's own field keys declared in a manifest `fields` block,
 * excluding the `$extends` mechanic.
 * @param {object} fields - Manifest fields block
 * @returns {string[]} Declared field names
 */
export const manifestFieldNames = (fields) => Object.keys(fields || {}).filter((key) => key !== '$extends');

/**
 * The example object's content keys, excluding the shared envelope keys.
 * @param {object} example - Parsed example object
 * @param {string[]} [excludeKeys] - Keys to treat as envelope
 * @returns {string[]} Content field names
 */
export const contentKeys = (example, excludeKeys = ENVELOPE_KEYS) =>
  Object.keys(example || {}).filter((key) => !excludeKeys.includes(key));

/**
 * Diff example content keys against declared manifest field names.
 * @param {string[]} exampleKeys - Content keys from the example
 * @param {string[]} fieldKeys - Declared manifest field names
 * @returns {{added: string[], removed: string[]}} Fields to add and to remove
 */
export const diffFields = (exampleKeys, fieldKeys) => {
  const fieldSet = new Set(fieldKeys);
  const exampleSet = new Set(exampleKeys);
  return {
    added: exampleKeys.filter((key) => !fieldSet.has(key)),
    removed: fieldKeys.filter((key) => !exampleSet.has(key))
  };
};

/**
 * Build the updated `fields` block: existing minus removed, plus new entries,
 * with `$extends` preserved at the end.
 * @param {object} fields - Current manifest fields block
 * @param {string[]} removed - Field names to drop
 * @param {object} added - Map of new field name to its entry
 * @returns {object} New fields block
 */
export const applyFieldChanges = (fields, removed, added) => {
  const removedSet = new Set(removed);
  const next = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (key === '$extends' || removedSet.has(key)) {
      return;
    }
    next[key] = value;
  });
  Object.entries(added).forEach(([key, value]) => {
    next[key] = value;
  });
  if (fields?.$extends) {
    next.$extends = fields.$extends;
  }
  return next;
};

/**
 * Locate a component directory by name under sections then partials.
 * @param {string} root - Project root
 * @param {object} config - Project config
 * @param {string} name - Component name
 * @returns {Promise<string>} Absolute component directory
 */
const findComponentDirectory = async (root, config, name) => {
  const candidates = [
    path.join(root, config.componentsBasePath, config.sectionsDir, name),
    path.join(root, config.componentsBasePath, config.partialsDir, name)
  ];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Component "${name}" not found under sections or partials`);
};

/**
 * Read and parse the component's example object from its `.yml` file. The file
 * holds a YAML array with a single section object.
 * @param {string} componentDirectory - Component directory
 * @param {string} name - Component name
 * @returns {Promise<object>} The example object
 */
const readExample = async (componentDirectory, name) => {
  const raw = await fs.readFile(path.join(componentDirectory, `${name}.yml`), 'utf8');
  const parsed = yaml.load(raw);
  const example = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!example || typeof example !== 'object') {
    throw new Error(`Could not read an example object from ${name}.yml`);
  }
  return example;
};

/**
 * Prompt the developer to pick a field type for a new field, returning the
 * built manifest entry.
 * @param {readline.Interface} rl - Readline interface
 * @param {string} fieldName - The new field's name
 * @returns {Promise<object>} The chosen field entry
 */
const promptFieldType = async (rl, fieldName) => {
  console.log(`\nNew field "${fieldName}". Choose a field type:`);
  FIELD_TYPES.forEach((type, index) => {
    console.log(`  ${index + 1}. ${type.label}`);
  });
  console.log(`  ${FIELD_TYPES.length + 1}. $use a partial`);
  const answer = (await rl.question('  Type number: ')).trim();
  const choice = Number(answer);
  if (choice === FIELD_TYPES.length + 1) {
    const partial = (await rl.question('  Partial name to $use: ')).trim();
    return { $use: partial };
  }
  const type = FIELD_TYPES[choice - 1];
  if (!type) {
    console.log('  Unrecognized choice; defaulting to text.');
    return { widget: 'text', label: titleCase(fieldName), default: '' };
  }
  return type.build(fieldName);
};

/**
 * Entry point. Reconcile one component's manifest fields with its example.
 * @returns {Promise<void>} Resolves when done
 */
const main = async () => {
  const name = process.argv[2];
  if (!name) {
    throw new Error('Usage: node scripts/update-manifest.mjs <component-name>');
  }
  const config = JSON.parse(await fs.readFile(path.join(projectRoot, 'nunjucks-components.config.json'), 'utf8'));
  const componentDirectory = await findComponentDirectory(projectRoot, config, name);
  const manifestPath = path.join(componentDirectory, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const fields = manifest.fields || {};

  const example = await readExample(componentDirectory, name);
  const { added, removed } = diffFields(contentKeys(example), manifestFieldNames(fields));

  if (!added.length && !removed.length) {
    console.log(`${name}: manifest fields already match the example. Nothing to do.`);
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const newEntries = {};
  const confirmedRemovals = [];
  try {
    for (const fieldName of added) {
      newEntries[fieldName] = await promptFieldType(rl, fieldName);
    }
    for (const fieldName of removed) {
      const answer = (
        await rl.question(`\nField "${fieldName}" is gone from the example. Delete it from the manifest? [y/N]: `)
      )
        .trim()
        .toLowerCase();
      if (answer.startsWith('y')) {
        confirmedRemovals.push(fieldName);
      }
    }
  } finally {
    rl.close();
  }

  manifest.fields = applyFieldChanges(fields, confirmedRemovals, newEntries);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const addedList = Object.keys(newEntries);
  console.log(
    `\nUpdated ${name}/manifest.json` +
      `${addedList.length ? `\n  added: ${addedList.join(', ')}` : ''}` +
      `${confirmedRemovals.length ? `\n  removed: ${confirmedRemovals.join(', ')}` : ''}`
  );
};

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\nManifest update failed: ${error.message}`);
    process.exit(1);
  });
}
