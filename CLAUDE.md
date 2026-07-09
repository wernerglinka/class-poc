# CLAUDE.md

Guidance for Claude when working in this repository.

## What this is

Proof of concept for the Center for People and Craft (CPC) class catalog: a
Metalsmith static site that renders class pages from a Google Sheet at build
time. Registration and payment are external (referenced by URL only). Runtime
JavaScript handles only volunteer host availability and signups, via a Google
Apps Script web app.

## Documentation

Substantive documentation lives in `/docs`. Start with `docs/README.md`, the
reading-order index. In short: `theory-of-operation.md` explains the design and
why (read first when returning after time away, or before changing anything
structural); `cpc-google-howto.md` is the operational runbook for the Google
side; `apps-script-primer.md` explains the Apps Script platform;
`cpc-class-data-schema.md` is the data schema reference;
`adding-a-class.md` and the two `cheatsheet-*.md` files are end-user guides.

Before changing the data model, the Sheet structure, or any Apps Script code,
read `theory-of-operation.md` and `cpc-class-data-schema.md` first. If a change
alters the schema or a workflow, update the corresponding doc in the same
change.

## Commands

- `npm run dev` — development build
- `npm start` — development build with watch
- `npm run build` — production build (always fetches fresh Sheet data;
  dev builds cache it)
- `npm test` — run tests (`node --test`, native Node test runner)
- `npm run fix` — Biome lint + format

## Layout of the repository

- `metalsmith.js` — build configuration, heavily commented; the pipeline order
  matters and is explained inline
- `plugins/` — project-local Metalsmith plugins:
  `metalsmith-cpc-classes.js` (fetches class data from the Google web app) and
  `metalsmith-cpc-class-pages.js` (generates one page per class offering)
- `google-scripts/` — Apps Script sources, one folder per Google project:
  `intake/` (standalone project: builder + web app) and `sheet-review/`
  (sheet-bound project: intake pipeline, review menu/modal, notifications).
  Deployed manually to Google; the repo copies are the source of truth.
  `OBSOLETE/` holds retired scripts, don't build on them.
- `lib/layouts/` — Nunjucks templates: `pages/`, `components/`, `icons/`
- `lib/data/` — site-wide JSON data (org config lives in `cpc.json`)
- `lib/assets/global-styles.css` — global styles; component styles are bundled
  separately by the component bundler
- `nunjucks-filters/` — custom Nunjucks filters, grouped by type
- `src/` — page content (markdown with structured frontmatter)
- `test/` — tests for plugins, component system, and build integration
- `notes.md` — section-component and CSS architecture notes

## Conventions

- Plain JavaScript, ESM (`type: module`). No TypeScript; use JSDoc type
  annotations for IDE support.
- Functional style: pure functions where possible, explicit returns, no
  parameter mutation, single-purpose functions, dependency injection over
  hidden imports where practical.
- JSDoc comments on all functions. Descriptive names, no abbreviations
  (`error` not `err`).
- Tests use the native Node test runner (`node --test`), no test framework.
- Biome for linting and formatting (`biome.json`); run `npm run fix` before
  committing.
- Pages are composed from section components
  (`lib/layouts/components/sections/`), each with a Nunjucks template, a CSS
  file, and a `manifest.json` consumed by the component bundler. See `notes.md`.
- CSS follows Every Layout / CUBE CSS with Utopia fluid type and spacing. No
  Tailwind. Single-dash class naming (no BEM double dashes).
- Apps Script code: every `.gs` file in a project shares one global namespace;
  batch Sheet reads/writes (`getValues`/`setValues`), never loop over cells.
  See `apps-script-primer.md`.

## Secrets

`.env` holds the build token and web app URL; Script Properties on the Google
side hold their counterparts. Neither is committed. See the "where every URL
and secret lives" section of `cpc-google-howto.md`.
