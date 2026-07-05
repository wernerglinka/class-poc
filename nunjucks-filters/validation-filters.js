/**
 * Validation and check filters
 */

/**
 * Checks if a URL is external (starts with http://, https://, or //)
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is external, false otherwise
 */
export const isExternal = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('//');
};

/**
 * Checks if a value is a string
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a string, false otherwise
 */
export const isString = (value) => {
  return typeof value === 'string';
};

/**
 * Checks if an image object has a valid src property
 * @param {Object} imageObj - The image object to check
 * @returns {boolean} True if the image has a valid src, false otherwise
 */
export const hasImage = (imageObj) => {
  return imageObj?.src && imageObj.src.trim() !== '';
};

/**
 * Checks if there are any valid CTAs in the CTAs array
 * A valid CTA must have both url and label properties that are non-empty strings
 * @param {Array} ctasArray - The array of CTA objects to check
 * @returns {boolean} True if there is at least one valid CTA, false otherwise
 */
export const hasCtas = (ctasArray) => {
  if (!Array.isArray(ctasArray) || ctasArray.length === 0) {
    return false;
  }

  return ctasArray.some((cta) => cta?.url && cta.url.trim() !== '' && cta.label && cta.label.trim() !== '');
};

/**
 * Checks if a text object has any meaningful content
 * @param {Object} textObj - The text object to check
 * @returns {boolean} True if the text has meaningful content, false otherwise
 */
export const hasText = (textObj) => {
  if (!textObj || typeof textObj !== 'object') {
    return false;
  }

  const { leadIn, title, subTitle, prose } = textObj;

  return (
    (leadIn && leadIn.trim() !== '') ||
    (title && title.trim() !== '') ||
    (subTitle && subTitle.trim() !== '') ||
    (prose && prose.trim() !== '')
  );
};

/**
 * Checks if an author value exists and has meaningful content
 * Handles both single author strings and arrays of authors
 * @param {string|Array} author - The author value to check (string or array)
 * @returns {boolean} True if there is at least one non-empty author, false otherwise
 */
export const hasAuthor = (author) => {
  if (!author) {
    return false;
  }

  // If it's an array, check if it has length and at least one non-empty item
  if (Array.isArray(author)) {
    return author.length > 0 && author.some((a) => a?.trim && a.trim() !== '');
  }

  // If it's a string, check if it's not empty
  if (typeof author === 'string') {
    return author.trim() !== '';
  }

  return false;
};

/**
 * Checks if a URL value exists and has meaningful content
 * @param {string} url - The URL value to check
 * @returns {boolean} True if the URL exists and is not empty, false otherwise
 */
export const hasUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return url.trim() !== '';
};

/**
 * Checks if an array or object has items/properties
 * @param {Array|Object} items - The array or object to check
 * @returns {boolean} True if there are items/properties, false otherwise
 */
export const hasItems = (items) => {
  if (!items) {
    return false;
  }

  // If it's an array, check if it has length
  if (Array.isArray(items)) {
    return items.length > 0;
  }

  // If it's an object, check if it has keys
  if (typeof items === 'object') {
    return Object.keys(items).length > 0;
  }

  return false;
};

/**
 * Checks if an object has an icon property with meaningful content
 * @param {Object} obj - The object to check for an icon property
 * @returns {boolean} True if the object has a non-empty icon property, false otherwise
 */
export const hasIcon = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return obj.icon && typeof obj.icon === 'string' && obj.icon.trim() !== '';
};
