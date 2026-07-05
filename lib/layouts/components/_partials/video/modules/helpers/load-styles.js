/**
 * Style Loading Helper
 */

/**
 * Dynamically load a CSS file
 * @param {string} href - The CSS file URL
 * @returns {Promise} Promise that resolves when CSS is loaded
 */
const loadStyles = (href) => {
  return new Promise((resolve, reject) => {
    // Check if stylesheet is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));

    document.head.appendChild(link);
  });
};

export default loadStyles;
