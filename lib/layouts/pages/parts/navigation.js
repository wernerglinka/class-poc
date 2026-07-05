document.addEventListener('DOMContentLoaded', () => {
  /**
   * Mobile menu functionality
   * Toggles the mobile menu when the hamburger button is clicked
   */
  const hamburger = document.querySelector('.hamburger-menu');
  const mainMenu = document.querySelector('.main-menu');
  const nav = document.querySelector('nav');

  if (hamburger && mainMenu && nav) {
    /**
     * Check if mobile menu is active by checking if hamburger is displayed
     * This works with container queries - when nav container is narrow, hamburger appears
     */
    const isMobileMenu = () => {
      const hamburgerDisplay = window.getComputedStyle(hamburger).display;
      return hamburgerDisplay !== 'none';
    };

    hamburger.addEventListener('click', () => {
      // Toggle active class on hamburger and menu
      hamburger.classList.toggle('active');
      mainMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isClickInside = hamburger.contains(event.target) || mainMenu.contains(event.target);

      if (!isClickInside && mainMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        mainMenu.classList.remove('active');
      }
    });

    // Close menu when clicking on a menu item (only in mobile mode)
    const menuLinks = mainMenu.querySelectorAll('a');
    menuLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (isMobileMenu()) {
          hamburger.classList.remove('active');
          mainMenu.classList.remove('active');
        }
      });
    });
  }

  // Show to-top button when scrolling
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      document.body.classList.add('scrolling');
    } else {
      document.body.classList.remove('scrolling');
    }
  });
});
