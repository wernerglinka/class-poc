/**
 * @fileoverview Metalsmith plugin that generates one structured-content
 * page per CPC class offering.
 *
 * Runs after metalsmith-cpc-classes has attached the offerings to
 * global metadata. For each offering it creates a virtual source file
 * (classes/<offeringId>.md) whose frontmatter-equivalent metadata is a
 * `sections` array in the starter's structured-content format. The
 * pages then flow through the normal pipeline: permalinks, the
 * sections renderer, and the component bundler treat them exactly like
 * hand-written pages.
 *
 * The section mapping mirrors the live CPC class page structure
 * (modeled on Summer Herbs for Home Medicine): hero with title and
 * schedule, description, class details, what to expect, session list,
 * org boilerplate (accessibility, cancellation policy) from
 * lib/data/cpc.json, and an instructor block.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { existsSync } from 'node:fs';
import path from 'node:path';

const PLUGIN_NAME = 'metalsmith-cpc-class-pages';

/**
 * @typedef {Object} Options
 * @property {string} [metadataKey] - Metadata key holding the offerings
 * @property {string} [pathPrefix] - Directory for generated pages
 * @property {string} [layout] - Layout for generated pages
 */

/**
 * Default plugin options
 * @type {Object}
 */
export const defaultOptions = {
  metadataKey: 'classes',
  pathPrefix: 'classes',
  layout: 'pages/sections.njk',
  // Web app /exec URL used by the class-sessions component in the
  // browser (public availability reads and signup writes). This is
  // the public endpoint, not a secret; the build token never appears
  // in generated pages.
  apiUrl: '',
  // Injectable local-file check for tests; the plugin defaults to
  // checking the Metalsmith source tree.
  fileExists: undefined
};

/* ------------------------------------------------------------------ */
/* Formatting helpers (pure)                                           */
/* ------------------------------------------------------------------ */

/**
 * Convert a 24h time string to 12h display form.
 * @param {string} time - Time as "HH:MM"
 * @returns {string} Display time like "6:00 PM", or the input when unparseable
 */
