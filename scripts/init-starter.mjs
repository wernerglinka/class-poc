/**
 * Initialize the starter's page shell.
 *
 * Run with no arguments for an interactive setup: it walks the optional shell
 * features (theme switcher, language switcher, breadcrumbs) and asks a simple
 * y/n for each, then wires your choices in. The non-interactive subcommands
 * (status / enable / disable) are also available for scripting.
 *
 * Optional shell pieces keep their templates in `lib/layouts/pages/parts/` and
 * styles in `lib/assets/styles/`, but stay inert until wired in. Wiring a feature
 * inserts a few tagged lines after fixed anchors in a layout, `main.css`, and/or
 * `main.js`; each line carries a `feature:<name>` tag so it can be removed again.
 * The registry in `scripts/features.json` describes each feature's edits.
 *
 * Usage:
 *   npm run init                                  # interactive setup
 *   node scripts/init-starter.mjs                 # interactive setup
 *   node scripts/init-starter.mjs status
 *   node scripts/init-starter.mjs enable theme-switcher [more...]
 *   node scripts/init-starter.mjs disable breadcrumbs [more...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

/**
 * Target files a feature edit can address, with the comment style used for anchors
 * and tags in each. Keys match the `file` values in features.json.
 */
const targetFiles = {
  header: { path: 'lib/layouts/pages/parts/header.njk', comment: 'njk' },
  default: { path: 'lib/layouts/pages/default.njk', comment: 'njk' },
  css: { path: 'lib/assets/main.css', comment: 'css' },
  js: { path: 'lib/assets/main.js', comment: 'js' }
};

/**
 * Wrap text in the comment syntax for a file style.
 * @param {string} style - 'njk' | 'css' | 'js'
 * @param {string} text - Inner text
 * @returns {string} Commented text
 */
const wrapComment = (style, text) => {
  if (style === 'njk') {
    return `{# ${text} #}`;
  }
  if (style === 'css') {
    return `/* ${text} */`;
  }
  return `// ${text}`;
};

/**
 * Escape a string for use inside a regular expression.
 * @param {string} value - Raw string
 * @returns {string} Escaped string
 */
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Regex matching a feature tag at a name boundary.
 * @param {string} featureName - Feature key
 * @returns {RegExp} Matching regex
 */
const featureTagRegExp = (featureName) => new RegExp(`feature:${escapeForRegExp(featureName)}(?![\\w-])`);

/**
 * Read a target file by key.
 * @param {string} fileKey - Key in targetFiles
 * @returns {string} File content
 */
const readTarget = (fileKey) => fs.readFileSync(path.join(repoRoot, targetFiles[fileKey].path), 'utf8');

/**
 * Write a target file by key only when content changed.
 * @param {string} fileKey - Key in targetFiles
 * @param {string} before - Original content
 * @param {string} after - New content
 * @returns {boolean} Whether the file was written
 */
const writeTargetIfChanged = (fileKey, before, after) => {
  if (before === after) {
    return false;
  }
  fs.writeFileSync(path.join(repoRoot, targetFiles[fileKey].path), after);
  return true;
};

/**
 * Build the full tagged line for an edit.
 * @param {string} featureName - Feature key
 * @param {object} edit - Edit descriptor { file, anchor, code }
 * @returns {string} Line to insert (without indentation)
 */
const taggedLine = (featureName, edit) =>
  `${edit.code} ${wrapComment(targetFiles[edit.file].comment, `feature:${featureName}`)}`;

/**
 * Insert a line after its anchor, matching the anchor's indentation. No-op when the
 * exact line already exists or the anchor is missing.
 * @param {string} content - File content
 * @param {string} anchorComment - Full anchor comment to find
 * @param {string} line - Line to insert (without indentation)
 * @returns {{content: string, inserted: boolean, missingAnchor: boolean}} Result
 */
const insertAfterAnchor = (content, anchorComment, line) => {
  const lines = content.split('\n');
  if (lines.some((existing) => existing.trim() === line.trim())) {
    return { content, inserted: false, missingAnchor: false };
  }
  const anchorIndex = lines.findIndex((existing) => existing.includes(anchorComment));
  if (anchorIndex === -1) {
    return { content, inserted: false, missingAnchor: true };
  }
  const indentation = lines[anchorIndex].match(/^\s*/)[0];
  const updated = [...lines.slice(0, anchorIndex + 1), `${indentation}${line}`, ...lines.slice(anchorIndex + 1)];
  return { content: updated.join('\n'), inserted: true, missingAnchor: false };
};

/**
 * Remove every line carrying the feature tag.
 * @param {string} content - File content
 * @param {string} featureName - Feature key
 * @returns {{content: string, removed: number}} Result
 */
const removeTaggedLines = (content, featureName) => {
  const tag = featureTagRegExp(featureName);
  const lines = content.split('\n');
  const kept = lines.filter((existing) => !tag.test(existing));
  return { content: kept.join('\n'), removed: lines.length - kept.length };
};

/**
 * Load the feature registry.
 * @returns {Object<string, object>} Registry keyed by feature name
 */
const loadRegistry = () => JSON.parse(fs.readFileSync(path.join(scriptDirectory, 'features.json'), 'utf8'));

/**
 * Whether a feature is currently wired in.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition
 * @returns {boolean} Enabled state
 */
const isEnabled = (featureName, feature) =>
  [...new Set(feature.edits.map((edit) => edit.file))].some((fileKey) =>
    featureTagRegExp(featureName).test(readTarget(fileKey))
  );

