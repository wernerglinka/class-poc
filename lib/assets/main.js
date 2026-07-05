/**
 * Page shell chrome scripts. These live with the shell templates in
 * layouts/pages/parts (not the component catalog), so the bundler no longer
 * discovers them as components. They are imported here into the base bundle.
 * All only attach DOMContentLoaded listeners, so load order does not matter.
 */
import '../layouts/pages/parts/header.js';
import '../layouts/pages/parts/navigation.js';
import '../layouts/pages/parts/navigation-active.js';

// Optional shell feature scripts, toggled by scripts/init-starter.mjs. Do not edit tagged lines by hand.
// feature-scripts