export function formatTime(time) {
  const match = String(time ?? '').match(/^(\d{1,2}):(\d{2})$/);
  if (match === null) {
    return String(time ?? '');
  }
  const hour = Number(match[1]);
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${match[2]} ${meridiem}`;
}

/**
 * Parse an ISO date string as a local date.
 * @param {string} isoDate - Date as "YYYY-MM-DD"
 * @returns {Date} Date object
 */
const parseIsoDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

/**
 * Format one ISO date for display.
 * @param {string} isoDate - Date as "YYYY-MM-DD"
 * @param {Object} formatOptions - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
const formatDate = (isoDate, formatOptions) =>
  parseIsoDate(isoDate).toLocaleDateString('en-US', formatOptions);

/**
 * Build the human-readable schedule line for an offering, in the style
 * of the live CPC site. Single session: "Friday, July 10, 2026: 1:00 PM
 * - 4:00 PM". Multiple sessions on the same weekday: "Wednesdays, July
 * 15, 22, 29: 6:00 PM - 9:00 PM". Mixed weekdays fall back to a short
 * date list.
 * @param {{sessionDate: string, startTime: string, endTime: string}[]} sessions - Session records
 * @returns {string} Schedule line, or '' when there are no sessions
 */
export function buildScheduleLine(sessions) {
  if (sessions.length === 0) {
    return '';
  }

  const times = `${formatTime(sessions[0].startTime)} - ${formatTime(sessions[0].endTime)}`;

  if (sessions.length === 1) {
    const fullDate = formatDate(sessions[0].sessionDate, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    return `${fullDate}: ${times}`;
  }

  const weekdays = sessions.map((session) =>
    formatDate(session.sessionDate, { weekday: 'long' })
  );
  const sameWeekday = weekdays.every((weekday) => weekday === weekdays[0]);

  if (sameWeekday) {
    const months = sessions.map((session) => formatDate(session.sessionDate, { month: 'long' }));
    const dayList = sessions
      .map((session, index) => {
        const day = parseIsoDate(session.sessionDate).getDate();
        const needsMonth = index === 0 || months[index] !== months[index - 1];
        return needsMonth ? `${months[index]} ${day}` : String(day);
      })
      .join(', ');
    return `${weekdays[0]}s, ${dayList}: ${times}`;
  }

  const dateList = sessions
    .map((session) => formatDate(session.sessionDate, { month: 'short', day: 'numeric' }))
    .join(', ');
  return `${dateList}: ${times}`;
}

/**
 * Build the class details prose (markdown) from offering fields.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config from lib/data/cpc.json
 * @returns {string} Markdown prose
 */
export function buildDetailsProse(offering, cpcData) {
  const lines = [];

  if (offering.tuition !== '') {
    lines.push(`**Tuition: $${offering.tuition}** per participant`);
  }
  if (cpcData.scholarshipUrl) {
    lines.push(`[**Apply for a scholarship**](${cpcData.scholarshipUrl})`);
  }
  if (offering.materialsFee !== '' && Number(offering.materialsFee) > 0) {
    const note = offering.materialsFeeNote !== '' ? ` (${offering.materialsFeeNote})` : '';
    lines.push(`**Materials fee: $${offering.materialsFee}**${note}`);
  }

  const ageAndAbility = [
    offering.minimumAge !== '' ? `${offering.minimumAge}+` : '',
    offering.abilityLevel
  ]
    .filter((part) => part !== '')
    .join(', ');
  if (ageAndAbility !== '') {
    lines.push(`**Age / Ability level:** ${ageAndAbility}`);
  }

  return lines.join('\n\n');
}

/**
 * Build the display items the class-sessions component renders: one
 * per session, carrying the sessionId the signup write needs plus
 * preformatted date and time strings. Host privacy: only a hosted
 * flag is emitted, never a name.
 * @param {Object[]} sessions - Session records
 * @returns {Object[]} Session display items
 */
export function buildSessionItems(sessions) {
  return sessions.map((session) => ({
    sessionId: session.sessionId,
    dateDisplay: formatDate(session.sessionDate, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    timeDisplay: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
    hosted: String(session.hostName ?? '').trim() !== ''
  }));
}

/**
 * Turn the free-text instructor links field into CTA button objects.
 * The form collects links as loose text ("website, Instagram, ..."),
 * so this splits on commas and whitespace, ensures a protocol, and
 * derives a readable label from the hostname.
 * @param {string} instructorLinks - Raw links field
 * @returns {Object[]} CTA objects for the ctas partial
 */
export function buildInstructorCtas(instructorLinks) {
  return String(instructorLinks ?? '')
    .split(/[,\s]+/)
    .map((link) => link.trim())
    .filter((link) => link !== '')
    .map((link) => {
      const url = /^https?:\/\//.test(link) ? link : `https://${link}`;
      return {
        url,
        label: labelForLink(url),
        isButton: true,
        buttonStyle: 'primary'
      };
    });
}

/**
 * Derive a human-readable button label from a link.
 * Known platforms get their name; everything else gets the bare
 * hostname.
 * @param {string} url - Normalized URL
 * @returns {string} Button label
 */
function labelForLink(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
  if (hostname.includes('instagram.com')) {
    return 'Instagram';
  }
  if (hostname.includes('facebook.com')) {
    return 'Facebook';
  }
  if (hostname.includes('youtube.com')) {
    return 'YouTube';
  }
  return hostname;
}

/**
 * Convert text to a URL-safe slug (same rules as the intake trigger's
 * offering IDs).
 * @param {string} text - Input text
 * @returns {string} Lowercase, hyphen-separated slug
 */
export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract the Givebutter campaign slug from a campaign or embed URL.
 * "https://givebutter.com/summer-herbs" and
 * "https://givebutter.com/embed/c/summer-herbs?..." both yield
 * "summer-herbs".
 * @param {string} givebutterUrl - Raw Givebutter field value
 * @returns {string} Campaign slug, or '' when absent/unusable
 */
export function extractGivebutterSlug(givebutterUrl) {
  const trimmed = String(givebutterUrl ?? '').trim();
  if (trimmed === '') {
    return '';
  }
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter((segment) => segment !== '');
    if (segments[0] === 'embed' && segments[1] === 'c') {
      return segments[2] ?? '';
    }
    return segments[0] ?? '';
  } catch (error) {
    return '';
  }
}

