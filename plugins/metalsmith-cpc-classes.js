/**
 * @fileoverview Metalsmith plugin that fetches CPC class data from the
 * Google Apps Script web app and attaches it to global metadata.
 *
 * The web app serves the private Google Spreadsheet as JSON. With a
 * valid build token it returns every approved offering with its
 * sessions nested inside (see docs/theory-of-operation.md). This
 * plugin fetches that payload, validates its shape, sorts offerings by
 * their first session date, and stores the result in global metadata
 * where templates can consume it.
 *
 * Watch-mode note: Metalsmith reuses plugin instances across rebuilds,
 * and an Apps Script round trip costs one to two seconds. The
 * `ttlSeconds` option caches the payload inside the plugin closure so
 * file-save rebuilds stay fast. Set it to 0 (the default) to fetch
 * fresh on every build, which is what production builds want.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

const PLUGIN_NAME = 'metalsmith-cpc-classes';

/**
 * @typedef {Object} Options
 * @property {string} apiUrl - The web app /exec URL
 * @property {string} token - Build token granting the full payload
 * @property {string} [metadataKey] - Metadata key to attach offerings to
 * @property {number} [ttlSeconds] - Cache lifetime across watch rebuilds
 * @property {number} [requestTimeoutMs] - Fetch timeout
 * @property {Function} [fetchImplementation] - Injectable fetch for testing
 */

/**
 * Default plugin options
 * @type {Object}
 */
export const defaultOptions = {
  metadataKey: 'classes',
  ttlSeconds: 0,
  requestTimeoutMs: 15000
};

/**
 * Validate required options, throwing with a descriptive message.
 * @param {Options} options - Merged options
 */
export function validateOptions(options) {
  if (typeof options.apiUrl !== 'string' || options.apiUrl.length === 0) {
    throw new Error(`${PLUGIN_NAME}: apiUrl option is required (the web app /exec URL)`);
  }
  if (typeof options.token !== 'string' || options.token.length === 0) {
    throw new Error(`${PLUGIN_NAME}: token option is required (set CPC_SHEET_TOKEN in the environment)`);
  }
}

/**
 * Find the earliest session date of an offering.
 * @param {{sessions: {sessionDate: string}[]}} offering - Offering record
 * @returns {string} ISO date string, or '' when the offering has no sessions
 */
export function findFirstSessionDate(offering) {
  return offering.sessions.reduce(
    (earliest, session) =>
      earliest === '' || session.sessionDate < earliest ? session.sessionDate : earliest,
    ''
  );
}

/**
 * Validate the API payload and normalize it for template consumption:
 * every offering gets a sessions array and a firstSessionDate, and the
 * list is sorted by that date ascending (dateless offerings last).
 * @param {*} payload - Parsed response body
 * @returns {Object[]} Normalized, sorted offerings
 */
export function normalizeOfferings(payload) {
  if (payload === null || typeof payload !== 'object' || !Array.isArray(payload.offerings)) {
    throw new Error(`${PLUGIN_NAME}: unexpected payload shape, expected { offerings: [...] }`);
  }

  return payload.offerings
    .map((offering) => {
      const sessions = Array.isArray(offering.sessions) ? offering.sessions : [];
      return {
        ...offering,
        sessions,
        firstSessionDate: findFirstSessionDate({ sessions })
      };
    })
    .sort((left, right) => {
      if (left.firstSessionDate === right.firstSessionDate) {
        return 0;
      }
      if (left.firstSessionDate === '') {
        return 1;
      }
      if (right.firstSessionDate === '') {
        return -1;
      }
      return left.firstSessionDate < right.firstSessionDate ? -1 : 1;
    });
}

/**
 * Fetch the full class payload from the web app.
 * This is a network boundary: failures throw with context and fail the
 * build, because a class site built without class data is worse than a
 * failed build.
 * @param {Options} config - Merged options
 * @returns {Promise<Object>} Parsed JSON payload
 */
async function fetchPayload(config) {
  const fetchImplementation = config.fetchImplementation ?? fetch;
  const url = `${config.apiUrl}?token=${encodeURIComponent(config.token)}`;

  const response = await fetchImplementation(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(config.requestTimeoutMs)
  });

  if (!response.ok) {
    throw new Error(`${PLUGIN_NAME}: HTTP ${response.status} from class data endpoint`);
  }

  return response.json();
}

/**
 * Fetch CPC class data and attach it to global metadata.
 *
 * @param {Options} options - Plugin options
 * @returns {import('metalsmith').Plugin} Metalsmith plugin function
 */
export default function cpcClasses(options = {}) {
  const config = { ...defaultOptions, ...options };
  validateOptions(config);

  /**
   * Payload cache shared across watch-mode rebuilds.
   * @type {{offerings: Object[], expiresAt: number}|null}
   */
  let cache = null;

  const plugin = async (_files, metalsmith) => {
    const debug = metalsmith.debug(PLUGIN_NAME);

    if (cache !== null && Date.now() < cache.expiresAt) {
      debug('using cached class data (%d offerings)', cache.offerings.length);
      metalsmith.metadata()[config.metadataKey] = cache.offerings;
      return;
    }

    debug('fetching class data from %s', config.apiUrl);
    const payload = await fetchPayload(config);
    const offerings = normalizeOfferings(payload);

    cache = { offerings, expiresAt: Date.now() + config.ttlSeconds * 1000 };
    metalsmith.metadata()[config.metadataKey] = offerings;
    debug('fetched %d offerings', offerings.length);
  };

  Object.defineProperty(plugin, 'name', {
    value: 'cpcClasses',
    configurable: true
  });

  return plugin;
}
