document.addEventListener('DOMContentLoaded', () => {
  /**
   * Adds event listeners to a single flip card
   */
  const initFlipCard = (flipCard) => {
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
  const flipCards = document.querySelectorAll('.flip-card-wrapper');

  flipCards.forEach(initFlipCard);

  // All flip cards initialized
});