/**
 * The image folder for an offering: the Givebutter campaign slug when
 * one exists (the canonical identifier across systems), otherwise the
 * slugified class title.
 * @param {Object} offering - Offering record
 * @returns {string} Folder slug
 */
export function imageFolderSlug(offering) {
  const campaignSlug = extractGivebutterSlug(offering.givebutterUrl);
  return campaignSlug !== '' ? campaignSlug : slugify(offering.classTitle);
}

/**
 * Resolve an image field value to a site path. Bare file names (the
 * normal case: instructors email images to the webmaster, who commits
 * them to the repo) resolve to
 * /assets/images/classes/<folderSlug>/<fileName>. Values that already
 * look like paths or URLs pass through untouched.
 * @param {string} imageValue - File name, path, or URL from the sheet
 * @param {string} folderSlug - Offering's image folder slug
 * @returns {string} Site path, URL, or '' when empty
 */
export function resolveImagePath(imageValue, folderSlug) {
  const trimmed = String(imageValue ?? '').trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed.includes('/')) {
    return trimmed;
  }
  return `/assets/images/classes/${folderSlug}/${trimmed}`;
}

/**
 * Resolve an offering's image fields to site paths and drop any local
 * image whose file has not arrived in the repo yet, so pages never
 * ship broken image references.
 * @param {Object} offering - Offering record (classImage, instructorPhoto)
 * @param {Function} fileExists - (sitePath) => boolean for local paths
 * @param {Function} warn - Called with a message per missing file
 * @returns {Object} Offering with classImageUrl/instructorPhotoUrl set
 */
export function resolveOfferingImages(offering, fileExists, warn) {
  const folderSlug = imageFolderSlug(offering);

  const verify = (imageValue) => {
    const resolved = resolveImagePath(imageValue, folderSlug);
    if (resolved.startsWith('/assets/') && !fileExists(resolved)) {
      warn(`${PLUGIN_NAME}: image not found in repo, omitting: ${resolved} (${offering.offeringId})`);
      return '';
    }
    return resolved;
  };

  return {
    ...offering,
    classImageUrl: verify(offering.classImage ?? offering.classImageUrl),
    instructorPhotoUrl: verify(offering.instructorPhoto ?? offering.instructorPhotoUrl)
  };
}

/**
 * Derive the Givebutter embed URL from the offering's Givebutter field.
 *
 * Class owners should paste the full embed URL from Givebutter's embed
 * dialog (e.g. "https://givebutter.com/embed/c/summer-herbs?goalBar=
 * false&gba_gb.element.id=gGRrMX"); such URLs pass through untouched,
 * preserving the per-embed element id. A plain campaign URL
 * ("https://givebutter.com/summer-herbs") is converted to its embed
 * form as a fallback, without an element id.
 * @param {string} givebutterUrl - Raw Givebutter field value
 * @returns {string} Embed URL, or '' when unusable
 */
