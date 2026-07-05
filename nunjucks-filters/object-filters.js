/**
 * Object manipulation filters
 */

/**
 * Normalizes icon input to always return a valid icon object
 * If input is a string, creates an icon object with that string as the icon name
 * If input is already a valid icon object, passes it through unchanged
 * @param {string|Object} input - The icon input (string name or object)
 * @returns {Object} A valid icon object with icon, url, and title properties
 */
export const normalizeIcon = (input) => {
  // If it's a string, create an icon object
  if (typeof input === 'string') {
    return {
      icon: input,
      url: null,
      title: null
    };
  }

  // If it's already an object with an icon property, pass it through
  if (input && typeof input === 'object' && input.icon) {
    return {
      icon: input.icon,
      url: input.url || null,
      title: input.title || null
    };
  }

  // Fallback for invalid input
  return {
    icon: null,
    url: null,
    title: null
  };
};

/**
 * Merges properties into each object in an array
 * If a property exists, it will be updated; if not, it will be added
 * @param {Array} items - The array of objects to transform
 * @param {Object} propsToMerge - Object containing properties to merge into each item
 * @returns {Array} The transformed array with merged properties
 * @example
 * // Returns [{name: 'Item 1', isHorizontal: true}, {name: 'Item 2', isHorizontal: true}]
 * mergeProps([{name: 'Item 1'}, {name: 'Item 2'}], {isHorizontal: true})
 */
export const mergeProps = (items, propsToMerge) => {
  if (!Array.isArray(items) || !propsToMerge || typeof propsToMerge !== 'object') {
    return items;
  }

  return items.map((item) => ({
    ...item,
    ...propsToMerge
  }));
};

/**
 * Merges properties into a single object
 * If a property exists, it will be updated; if not, it will be added
 * @param {Object} obj - The object to merge properties into
 * @param {Object} propsToMerge - Object containing properties to merge
 * @returns {Object} The object with merged properties
 * @example
 * // Returns {name: 'Item 1', link: '/page', isActive: true}
 * merge({name: 'Item 1'}, {link: '/page', isActive: true})
 */
export const merge = (obj, propsToMerge) => {
  if (!obj || typeof obj !== 'object' || !propsToMerge || typeof propsToMerge !== 'object') {
    return obj;
  }

  return {
    ...obj,
    ...propsToMerge
  };
};

/**
 * Gets the download URL for a component package
 * Searches both sections and partials for the component
 * @param {Object} componentPackages - The componentPackages metadata object
 * @param {string} componentName - Name of the component
 * @returns {string|null} The download URL or null if not found
 * @example
 * // Returns '/downloads/sections/hero-v0.0.1.zip'
 * getDownloadUrl(componentPackages, 'hero')
 */
export const getDownloadUrl = (componentPackages, componentName) => {
  if (!componentPackages || !componentName) {
    return null;
  }

  // Search in sections
  if (componentPackages.sections) {
    const section = componentPackages.sections.find((pkg) => pkg.name === componentName);
    if (section) {
      return section.downloadUrl;
    }
  }

  // Search in partials
  if (componentPackages.partials) {
    const partial = componentPackages.partials.find((pkg) => pkg.name === componentName);
    if (partial) {
      return partial.downloadUrl;
    }
  }

  return null;
};
