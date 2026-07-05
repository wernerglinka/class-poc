/* eslint-disable no-console */

/**
 * Interactive component installer.
 *
 * Pulls components from the canonical nunjucks-components published downloads,
 * shows which ones are not yet installed in this site, lets the developer pick,
 * resolves their dependency closure, downloads the archives, and unzips them
 * into place. The source is always the canonical truth, never a local copy.
 *
 * Usage:
 *   npm run components                              # interactive: pick from the not-installed list
 *   node scripts/install-components.mjs <name...>   # install named components plus their dependencies
 *
 * Config (`nunjucks-components.config.json` at the project root):
 *   registry           - canonical site origin, e.g. "https://nunjucks-components.com"
 *   componentsBasePath - e.g. "lib/layouts/components"
 *   sectionsDir        - e.g. "sections"
 *   partialsDir        - e.g. "_partials"
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const runCommand = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');

/**
 * Read and validate the project config.
 * @param {string} root - Project root directory
 * @returns {Promise<{registry: string, componentsBasePath: string, sectionsDir: string, partialsDir: string}>} Parsed config
 */
const loadConfig = async (root) => {
  const raw = await fs.readFile(path.join(root, 'nunjucks-components.config.json'), 'utf8');
  const config = JSON.parse(raw);
  if (!config.registry) {
    throw new Error(
      'nunjucks-components.config.json is missing "registry" (the canonical site origin, e.g. https://nunjucks-components.com)'
    );
  }
  return config;
};

/**
 * Fetch the canonical catalog and index every component by name.
 * @param {string} registry - Canonical site origin
 * @returns {Promise<{sections: object[], partials: object[], byName: Map<string, object>}>} Catalog
 */
const fetchCatalog = async (registry) => {
  const url = `${registry.replace(/\/$/, '')}/downloads/manifest.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch catalog at ${url} (${response.status})`);
  }
  const manifest = await response.json();
  const sections = manifest.sections || [];
  const partials = manifest.partials || [];
  const byName = new Map();
  [...sections, ...partials].forEach((entry) => {
    byName.set(entry.name, entry);
  });
  return { sections, partials, byName };
};

/**
 * List the component names already present in the site, across sections and partials.
 * @param {string} root - Project root
 * @param {object} config - Project config
 * @returns {Promise<Set<string>>} Installed component names
 */
const listInstalled = async (root, config) => {
  const installed = new Set();
  const directories = [
    path.join(root, config.componentsBasePath, config.sectionsDir),
    path.join(root, config.componentsBasePath, config.partialsDir)
  ];
  for (const directory of directories) {
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      // Directory may not exist yet; treat as nothing installed there.
    }
    entries
      .filter((entry) => entry.isDirectory())
      .forEach((entry) => {
        installed.add(entry.name);
      });
  }
  return installed;
};

/**
 * Catalog entries that are not yet installed, sections listed before partials.
 * @param {{sections: object[], partials: object[]}} catalog - Catalog
 * @param {Set<string>} installed - Installed names
 * @returns {object[]} Available-but-not-installed entries
 */
export const availableNotInstalled = (catalog, installed) =>
  [...catalog.sections, ...catalog.partials].filter((entry) => !installed.has(entry.name));

/**
 * Resolve the full set to install: the chosen components plus every required
 * dependency not already installed, with dependencies ordered before dependents.
 * @param {string[]} chosen - Selected component names
 * @param {Map<string, object>} byName - Catalog indexed by name
 * @param {Set<string>} installed - Already installed names
 * @returns {object[]} Ordered list of catalog entries to install
 */
export const resolveClosure = (chosen, byName, installed) => {
  const ordered = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name) || installed.has(name)) {
      return;
    }
    seen.add(name);
    const entry = byName.get(name);
    if (!entry) {
      throw new Error(`"${name}" is not in the canonical catalog`);
    }
    (entry.requires || []).forEach(visit);
    ordered.push(entry);
  };
  chosen.forEach(visit);
  return ordered;
};

/**
 * Download one component archive and unzip it into its target directory.
 * The archive carries a top-level `${name}/` directory, so extracting into the
 * sections or partials directory lands the component folder in place.
 * @param {object} entry - Catalog entry (name, type, downloadUrl)
 * @param {string} registry - Canonical site origin
 * @param {string} root - Project root
 * @param {object} config - Project config
 * @returns {Promise<void>} Resolves when placed
 */
const downloadAndPlace = async (entry, registry, root, config) => {
  const archiveUrl = `${registry.replace(/\/$/, '')}${entry.downloadUrl}`;
  const response = await fetch(archiveUrl);
  if (!response.ok) {
    throw new Error(`Could not download ${entry.name} at ${archiveUrl} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const temporaryZip = path.join(os.tmpdir(), `${entry.name}-${Date.now()}.zip`);
  await fs.writeFile(temporaryZip, buffer);

  const subDirectory = entry.type === 'section' ? config.sectionsDir : config.partialsDir;
  const targetParent = path.join(root, config.componentsBasePath, subDirectory);
  await fs.mkdir(targetParent, { recursive: true });

  try {
    await runCommand('unzip', ['-o', '-q', temporaryZip, '-d', targetParent]);
  } finally {
    await fs.rm(temporaryZip, { force: true });
  }
};

/**
 * Ask the developer which not-installed components to add. Accepts list numbers
 * or names, comma-separated.
 * @param {object[]} items - Available entries
 * @returns {Promise<string[]>} Chosen names
 */
const promptSelection = async (items) => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    console.log('\nComponents available to install:\n');
    items.forEach((entry, index) => {
      const dependencies = (entry.requires || []).length ? `  (requires: ${entry.requires.join(', ')})` : '';
      console.log(`  ${String(index + 1).padStart(2)}. ${entry.name} [${entry.type}]${dependencies}`);
    });
    const answer = await rl.question('\nEnter numbers or names to install (comma-separated), or blank to cancel: ');
    const tokens = answer
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
    return tokens.map((token) => {
      const asIndex = Number(token);
      if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= items.length) {
        return items[asIndex - 1].name;
      }
      return token;
    });
  } finally {
    rl.close();
  }
};

/**
 * Entry point. Interactive when run with no arguments; otherwise installs the
 * named components and their dependencies.
 * @returns {Promise<void>} Resolves when done
 */
const main = async () => {
  const config = await loadConfig(projectRoot);
  const catalog = await fetchCatalog(config.registry);
  const installed = await listInstalled(projectRoot, config);

  const namesFromCli = process.argv.slice(2);
  let chosen;
  if (namesFromCli.length) {
    chosen = namesFromCli;
  } else {
    const available = availableNotInstalled(catalog, installed);
    if (!available.length) {
      console.log('Every catalog component is already installed.');
      return;
    }
    chosen = await promptSelection(available);
  }

  if (!chosen.length) {
    console.log('Nothing selected.');
    return;
  }

  const toInstall = resolveClosure(chosen, catalog.byName, installed);
  if (!toInstall.length) {
    console.log('Nothing to install; the selections and their dependencies are already present.');
    return;
  }

  console.log(`\nInstalling ${toInstall.length} component(s): ${toInstall.map((entry) => entry.name).join(', ')}\n`);
  for (const entry of toInstall) {
    await downloadAndPlace(entry, config.registry, projectRoot, config);
    console.log(`  + ${entry.name} [${entry.type}]`);
  }
  console.log('\nDone. Review the added components, then build to bundle them.');
};

// Run only when invoked directly, so the pure helpers above can be imported by
// tests without triggering a network install.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\nInstall failed: ${error.message}`);
    process.exit(1);
  });
}
