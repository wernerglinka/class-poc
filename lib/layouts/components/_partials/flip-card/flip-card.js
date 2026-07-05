/**
 * Flip Card Component
 * Provides interactive flip card functionality with hover, touch, and keyboard support
 */

/**
 * Adds event listeners to a single flip card
 * @param {HTMLElement} flipCard - The flip card element
 */
const initFlipCard = (flipCard) => {
  // Skip if already initialized
  if (flipCard.dataset.initialized) {
    return;
  }
  flipCard.dataset.initialized = 'true';

  // Hover events
  flipCard.addEventListener('mouseenter', () => {
    flipCard.classList.add('flip');
  });

  flipCard.addEventListener('mouseleave', () => {
    flipCard.classList.remove('flip');
  });

  // Touch events
  flipCard.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flipCard.classList.toggle('flip');
  });

  // Keyboard accessibility
  flipCard.setAttribute('tabindex', '0');
  flipCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipCard.classList.toggle('flip');
    }
  });
};

/**
 * Initialize all flip cards on the page
 */
function initFlipCards() {
  const flipCards = document.querySelectorAll('.flip-card-wrapper');
  flipCards.forEach(initFlipCard);
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('flip-card', initFlipCards);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlipCards);
} else {
  initFlipCards();
}
