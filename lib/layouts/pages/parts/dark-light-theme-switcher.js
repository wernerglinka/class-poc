/**
 * Dark/light theme switcher.
 *
 * Self-contained: applies the saved theme on load and toggles it on click,
 * persisting the choice to localStorage. Safe to load on pages without the
 * toggle button (the click handler is only bound when the button exists).
 *
 * The switch toggles a `dark-theme` class on <body>. Define your dark-mode
 * design-token overrides under `.dark-theme` for the change to affect the page.
 */

/**
 * Apply the theme saved in localStorage to <body>.
 * @returns {void}
 */
function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', theme === 'dark');
}

/**
 * Bind the toggle button, if present on the page.
 * @returns {void}
 */
function initThemeToggle() {
  const themeToggle = document.querySelector('.js-theme-toggle');
  if (!themeToggle) {
    return;
  }
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

applySavedTheme();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}