/**
 * Enable a feature by inserting each tagged line after its anchor.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition
 * @returns {string[]} Log lines
 */
const enableFeature = (featureName, feature) => {
  const log = [];
  const pending = new Map();
  feature.edits.forEach((edit) => {
    const style = targetFiles[edit.file].comment;
    const current = pending.get(edit.file) ?? readTarget(edit.file);
    const result = insertAfterAnchor(current, wrapComment(style, edit.anchor), taggedLine(featureName, edit));
    if (result.missingAnchor) {
      log.push(`  ! anchor "${edit.anchor}" not found in ${targetFiles[edit.file].path}`);
      return;
    }
    pending.set(edit.file, result.content);
    log.push(
      result.inserted ? `  + ${targetFiles[edit.file].path}` : `  = ${targetFiles[edit.file].path} (already present)`
    );
  });
  pending.forEach((after, fileKey) => {
    writeTargetIfChanged(fileKey, readTarget(fileKey), after);
  });
  return log;
};

/**
 * Disable a feature by removing its tagged lines from every file it touches.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition
 * @returns {string[]} Log lines
 */
const disableFeature = (featureName, feature) => {
  const log = [];
  [...new Set(feature.edits.map((edit) => edit.file))].forEach((fileKey) => {
    const before = readTarget(fileKey);
    const { content, removed } = removeTaggedLines(before, featureName);
    if (writeTargetIfChanged(fileKey, before, content)) {
      log.push(`  - ${targetFiles[fileKey].path} (${removed} line${removed === 1 ? '' : 's'})`);
    }
  });
  return log.length ? log : ['  = nothing to remove'];
};

/**
 * Status lines for all features.
 * @param {Object<string, object>} registry - Feature registry
 * @returns {string[]} Status lines
 */
const featureStatus = (registry) =>
  Object.entries(registry).map(
    ([name, feature]) => `  [${isEnabled(name, feature) ? 'x' : ' '}] ${name} — ${feature.label}`
  );

/**
 * Apply a desired state to a feature, logging what happened.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition
 * @param {boolean} want - Desired enabled state
 * @returns {void}
 */
const applyFeature = (featureName, feature, want) => {
  if (want === isEnabled(featureName, feature)) {
    return;
  }
  if (want) {
    enableFeature(featureName, feature);
  } else {
    disableFeature(featureName, feature);
  }
};

/**
 * Interactive setup: ask y/n for each feature and apply the answers.
 * Pressing Enter keeps the current choice.
 * @param {Object<string, object>} registry - Feature registry
 * @returns {Promise<void>} Resolves when done
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: a single linear prompt-and-apply loop reads more clearly inline than split across helpers
const runInteractive = async (registry) => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  // Pull lines through a single async iterator so answers are never dropped,
  // whether the user types them at a TTY or pipes them in for an unattended run.
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (promptText) => {
    stdout.write(promptText);
    const next = await lines.next();
    return next.done ? '' : String(next.value);
  };
  /* eslint-disable no-console */
  console.log('Initialize the page shell. Press Enter to keep the current choice.\n');
  try {
    for (const [name, feature] of Object.entries(registry)) {
      const enabled = isEnabled(name, feature);
      const answer = (
        await ask(`${feature.label} (currently ${enabled ? 'on' : 'off'}). Enable? [${enabled ? 'Y/n' : 'y/N'}]: `)
      )
        .trim()
        .toLowerCase();
      // Only an explicit yes/no changes anything; Enter or any unrecognized answer
      // keeps the current state, so an ambiguous reply never silently flips a feature.
      const want = answer.startsWith('y') ? true : answer.startsWith('n') ? false : enabled;
      applyFeature(name, feature, want);
      console.log(
        `  ${want ? 'on' : 'off'}${want && !enabled && feature.afterEnable ? `\n  note: ${feature.afterEnable}` : ''}\n`
      );
    }
  } finally {
    rl.close();
  }
  console.log('Done. Current state:');
  console.log(featureStatus(registry).join('\n'));
  /* eslint-enable no-console */
};

/**
 * Entry point: interactive by default, with status/enable/disable subcommands.
 * @returns {Promise<void>} Resolves when done
 */
const main = async () => {
  const [command, ...featureNames] = process.argv.slice(2);
  const registry = loadRegistry();
  /* eslint-disable no-console */
  if (!command || command === 'init') {
    await runInteractive(registry);
    return;
  }
  if (command === 'status') {
    console.log(['Shell features:', ...featureStatus(registry)].join('\n'));
    return;
  }
  if (command !== 'enable' && command !== 'disable') {
    throw new Error(
      `Unknown command "${command}". Use: (no args) | status | enable <feature...> | disable <feature...>`
    );
  }
  if (featureNames.length === 0) {
    throw new Error(`"${command}" needs at least one feature. Known: ${Object.keys(registry).join(', ')}`);
  }
  featureNames.forEach((featureName) => {
    const feature = registry[featureName];
    if (!feature) {
      throw new Error(`Unknown feature "${featureName}". Known: ${Object.keys(registry).join(', ')}`);
    }
    const log = command === 'enable' ? enableFeature(featureName, feature) : disableFeature(featureName, feature);
    console.log([`${command} ${featureName}:`, ...log].join('\n'));
    if (command === 'enable' && feature.afterEnable) {
      console.log(`  note: ${feature.afterEnable}`);
    }
  });
  /* eslint-enable no-console */
};

main().catch((error) => {
  /* eslint-disable-next-line no-console */
  console.error(error.message);
  process.exit(1);
});
