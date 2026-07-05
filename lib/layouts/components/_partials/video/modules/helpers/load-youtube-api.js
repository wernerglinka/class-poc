/**
 * YouTube API Loading Helper
 */

let youtubeAPIPromise = null;

/**
 * Load the YouTube IFrame API
 * @returns {Promise} Promise that resolves when API is ready
 */
const loadYouTubeAPI = () => {
  // Return existing promise if already loading/loaded
  if (youtubeAPIPromise) {
    return youtubeAPIPromise;
  }

  // Check if API is already loaded
  if (window.YT?.Player) {
    youtubeAPIPromise = Promise.resolve();
    return youtubeAPIPromise;
  }

  youtubeAPIPromise = new Promise((resolve) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });

  return youtubeAPIPromise;
};

export default loadYouTubeAPI;
