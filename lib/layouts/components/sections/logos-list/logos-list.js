/**
 * Manage logo display
 * If logos list fits on viewport width its static, if not logos will rotate automatically
 */

let logosListResizeObserver = null;

/**
 * Handle animation completion and remove play class
 * @param {HTMLElement} logosList - The logos list element
 */
const completeAnimationAndRemovePlay = (logosList) => {
  const parentElement = logosList.parentElement;

  // If already in the process of stopping, don't restart
  if (parentElement.dataset.stopping === 'true') {
    return;
  }

  // Mark as stopping to prevent multiple listeners
  parentElement.dataset.stopping = 'true';

  // Listen for the animation to complete one full cycle
  const handleAnimationIteration = () => {
    parentElement.classList.remove('play');
    parentElement.removeEventListener('animationiteration', handleAnimationIteration);
    delete parentElement.dataset.stopping;
  };

  parentElement.addEventListener('animationiteration', handleAnimationIteration);

  // Fallback: remove after a reasonable timeout if animation doesn't fire the event
  setTimeout(() => {
    if (parentElement.dataset.stopping === 'true') {
      parentElement.classList.remove('play');
      parentElement.removeEventListener('animationiteration', handleAnimationIteration);
      delete parentElement.dataset.stopping;
    }
  }, 16000); // Slightly longer than the 15s animation duration
};

/**
 * Check and update logos list display mode
 * @param {HTMLElement} logosList - The logos list element
 */
const updateLogosListDisplay = (logosList) => {
  const container = logosList.closest('.marquee-container');
  if (!container) {
    return;
  }

  const containerWidth = container.offsetWidth;
  if (logosList.offsetWidth > containerWidth) {
    logosList.parentElement.classList.add('play');
    delete logosList.parentElement.dataset.stopping;
  } else {
    const parentElement = logosList.parentElement;
    if (parentElement.classList.contains('play') && parentElement.dataset.stopping !== 'true') {
      completeAnimationAndRemovePlay(logosList);
    }
  }
};

/**
 * Initialize logos list component
 */
function initLogosLists() {
  const allLogosLists = document.querySelectorAll('.js-logos-list');

  if (allLogosLists.length === 0) {
    return;
  }

  // Initial check for each logos list
  allLogosLists.forEach((logosList) => {
    // Skip if already initialized
    if (logosList.dataset.initialized) {
      return;
    }
    logosList.dataset.initialized = 'true';

    updateLogosListDisplay(logosList);
  });

  // Set up resize observer if not already created
  if (!logosListResizeObserver) {
    logosListResizeObserver = new ResizeObserver(() => {
      const allLogosLists = document.querySelectorAll('.js-logos-list');
      allLogosLists.forEach(updateLogosListDisplay);
    });

    logosListResizeObserver.observe(document.body);
  }
}

/**
 * Cleanup logos list component
 */
function cleanupLogosLists() {
  if (logosListResizeObserver) {
    logosListResizeObserver.disconnect();
    logosListResizeObserver = null;
  }
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('logos-list', initLogosLists);
  window.PageTransitions.registerCleanup('logos-list', cleanupLogosLists);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogosLists);
} else {
  initLogosLists();
}
