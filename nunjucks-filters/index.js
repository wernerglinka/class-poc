/**
 * Nunjucks Filters
 *
 * This file imports and re-exports all custom Nunjucks filters used in templates.
 * Filters are organized by category for better maintainability.
 */

// Array manipulation filters
export {
  getArrayLength,
  getSelections,
  isArray,
  isRelated,
  toArray
} from './array-filters.js';

// Date formatting filters
export {
  blogDate,
  currentYear,
  getDate,
  getMonthYear,
  UTCdate
} from './date-filters.js';
// Debug and JSON formatting filters
export {
  debugCollections,
  myDump,
  objToString,
  safeDump
} from './debug-filters.js';
// Markdown processing
export { mdInline, mdToHTML } from './markdown-filter.js';
// Object manipulation filters
export {
  getDownloadUrl,
  merge,
  mergeProps,
  normalizeIcon
} from './object-filters.js';
// String manipulation filters
export {
  condenseTitle,
  spaceToDash,
  toLower,
  toUpper,
  trimSlashes,
  trimString
} from './string-filters.js';
// Validation and check filters
export {
  hasAuthor,
  hasCtas,
  hasIcon,
  hasImage,
  hasItems,
  hasText,
  hasUrl,
  isExternal,
  isString
} from './validation-filters.js';
