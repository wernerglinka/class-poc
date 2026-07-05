/**
 * Header Component
 * Handles mobile menu toggle, header search, and top message functionality
 */

/** Cookie name for dismissed top message */
const TOP_MESSAGE_COOKIE_NAME = 'topMessageDismissed';

/** Cookie expiration in days */
const TOP_MESSAGE_COOKIE_DAYS = 7;

/**
 * Initialize header functionality when DOM loads
 */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderSearch();
  initTopMessage();
});

/**
 * Initialize header search form
 * Handles search overlay toggle, form submission, and keyboard shortcuts
 */
function initHeaderSearch() {
  const searchToggle = document.querySelector('.search-icon-toggle');
  const searchOverlay = document.querySelector('.header-search-overlay');
  const searchForm = document.querySelector('.header-search-form');
  const searchInput = document.querySelector('#header-search-input');

  if (!searchToggle || !searchOverlay || !searchForm || !searchInput) {
    return;
  }

  // Toggle search overlay visibility
  searchToggle.addEventListener('click', () => {
    const isActive = searchOverlay.classList.contains('active');

    if (isActive) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  // Open search overlay
  function openSearch() {
    searchOverlay.classList.add('active');
    searchToggle.classList.add('search-active');
    searchToggle.setAttribute('aria-expanded', 'true');

    // Focus input after animation completes
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  }

  // Close search overlay
  function closeSearch() {
    searchOverlay.classList.remove('active');
    searchToggle.classList.remove('search-active');
    searchToggle.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
  }

  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    const isClickInsideOverlay = searchOverlay.contains(e.target);
    const isClickOnToggle = searchToggle.contains(e.target);

    if (!isClickInsideOverlay && !isClickOnToggle && searchOverlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Close search on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Handle form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const query = searchInput.value.trim();

    if (query.length === 0) {
      // Focus input if empty
      searchInput.focus();
      return;
    }

    // Redirect to search page with query parameter
    const searchURL = `/search/?q=${encodeURIComponent(query)}`;
    window.location.href = searchURL;
  });

  // Handle keyboard shortcut (Cmd/Ctrl + K) to open search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (!searchOverlay.classList.contains('active')) {
        openSearch();
      }
    }
  });
}

/**
 * Initialize top message bar
 * Handles dismiss button and cookie persistence
 */
function initTopMessage() {
  const headerWrapper = document.querySelector('.header-wrapper');
  const topMessage = document.querySelector('.top-message');
  const closeButton = document.querySelector('.top-message-close');

  if (!headerWrapper || !topMessage) {
    return;
  }

  // Check if message was previously dismissed
  const messageId = getMessageId();
  const isDismissed = getCookie(TOP_MESSAGE_COOKIE_NAME) === messageId;

  if (isDismissed) {
    // Hide immediately without animation
    headerWrapper.classList.add('is-dismissed');
    topMessage.style.display = 'none';
    return;
  }

  // Handle close button click
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      dismissTopMessage(headerWrapper, messageId);
    });
  }
}

/**
 * Dismiss the top message with animation
 * @param {HTMLElement} headerWrapper - The header wrapper element
 * @param {string} messageId - Unique identifier for the message
 */
function dismissTopMessage(headerWrapper, messageId) {
  headerWrapper.classList.add('is-dismissed');

  // Store dismissal in cookie with expiration
  setCookie(TOP_MESSAGE_COOKIE_NAME, messageId, TOP_MESSAGE_COOKIE_DAYS);
}

/**
 * Generate a simple hash from the message text for identification
 * This allows the message to reappear when content changes
 * @returns {string} Hash of the message content
 */
function getMessageId() {
  const topMessage = document.querySelector('.top-message-text');
  if (!topMessage) {
    return 'default';
  }

  const text = topMessage.textContent.trim();
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration
 */
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // biome-ignore lint/suspicious/noDocumentCookie: setting a first-party preference cookie is the intended behavior here
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}
