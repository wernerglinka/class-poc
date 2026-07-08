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
 * The section mapping mirrors the live CPC class page content
 * (modeled on Summer Herbs for Home Medicine), consolidated into a
 * hero plus three two-column multi-media sections: description beside
 * class details with the session/volunteer list, what to expect
 * beside the Givebutter registration embed with the org boilerplate
 * (accessibility, cancellation policy, from lib/data/cpc.json) as
 * disclosures beneath, and one photo-beside-bio section per
 * instructor (up to three, stacked with collapsed spacing).
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
const formatDate = (isoDate, formatOptions) => parseIsoDate(isoDate).toLocaleDateString('en-US', formatOptions);

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

  const weekdays = sessions.map((session) => formatDate(session.sessionDate, { weekday: 'long' }));
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
 * Build the class details from offering fields, as an unordered list
 * with one item per detail. Emitted as raw HTML rather than markdown
 * so the list carries the class-details-list class: the markdown
 * pipeline passes block-level HTML through untouched and has no
 * syntax for classing a list.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config from lib/data/cpc.json
 * @returns {string} HTML list
 */
export function buildDetailsProse(offering, cpcData) {
  const items = [];

  if (offering.tuition !== '') {
    items.push(`<strong>Tuition: $${offering.tuition}</strong> per participant`);
  }
  if (cpcData.scholarshipUrl) {
    items.push(`<a href="${cpcData.scholarshipUrl}"><strong>Apply for a scholarship</strong></a>`);
  }
  if (offering.materialsFee !== '' && Number(offering.materialsFee) > 0) {
    const note = offering.materialsFeeNote !== '' ? ` (${offering.materialsFeeNote})` : '';
    items.push(`<strong>Materials fee: $${offering.materialsFee}</strong>${note}`);
  }

  const ageAndAbility = [offering.minimumAge !== '' ? `${offering.minimumAge}+` : '', offering.abilityLevel]
    .filter((part) => part !== '')
    .join(', ');
  if (ageAndAbility !== '') {
    // The note can be several sentences (grip strength, injuries,
    // youth policy), so it gets its own line rather than the
    // parenthetical treatment of the materials fee note.
    const note = String(offering.ageAbilityNote ?? '').trim();
    items.push(`<strong>Age / Ability level:</strong> ${ageAndAbility}${note !== '' ? `<br>${note}` : ''}`);
  }

  if (items.length === 0) {
    return '';
  }

  return `<ul class="class-details-list">\n${items.map((item) => `  <li>${item}</li>`).join('\n')}\n</ul>`;
}

/**
 * Instructors per offering the intake form currently takes: most
 * classes have one, some two. Instructor 1 uses the original
 * unnumbered sheet fields (instructorName, instructorBio, ...);
 * additional instructors add numbered prefixes (instructor2Name,
 * ...). If the form ever grows a third set, name it instructor3Name
 * etc. and bump this constant - nothing else changes.
 */
const INSTRUCTOR_FIELD_COUNT = 2;

/**
 * Collect an offering's instructors from the sheet fields: the
 * unnumbered set for instructor 1, then the instructor2... and
 * instructor3... sets. An instructor exists when any of its fields
 * is non-empty.
 * @param {Object} offering - Offering record
 * @returns {{name: string, bio: string, links: string, photoUrl: string}[]} Instructors in form order
 */
