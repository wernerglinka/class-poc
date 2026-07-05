/**
 * Date formatting filters
 */

/**
 * Gets the current year - useful for copyright notices
 * @returns {number} The current year
 */
export const currentYear = () => {
  return new Date().getFullYear();
};

/**
 * Formats a date in UTC format
 * @param {Date|string} date - The date to format (can be Date object or string)
 * @returns {string} The formatted UTC date string
 */
export const UTCdate = (date) => {
  // Convert to Date object if it's a string
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toUTCString();
};

/**
 * Formats a date string into a readable blog date format (Month Day, Year)
 * @param {string} string - The date string to format
 * @returns {string} The formatted date string
 */
export const blogDate = (string) =>
  new Date(string).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Formats a date as dd/mm/yyyy
 * @param {string|Date} dateString - The date to format (defaults to current date if not provided)
 * @returns {string} The formatted date string in dd/mm/yyyy format
 */
export const getDate = (dateString) => {
  const date = new Date(dateString || Date.now());
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formats a date as 'Month Year' (e.g., 'January 2023')
 * @param {string|Date} dateString - The date to format (defaults to current date if not provided)
 * @returns {string} The formatted date string in 'Month Year' format
 */
export const getMonthYear = (dateString) => {
  const date = new Date(dateString || Date.now());
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${month} ${year}`;
};
