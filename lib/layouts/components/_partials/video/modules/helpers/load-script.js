/**
 * Script Loading Helper
 */

/**
 * Dynamically load a script
 * @param {string} src - The script source URL
 * @returns {Promise} Promise that resolves when script is loaded
 */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
};

export default loadScript;
