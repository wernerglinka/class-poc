/**
 * String manipulation filters
 */

/**
 * Converts a string to lowercase
 * @param {string} string - The input string to convert
 * @returns {string} The lowercase string
 */
export const toLower = (string) => string.toLowerCase();

/**
 * Converts a string to uppercase
 * @param {string} string - The input string to convert
 * @returns {string} The uppercase string
 */
export const toUpper = (string) => string.toUpperCase();

/**
 * Replaces spaces in a string with dashes
 * @param {string} string - The input string to convert
 * @returns {string} The string with spaces replaced by dashes
 */
export const spaceToDash = (string) => string.replace(/\s+/g, '-');

/**
 * Condenses a title by removing spaces and converting to lowercase
 * @param {string} string - The input string to condense
 * @returns {string} The condensed string
 */
export const condenseTitle = (string) => string.toLowerCase().replace(/\s+/g, '');

/**
 * Removes leading and trailing slashes from a string
 * @param {string} string - The input string to trim
 * @returns {string} The string with leading and trailing slashes removed
 */
export const trimSlashes = (string) => string.replace(/(^\/)|(\/$)/g, '');

/**
 * Trims a string to a specified length and adds ellipsis if needed
 * @param {string} string - The string to trim
 * @param {number} length - The maximum length
 * @returns {string} The trimmed string with ellipsis if it was longer than the specified length
 */
export const trimString = (string, length) => {
  if (string.length > length) {
    return `${string.substring(0, length)}...`;
  }
  return string;
};
