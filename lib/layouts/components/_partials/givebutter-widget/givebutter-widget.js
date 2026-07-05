/**
 * givebutter-widget
 * Loads Givebutter's widget script on pages that contain a widget.
 *
 * The script defines the <givebutter-widget> custom element and
 * resizes the embedded form to its native height as donors move
 * through checkout. It reads the account id from its own script URL
 * (?acct=...), which is why the tag is built here from the widget
 * wrapper's data attribute instead of being hard-coded in a layout.
 */

const WIDGET_SCRIPT_URL = 'https://widgets.givebutter.com/latest.umd.cjs';

/**
 * Inject Givebutter's widget script once, when the page has a widget.
 */
function initGivebutterWidgets() {
  const wrapper = document.querySelector('.js-givebutter-widget[data-account]');
  if (wrapper === null || wrapper.dataset.account === '') {
    return;
  }
  if (document.querySelector(`script[src^="${WIDGET_SCRIPT_URL}"]`) !== null) {
    return;
  }

  const tag = document.createElement('script');
  tag.src = `${WIDGET_SCRIPT_URL}?acct=${encodeURIComponent(wrapper.dataset.account)}&p=other`;
  tag.async = true;
  document.head.appendChild(tag);
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('givebutter-widget', initGivebutterWidgets);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGivebutterWidgets);
} else {
  initGivebutterWidgets();
}