export function extractInstructors(offering) {
  const field = (name) => String(offering[name] ?? '').trim();

  const instructors = [];
  for (let index = 1; index <= INSTRUCTOR_FIELD_COUNT; index += 1) {
    const prefix = index === 1 ? 'instructor' : `instructor${index}`;
    const instructor = {
      name: field(`${prefix}Name`),
      bio: field(`${prefix}Bio`),
      links: field(`${prefix}Links`),
      photoUrl: field(`${prefix}Photo`) || (index === 1 ? field('instructorPhotoUrl') : '')
    };
    if (Object.values(instructor).some((value) => value !== '')) {
      instructors.push(instructor);
    }
  }

  return instructors;
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
 * Extract the Givebutter widget element id from an embed URL. The
 * embed dialog's URL carries it as the gba_gb.element.id query
 * parameter; with it (plus the org's account id) the page can render
 * Givebutter's self-sizing widget instead of a fixed-height iframe.
 * @param {string} givebutterUrl - Raw Givebutter field value
 * @returns {string} Widget element id, or '' when absent/unusable
 */
export function extractGivebutterWidgetId(givebutterUrl) {
  const trimmed = String(givebutterUrl ?? '').trim();
  if (trimmed === '') {
    return '';
  }
  try {
    return new URL(trimmed).searchParams.get('gba_gb.element.id') ?? '';
  } catch (error) {
    return '';
  }
}

/**
 * The image folder for an offering. Preference order: the sheet's
 * imageFolder column (stamped by the intake trigger from the class
 * title, editable by the webmaster to shorten it or resolve a
 * collision), then the slugified class title for rows predating that
 * column. Givebutter slugs are deliberately NOT used here: they
 * proved non-unique in practice (campaigns get copied casually), and
 * the only unique part of a Givebutter URL is a random widget id,
 * which would make meaningless folder names.
 * @param {Object} offering - Offering record
 * @returns {string} Folder slug
 */
export function imageFolderSlug(offering) {
  const explicitFolder = slugify(offering.imageFolder ?? '');
  return explicitFolder !== '' ? explicitFolder : slugify(offering.classTitle);
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
 * ship broken image references. Also attaches the extracted
 * instructors array with each photo resolved the same way.
 * @param {Object} offering - Offering record (classImage, instructorPhotoN)
 * @param {Function} fileExists - (sitePath) => boolean for local paths
 * @param {Function} warn - Called with a message per missing file
 * @returns {Object} Offering with classImageUrl and instructors set
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
    instructors: extractInstructors(offering).map((instructor) => ({
      ...instructor,
      photoUrl: verify(instructor.photoUrl)
    }))
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
 * Build a text block in the shape the text partial renders.
 * @param {string} title - Block title ('' for none)
 * @param {string} prose - Markdown prose
 * @param {Object} [overrides] - Extra text fields (e.g. subTitle)
 * @returns {Object} Text block object
 */
const textBlock = (title, prose, overrides = {}) => ({
  leadIn: '',
  title,
  titleTag: 'h2',
  subTitle: '',
  prose,
  ...overrides
});

/**
 * Build a two-column multi-media section. The media slot (mediaText,
 * image, iframe, or givebutter widget) renders first; the text column
 * renders second and may carry CTAs, the interactive session list,
 * and disclosure disclosures.
 * @param {Object} spec - Section spec
 * @returns {Object} Section object
 */
const multiMediaSection = ({
  classes = '',
  id = '',
  mediaType,
  isReverse = false,
  text = textBlock('', ''),
  mediaText,
  image,
  iframe,
  givebutter,
  ctas = [],
  sessions,
  endpoint,
  sessionsTitle,
  disclosures,
  container = {}
}) => ({
  sectionType: 'multi-media',
  containerTag: 'section',
  classes,
  id,
  isDisabled: false,
  isReverse,
  containerFields: containerDefaults(container),
  mediaType,
  text,
  ctas,
  ...(mediaText !== undefined ? { mediaText } : {}),
  ...(image !== undefined ? { image } : {}),
  ...(iframe !== undefined ? { iframe } : {}),
  ...(givebutter !== undefined ? { givebutter } : {}),
  ...(sessions !== undefined ? { sessions, endpoint, sessionsTitle } : {}),
  ...(disclosures !== undefined ? { disclosures } : {})
});

/**
 * Build the details section: description on the left, class details
 * plus the interactive session/volunteer list on the right.
 * Server-rendered host state comes from the build; the session-list
 * partial's JS refreshes it at page load and handles signups.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config from lib/data/cpc.json
 * @param {string} apiUrl - Web app /exec URL
 * @returns {Object} Section object
 */
const detailsSection = (offering, cpcData, apiUrl) =>
  multiMediaSection({
    classes: 'class-details',
    id: 'sessions',
    mediaType: 'text',
    mediaText: textBlock('', offering.fullDescription),
    text: textBlock('Class details', buildDetailsProse(offering, cpcData)),
    ...(offering.sessions.length > 0
      ? {
          sessions: buildSessionItems(offering.sessions),
          endpoint: apiUrl,
          sessionsTitle: 'Dates'
        }
      : {})
  });

/**
 * Build the registration section: what to expect on the left with the
 * org boilerplate (accessibility, cancellation policy) as collapsed
 * disclosures beneath it, and the Givebutter embed on the right
 * (isReverse puts the media slot last).
 *
 * Prefers Givebutter's widget, which resizes to the form's native
 * height; it needs the widget element id (carried by the pasted embed
 * URL) and the org's account id from cpc.json. When either is missing
 * (a plain campaign URL, or an unconfigured account id) the section
 * falls back to the fixed-height iframe embed.
 * @param {Object} offering - Offering record
 * @param {Object} cpcData - Org config from lib/data/cpc.json
 * @param {string} embedUrl - Givebutter embed URL ('' for none)
 * @returns {Object} Section object
 */
const registrationSection = (offering, cpcData, embedUrl) => {
  const widgetId = extractGivebutterWidgetId(offering.givebutterUrl);
  const accountId = cpcData.givebutterAccountId ?? '';
  const useWidget = widgetId !== '' && accountId !== '';

  return multiMediaSection({
    classes: 'class-registration',
    id: 'register',
    mediaType: useWidget ? 'givebutter' : 'iframe',
    isReverse: true,
    text: textBlock('What to expect', offering.whatToExpect),
    disclosures: [
      { title: cpcData.accessibility.title, prose: cpcData.accessibility.prose },
      { title: cpcData.cancellationPolicy.title, prose: cpcData.cancellationPolicy.prose }
    ],
    ...(useWidget ? { givebutter: { accountId, widgetId } } : {}),
    ...(!useWidget && embedUrl !== ''
      ? { iframe: { src: embedUrl, title: 'Class registration form', allow: 'payment' } }
      : {})
  });
};

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
    // subTitle: buildScheduleLine(offering.sessions),
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
 * Build one section per instructor: photo on the left, bio on the
 * right, alternating sides per section (or a single text column when
 * there is no photo). The first section carries the heading (plural
 * when there is more than one); stacked sections drop the margins
 * between them (first: bottom only, middle: both, last: top only) so
 * the group reads as one block.
 * @param {Object} offering - Offering record
 * @returns {Object[]} Section objects, one per instructor
 */
const instructorSections = (offering) => {
  const instructors = offering.instructors ?? extractInstructors(offering);
  const lastIndex = instructors.length - 1;

  return instructors.map((instructor, index) =>
    multiMediaSection({
      classes: 'class-instructor',
      mediaType: instructor.photoUrl !== '' ? 'image' : 'text',
      isReverse: index % 2 === 1,
      ...(instructor.photoUrl !== ''
        ? { image: { src: instructor.photoUrl, alt: instructor.name, caption: '' } }
        : {}),
      text: textBlock(instructor.name, instructor.bio, {
        leadIn: index === 0 ? (lastIndex > 0 ? 'Meet your instructors' : 'Meet your instructor') : ''
      }),
      ctas: buildInstructorCtas(instructor.links),
      container: {
        noMargin: { top: index > 0, bottom: index < lastIndex }
      }
    })
  );
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

  sections.push(detailsSection(offering, cpcData, apiUrl));

  // Always present: even without an embed or what-to-expect prose,
  // the section carries the org's policy disclosures.
  sections.push(registrationSection(offering, cpcData, buildGivebutterEmbedUrl(offering.givebutterUrl)));

  sections.push(...instructorSections(offering));

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
  const instructors = offering.instructors ?? extractInstructors(offering);

  return {
    title: offering.classTitle,
    description: offering.shortSummary,
    // The time component makes date filters parse this as LOCAL
    // midnight; a bare ISO date parses as UTC and renders a day early
    // in US timezones.
    date: offering.firstSessionDate !== '' ? `${offering.firstSessionDate}T00:00:00` : '',
    author: instructors.map((instructor) => instructor.name).filter((name) => name !== ''),
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

  const plugin = (files, metalsmith, done) => {
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
      config.fileExists ?? ((sitePath) => existsSync(path.join(metalsmith.source(), sitePath.replace(/^\//, ''))));

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