export function buildGivebutterEmbedUrl(givebutterUrl) {
  const trimmed = String(givebutterUrl ?? '').trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed.includes('/embed/')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');
    return slug === '' ? '' : `https://givebutter.com/embed/c/${slug}?goalBar=false`;
  } catch (error) {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/* Section builders (pure)                                             */
/* ------------------------------------------------------------------ */

/**
 * Shared container defaults so every generated section satisfies the
 * sections renderer.
 * @param {Object} overrides - Per-section container settings
 * @returns {Object} containerFields object
 */
const containerDefaults = (overrides = {}) => ({
  inContainer: true,
  isAnimated: false,
  noMargin: { top: false, bottom: false },
  noPadding: { top: false, bottom: false },
  background: { isDark: false, color: '', image: '', imageScreen: 'none' },
  ...overrides
});

/**
 * Build a rich-text section.
 * @param {string} title - Section title ('' for none)
 * @param {string} prose - Markdown prose
 * @param {string} [classes] - Extra CSS classes
 * @returns {Object} Section object
 */
const richTextSection = (title, prose, classes = '') => ({
  sectionType: 'rich-text',
  containerTag: 'section',
  classes,
  id: '',
  isDisabled: false,
  containerFields: containerDefaults(),
  text: { leadIn: '', title, titleTag: 'h2', subTitle: '', prose },
  ctas: []
});

/**
 * Build the interactive sessions section. Server-rendered host state
 * comes from the build; the component's JS refreshes it at page load
 * and handles volunteer signups.
 * @param {Object} offering - Offering record
 * @param {string} apiUrl - Web app /exec URL
 * @returns {Object} Section object
 */
const classSessionsSection = (offering, apiUrl) => ({
  sectionType: 'class-sessions',
  containerTag: 'section',
  classes: '',
  id: 'sessions',
  isDisabled: false,
  containerFields: containerDefaults(),
  text: {
    leadIn: '',
    title: 'Sessions and volunteer hosts',
    titleTag: 'h2',
    subTitle: '',
    prose: ''
  },
  endpoint: apiUrl,
  sessions: buildSessionItems(offering.sessions)
});

/**
 * Build the Givebutter registration embed section.
 * @param {string} embedUrl - Givebutter embed URL
 * @returns {Object} Section object
 */
const givebutterSection = (embedUrl) => ({
  sectionType: 'givebutter-embed',
  containerTag: 'section',
  classes: 'class-registration',
  id: 'register',
  isDisabled: false,
  containerFields: containerDefaults(),
  text: { leadIn: '', title: 'Register', titleTag: 'h2', subTitle: '', prose: '' },
  embedUrl
});

/**
 * Build the hero section for an offering.
 * @param {Object} offering - Offering record
 * @returns {Object} Section object
 */
const heroSection = (offering) => ({
  sectionType: 'hero',
  containerTag: 'section',
  classes: 'first-section class-hero',
  id: '',
  isDisabled: false,
  isFullScreen: false,
  isReverse: false,
  containerFields: containerDefaults({
    inContainer: false,
    background: {
      isDark: offering.classImageUrl !== '',
      color: '',
      image: offering.classImageUrl,
      imageScreen: offering.classImageUrl !== '' ? 'dark' : 'none'
    }
  }),
  text: {
    leadIn: offering.category,
    title: offering.classTitle,
    titleTag: 'h1',
    subTitle: buildScheduleLine(offering.sessions),
    prose: offering.shortSummary
  },
  // With an embed on the page the hero CTA scrolls to it; otherwise
  // it links out to the Givebutter campaign page.
  ctas: offering.givebutterUrl
    ? [
        {
          url: buildGivebutterEmbedUrl(offering.givebutterUrl) !== '' ? '#register' : offering.givebutterUrl,
          label: 'Register',
          isButton: true,
          buttonStyle: 'primary'
        }
      ]
    : [],
  image: { src: '', alt: '', caption: '' }
});

/**
 * Build the instructor section: photo column plus bio column, or a
 * single text column when there is no photo.
 * @param {Object} offering - Offering record
 * @returns {Object} Section object
 */
const instructorSection = (offering) => {
  const textColumnBlocks = [
    {
      text: {
        leadIn: '',
        title: 'Meet your instructor',
        titleTag: 'h2',
        subTitle: offering.instructorName,
        prose: offering.instructorBio
      }
    }
  ];

  const instructorCtas = buildInstructorCtas(offering.instructorLinks);
  if (instructorCtas.length > 0) {
    textColumnBlocks.push({ ctas: instructorCtas });
  }

  const textColumn = { column: null, columnClasses: 'text flow', blocks: textColumnBlocks };

  const columns =
    offering.instructorPhotoUrl !== ''
      ? [
          {
            column: null,
            columnClasses: 'image',
            blocks: [
              {
                image: {
                  src: offering.instructorPhotoUrl,
                  alt: offering.instructorName,
                  caption: ''
                }
              }
            ]
          },
          textColumn
        ]
      : [textColumn];

  return {
    sectionType: 'columns',
    containerTag: 'section',
    classes: 'class-instructor',
    id: '',
    isDisabled: false,
    containerFields: containerDefaults(),
    contentClasses: '',
    columns
  };
};

/**
 * Build the full sections array for one offering.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config from lib/data/cpc.json
 * @param {string} [apiUrl] - Web app /exec URL for the sessions component
 * @returns {Object[]} Sections in page order
 */
export function buildSections(offering, cpcData, apiUrl = '') {
  const sections = [heroSection(offering)];

  if (offering.fullDescription !== '') {
    sections.push(richTextSection('', offering.fullDescription, 'class-description'));
  }

  sections.push(richTextSection('Class details', buildDetailsProse(offering, cpcData), 'class-details'));

  const embedUrl = buildGivebutterEmbedUrl(offering.givebutterUrl);
  if (embedUrl !== '') {
    sections.push(givebutterSection(embedUrl));
  }

  if (offering.whatToExpect !== '') {
    sections.push(richTextSection('What to expect', offering.whatToExpect, 'class-expectations'));
  }

  if (offering.sessions.length > 0) {
    sections.push(classSessionsSection(offering, apiUrl));
  }

  sections.push(richTextSection(cpcData.accessibility.title, cpcData.accessibility.prose, 'class-boilerplate'));
  sections.push(
    richTextSection(cpcData.cancellationPolicy.title, cpcData.cancellationPolicy.prose, 'class-boilerplate')
  );
  sections.push(instructorSection(offering));

  return sections;
}

/**
 * Build the collection card for an offering. The card is what the
 * collection-list section renders on the classes landing page, via
 * the collection-card partial.
 * @param {Object} offering - Offering record
 * @returns {Object} Card object
 */
export function buildCard(offering) {
  return {
    title: offering.classTitle,
    description: offering.shortSummary,
    // The time component makes date filters parse this as LOCAL
    // midnight; a bare ISO date parses as UTC and renders a day early
    // in US timezones.
    date: offering.firstSessionDate !== '' ? `${offering.firstSessionDate}T00:00:00` : '',
    author: offering.instructorName !== '' ? [offering.instructorName] : [],
    thumbnail: offering.classImageUrl
  };
}

/**
 * Build the complete virtual file object for one offering.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config
 * @param {Options} config - Merged plugin options
 * @returns {Object} Metalsmith file object
 */
export function buildPageFile(offering, cpcData, config) {
  return {
    contents: Buffer.from(''),
    layout: config.layout,
    bodyClasses: 'class-page',
    hasHero: true,
    offering,
    card: buildCard(offering),
    seo: {
      title: `${offering.classTitle} | ${cpcData.organization}`,
      description: offering.shortSummary
    },
    sections: buildSections(offering, cpcData, config.apiUrl)
  };
}

/* ------------------------------------------------------------------ */
/* Plugin factory                                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate one structured-content page per offering.
 *
 * @param {Options} options - Plugin options
 * @returns {import('metalsmith').Plugin} Metalsmith plugin function
 */
export default function cpcClassPages(options = {}) {
  const config = { ...defaultOptions, ...options };

  const plugin = function (files, metalsmith, done) {
    const debug = metalsmith.debug(PLUGIN_NAME);
    const metadata = metalsmith.metadata();
    const offerings = metadata[config.metadataKey];
    const cpcData = metadata.data?.cpc;

    if (!Array.isArray(offerings)) {
      done(new Error(`${PLUGIN_NAME}: no offerings found at metadata key "${config.metadataKey}"`));
      return;
    }
    if (cpcData === undefined) {
      done(new Error(`${PLUGIN_NAME}: org config missing, expected lib/data/cpc.json`));
      return;
    }

    // Local image paths are verified against the source tree so pages
    // never ship broken references; missing files warn loudly because
    // the fix (committing the emailed image) is the webmaster's job.
    const fileExists =
      config.fileExists ??
      ((sitePath) => existsSync(path.join(metalsmith.source(), sitePath.replace(/^\//, ''))));

    for (const offering of offerings) {
      const resolvedOffering = resolveOfferingImages(offering, fileExists, console.warn);
      const filePath = `${config.pathPrefix}/${offering.offeringId}.md`;
      files[filePath] = buildPageFile(resolvedOffering, cpcData, config);
      debug('generated %s', filePath);
    }

    debug('generated %d class pages', offerings.length);
    done();
  };

  Object.defineProperty(plugin, 'name', {
    value: 'cpcClassPages',
    configurable: true
  });

  return plugin;
}
