/**
 * Automatically mark navigation links as active based on current URL
 */
(function initActiveNavigation() {
  const markActiveLinks = () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-menu a');

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute('href');
      const listItem = link.parentElement;

      // Remove any existing active states
      listItem.classList.remove('active');
      link.classList.remove('active');

      // Check if this link matches the current path
      if (linkPath === currentPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
        listItem.classList.add('active');
        link.classList.add('active');
      }
    });
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markActiveLinks);
  } else {
    markActiveLinks();
  }
})();
