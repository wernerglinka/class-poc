/**
 * Banner Component - Accordion functionality
 *
 * Turns a banner section into an accordion header when it carries the
 * `banner-accordion-header` class. The immediately following section must
 * carry `banner-accordion-content` (typically with `is-closed`) and becomes
 * the collapsible panel.
 *
 * Uses banner- prefixed classes to avoid conflicts with the accordion section.
 * SWUP-compatible: re-initializes after page swaps without double-binding.
 */

const initBannerAccordion = () => {
  /**
   * Screen Reader Announcement Utility
   * @param {string} message - Text to announce politely
   */
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Select banner-specific accordion headers
  document.querySelectorAll('.banner-accordion-header').forEach((header, index) => {
    // Skip if already initialized (guards against SWUP re-init double-binding)
    if (header.dataset.initialized) {
      return;
    }

    const content = header.nextElementSibling;

    if (!content?.classList.contains('banner-accordion-content')) {
      console.warn('Banner accordion missing .banner-accordion-content sibling');
      return;
    }

    header.dataset.initialized = 'true';

    // Generate unique IDs
    const headerId = `banner-accordion-header-${index}`;
    const contentId = `banner-accordion-content-${index}`;

    // Set up ARIA attributes
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('id', headerId);
    header.setAttribute('aria-controls', contentId);

    content.setAttribute('id', contentId);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', headerId);

    // Get header title for announcements
    const headerTitle = header.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || 'Accordion section';

    // Click handler
    header.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = header.classList.contains('is-open');

      header.classList.toggle('is-open');
      content.classList.toggle('is-closed');

      // Update ARIA state
      header.setAttribute('aria-expanded', !isOpen);

      // Announce to screen readers
      const action = !isOpen ? 'expanded' : 'collapsed';
      announceToScreenReader(`${headerTitle} ${action}`);
    });

    // Keyboard support
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    // Set initial state from the authored markup
    if (!header.classList.contains('is-open')) {
      content.classList.add('is-closed');
      header.setAttribute('aria-expanded', 'false');
    } else {
      content.classList.remove('is-closed');
      header.setAttribute('aria-expanded', 'true');
    }
  });
};

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('banner', initBannerAccordion);
}

// Initialize when DOM is ready (covers non-SWUP sites and first load)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBannerAccordion);
} else {
  initBannerAccordion();
}
