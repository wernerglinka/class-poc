/**
 * session-list
 * Live volunteer host display and signup for class session lists.
 *
 * On load, fetches current host availability from the Apps Script web
 * app (the build-rendered state may be stale) and updates each session
 * row. The signup button opens a dialog; submission POSTs to the same
 * endpoint. The POST uses Content-Type text/plain because Apps Script
 * cannot answer CORS preflight requests, and text/plain requests skip
 * them.
 */

/**
 * Fetch current availability and update the session rows.
 * Failures are silent: the build-rendered state remains visible.
 * @param {HTMLElement} sectionRoot - The .js-class-sessions element
 * @param {string} endpoint - Web app /exec URL
 * @returns {Promise<void>} Resolves when rows are updated
 */
const refreshAvailability = (sectionRoot, endpoint) =>
  fetch(endpoint)
    .then((response) => response.json())
    .then((payload) => {
      payload.sessions.forEach((session) => {
        updateSessionRow(sectionRoot, session.sessionId, session.hosted === true);
      });
    })
    .catch(() => {});

/**
 * Show or hide one session row's "(host needed)" link. Hosted
 * sessions display nothing; volunteer names are never shown.
 * @param {HTMLElement} sectionRoot - The .js-class-sessions element
 * @param {string} sessionId - Session to update
 * @param {boolean} hosted - Whether the session has a host
 */
const updateSessionRow = (sectionRoot, sessionId, hosted) => {
  const row = sectionRoot.querySelector(`[data-session-id="${sessionId}"]`);
  const signupLink = row === null ? null : row.querySelector('.js-host-signup');
  if (signupLink === null) {
    return;
  }
  signupLink.classList.toggle('is-hidden', hosted);
};

/**
 * Replace a row's signup link with a thank-you note after a
 * successful signup, so the volunteer sees confirmation in place.
 * @param {HTMLElement} sectionRoot - The .js-class-sessions element
 * @param {string} sessionId - Session that was claimed
 */
const showThankYou = (sectionRoot, sessionId) => {
  const row = sectionRoot.querySelector(`[data-session-id="${sessionId}"]`);
  const signupLink = row === null ? null : row.querySelector('.js-host-signup');
  if (signupLink === null) {
    return;
  }
  const thanks = document.createElement('span');
  thanks.className = 'session-thanks';
  thanks.textContent = 'Thank you! You are signed up to host.';
  signupLink.replaceWith(thanks);
};

/**
 * Submit a signup to the web app.
 * @param {string} endpoint - Web app /exec URL
 * @param {Object} signup - { sessionId, hostName, hostEmail, volunteerCode }
 * @returns {Promise<{ok: boolean, error?: string}>} Web app response
 */
const submitSignup = (endpoint, signup) =>
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(signup)
  }).then((response) => response.json());

/**
 * Map web app error codes to user-facing messages.
 * @param {string|undefined} errorCode - Error from the response
 * @returns {string} Message for the feedback line
 */
const feedbackMessage = (errorCode) => {
  const messages = {
    code: 'That volunteer code is not current. Check the latest volunteer email.',
    taken: 'Someone just claimed this session. Thank you anyway!',
    invalid: 'Please fill in all fields with a valid email address.',
    'not-found': 'This session no longer exists. Please reload the page.'
  };
  return messages[errorCode] ?? 'Something went wrong. Please try again later.';
};

/**
 * Wire up one class-sessions section.
 * @param {HTMLElement} sectionRoot - The .js-class-sessions element
 */
const setupClassSessions = (sectionRoot) => {
  const endpoint = sectionRoot.dataset.endpoint;
  if (!endpoint) {
    return;
  }

  const dialog = sectionRoot.querySelector('dialog');
  const form = dialog.querySelector('form');
  const feedback = dialog.querySelector('.js-feedback');

  refreshAvailability(sectionRoot, endpoint);

  sectionRoot.querySelectorAll('.js-host-signup').forEach((signupLink) => {
    signupLink.addEventListener('click', (event) => {
      event.preventDefault();
      form.reset();
      form.elements.sessionId.value = signupLink.closest('[data-session-id]').dataset.sessionId;
      feedback.textContent = '';
      dialog.showModal();
    });
  });

  dialog.querySelector('.js-cancel').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    feedback.textContent = '';

    const signup = {
      sessionId: form.elements.sessionId.value,
      hostName: form.elements.hostName.value.trim(),
      hostEmail: form.elements.hostEmail.value.trim(),
      volunteerCode: form.elements.volunteerCode.value.trim()
    };

    submitSignup(endpoint, signup)
      .then((response) => {
        if (response.ok) {
          showThankYou(sectionRoot, signup.sessionId);
          dialog.close();
          return;
        }
        feedback.textContent = feedbackMessage(response.error);
        if (response.error === 'taken') {
          refreshAvailability(sectionRoot, endpoint);
        }
      })
      .catch(() => {
        feedback.textContent = feedbackMessage(undefined);
      })
      .finally(() => {
        submitButton.disabled = false;
      });
  });
};

/**
 * Initialize all class-sessions sections on the page.
 */
function initClassSessions() {
  document.querySelectorAll('.js-class-sessions').forEach(setupClassSessions);
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('class-sessions', initClassSessions);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClassSessions);
} else {
  initClassSessions();
}
