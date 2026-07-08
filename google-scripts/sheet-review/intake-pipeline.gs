/**
 * CPC Class Intake — form submission pipeline (sheet-bound).
 *
 * Moved from the standalone builder project so that ALL writes to the
 * Offerings and Sessions sheets live in one project: the form trigger
 * below and the review modal (review.gs) share the same writer
 * functions (appendObjectRow, ID generation, date/time normalizers).
 * The standalone project keeps only the one-time builder, schema
 * migration, and backups.
 *
 * Setup after pasting this file into the sheet-bound project:
 * 1. Run installIntakeTrigger once (grants Forms/Mail scopes).
 * 2. In the STANDALONE project, delete its handleFormSubmit trigger
 *    (Triggers panel), otherwise every submission is normalized twice.
 */

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/**
 * When set, every form submission triggers a notification email to
 * this address. Leave empty if the ClassIntakeTrigger.gs notification
 * (notifyRecipients script property) already covers this.
 */
const ADMIN_NOTIFICATION_EMAIL = '';

/**
 * Form question titles. The trigger reads submissions via
 * event.namedValues, which is keyed by these exact strings.
 */
const QUESTIONS = {
  submitterName: 'Your name',
  submitterEmail: 'Your email',
  classTitle: 'Class title',
  category: 'Category',
  shortSummary: 'Short summary (for the class listing page, 2-3 sentences)',
  fullDescription: 'Full description (for the class page)',
  whatToExpect: 'What to expect',
  startTime: 'Start time',
  endTime: 'End time',
  tuition: 'Tuition in USD (number only)',
  materialsFee: 'Materials fee in USD (number only, 0 if none)',
  materialsFeeNote: 'Materials fee note',
  minimumAge: 'Minimum age',
  abilityLevel: 'Ability level',
  instructorName: 'Instructor name',
  instructorBio: 'Instructor bio',
  instructorLinks: 'Instructor links (website, Instagram, ...)',
  classImage: 'Class image file name',
  instructorPhoto: 'Instructor photo file name',
  givebutterUrl: 'Givebutter registration URL'
};

/** Maximum sessions per offering (must match the form's date pickers). */
const SESSION_DATE_QUESTION_COUNT = 6;

/** Titles of the session date questions: "Session 1 date" ... */
const SESSION_DATE_QUESTIONS = Array.from(
  { length: SESSION_DATE_QUESTION_COUNT },
  (unused, index) => `Session ${index + 1} date`
);

const CATEGORY_CHOICES = [
  'Woodworking',
  'Fiber & Textile',
  'Foodways',
  'Herbalism & Foraging',
  'Music',
  'Movement',
  'Other'
];

const ABILITY_CHOICES = [
  'Beginner',
  'Advanced beginner',
  'Intermediate',
  'Advanced',
  'All levels'
];

const OFFERING_COLUMNS = [
  'offeringId',
  'status',
  'approved',
  'classTitle',
  'category',
  'shortSummary',
  'fullDescription',
  'whatToExpect',
  'tuition',
  'materialsFee',
  'materialsFeeNote',
  'minimumAge',
  'abilityLevel',
  'instructorName',
  'instructorBio',
  'instructorLinks',
  'classImage',
  'instructorPhoto',
  'givebutterUrl',
  'submitterName',
  'submitterEmail',
  'submittedAt'
];

const SESSION_COLUMNS = [
  'sessionId',
  'offeringId',
  'classTitle',
  'sessionDate',
  'sessionNumber',
  'sessionCount',
  'startTime',
  'endTime',
  'hostName',
  'hostEmail',
  'signedUpAt',
  'status'
];

/* ------------------------------------------------------------------ */
/* Trigger installation                                                */
/* ------------------------------------------------------------------ */

/**
 * Install the installable onFormSubmit trigger on THIS spreadsheet.
 * Idempotent: an existing handleFormSubmit trigger is replaced.
 * Run once by hand after pasting this file into the bound project.
 */
function installIntakeTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'handleFormSubmit')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('handleFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log('Intake trigger installed on this spreadsheet.');
}

/* ------------------------------------------------------------------ */
/* Submit trigger                                                      */
/* ------------------------------------------------------------------ */

/**
 * Installable onFormSubmit handler. Normalizes one form submission
 * into an Offerings row plus one Sessions row per session date.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} event - Form submit event
 */
function handleFormSubmit(event) {
  const rawAnswers = readAnswers(event.namedValues);
  const answers = {
    ...rawAnswers,
    startTime: parseTimeAnswer(rawAnswers.startTime),
    endTime: parseTimeAnswer(rawAnswers.endTime)
  };
  const sessionDates = readSessionDates(event.namedValues);
  const status = sessionDates.length > 0 ? 'open' : 'needs-review';

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const offeringsSheet = spreadsheet.getSheetByName('Offerings');
  const sessionsSheet = spreadsheet.getSheetByName('Sessions');

  const existingIds = readColumnValues(offeringsSheet, 1);
  const offeringId = createUniqueOfferingId(answers.classTitle, sessionDates[0], existingIds);

  appendObjectRow(offeringsSheet, buildOfferingRecord(offeringId, status, answers));

  buildSessionRecords(offeringId, answers, sessionDates).forEach((record) => {
    appendObjectRow(sessionsSheet, record);
  });

  notifyAdminOfSubmission(answers.classTitle, offeringId, spreadsheet.getUrl());
}

/**
 * Email the admin that a submission awaits review, if enabled.
 * @param {string} classTitle - Submitted class title
 * @param {string} offeringId - Stamped offering ID
 * @param {string} spreadsheetUrl - Link to the spreadsheet
 */
function notifyAdminOfSubmission(classTitle, offeringId, spreadsheetUrl) {
  if (ADMIN_NOTIFICATION_EMAIL === '') {
    return;
  }
  MailApp.sendEmail(
    ADMIN_NOTIFICATION_EMAIL,
    `CPC class submission awaiting review: ${classTitle}`,
    `A new offering was submitted (${offeringId}).\n\n` +
      `It will not appear on the website until you set its "approved" ` +
      `column to "yes" in the Offerings sheet:\n${spreadsheetUrl}`
  );
}

/* ------------------------------------------------------------------ */
/* Answer normalization                                                */
/* ------------------------------------------------------------------ */

/**
 * Flatten event.namedValues (question title -> array of answers) into
 * a record keyed by the QUESTIONS keys.
 * @param {Object<string, string[]>} namedValues - Raw submission values
 * @returns {Object<string, string>} Answers keyed by field name
 */
function readAnswers(namedValues) {
  return Object.keys(QUESTIONS).reduce((accumulator, fieldName) => {
    const rawValues = namedValues[QUESTIONS[fieldName]];
    const value = Array.isArray(rawValues) ? String(rawValues[0] ?? '').trim() : '';
    return { ...accumulator, [fieldName]: value };
  }, {});
}

/**
 * Collect the filled session date pickers into sorted, de-duplicated
 * ISO date strings.
 * @param {Object<string, string[]>} namedValues - Raw submission values
 * @returns {string[]} Sorted, de-duplicated ISO date strings
 */
function readSessionDates(namedValues) {
  const parsedDates = SESSION_DATE_QUESTIONS.map((title) => {
    const rawValues = namedValues[title];
    return parseDateAnswer(Array.isArray(rawValues) ? rawValues[0] : '');
  }).filter((isoDate) => isoDate !== null);

  return [...new Set(parsedDates)].sort();
}

/**
 * Normalize one date answer to an ISO date string. Accepts ISO
 * (YYYY-MM-DD, YYYY/MM/DD) and US (M/D/YYYY) forms.
 * @param {string} rawValue - Raw date answer
 * @returns {string|null} ISO date string, or null when blank/unparseable
 */
function parseDateAnswer(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (text.length === 0) {
    return null;
  }

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch !== null) {
    return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const usMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch !== null) {
    return toIsoDate(usMatch[3], usMatch[1], usMatch[2]);
  }

  return null;
}

/**
 * Assemble and validate an ISO date string from parts.
 * @param {string|number} year - Four-digit year
 * @param {string|number} month - Month (1-12)
 * @param {string|number} day - Day of month
 * @returns {string|null} Valid ISO date string or null
 */
function toIsoDate(year, month, day) {
  const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidIsoDate(candidate) ? candidate : null;
}

/**
 * Check that a string is a real calendar date in YYYY-MM-DD form.
 * @param {string} candidate - Candidate date string
 * @returns {boolean} True when the string is a valid ISO calendar date
 */
function isValidIsoDate(candidate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return false;
  }
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate;
}

/**
 * Normalize one time answer to 24h HH:MM. Accepts "18:00", "18:00:00",
 * "6:00 PM", and "6:00:00 PM". Unrecognized values are returned
 * unchanged so nothing is silently lost.
 * @param {string} rawValue - Raw time answer
 * @returns {string} Normalized HH:MM string, or the raw value
 */
function parseTimeAnswer(rawValue) {
  const text = String(rawValue ?? '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match === null) {
    return text;
  }

  const meridiem = match[3] === undefined ? null : match[3].toUpperCase();
  const rawHour = Number(match[1]);
  const hour =
    meridiem === 'PM' && rawHour !== 12
      ? rawHour + 12
      : meridiem === 'AM' && rawHour === 12
        ? 0
        : rawHour;

  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

/* ------------------------------------------------------------------ */
/* Offering and session records                                        */
/* ------------------------------------------------------------------ */

/**
 * Build a stable, human-readable offering ID: title slug plus first
 * session date, e.g. "staked-side-table-20260715".
 * @param {string} classTitle - Class title
 * @param {string|undefined} firstSessionDate - First ISO session date, if any
 * @returns {string} Offering ID
 */
function createOfferingId(classTitle, firstSessionDate) {
  const datePart =
    firstSessionDate !== undefined && firstSessionDate !== null && firstSessionDate !== ''
      ? firstSessionDate.replace(/-/g, '')
      : 'undated';
  return `${slugify(classTitle)}-${datePart}`;
}

/**
 * Make an offering ID unique against already-stored IDs by appending
 * a numeric suffix when needed.
 * @param {string} classTitle - Class title
 * @param {string|undefined} firstSessionDate - First ISO session date, if any
 * @param {string[]} existingIds - Offering IDs already in the sheet
 * @returns {string} Unique offering ID
 */
function createUniqueOfferingId(classTitle, firstSessionDate, existingIds) {
  const baseId = createOfferingId(classTitle, firstSessionDate);
  if (!existingIds.includes(baseId)) {
    return baseId;
  }
  let suffix = 2;
  while (existingIds.includes(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
}

/**
 * Convert a title to a URL-safe slug.
 * @param {string} text - Input text
 * @returns {string} Lowercase, hyphen-separated slug
 */
function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the Offerings record for one form submission.
 * @param {string} offeringId - Unique offering ID
 * @param {string} status - "open" or "needs-review"
 * @param {Object<string, string>} answers - Flattened form answers
 * @returns {Object<string, string>} Record keyed by OFFERING_COLUMNS names
 */
function buildOfferingRecord(offeringId, status, answers) {
  return {
    offeringId: offeringId,
    status: status,
    approved: '',
    classTitle: answers.classTitle,
    category: answers.category,
    shortSummary: answers.shortSummary,
    fullDescription: answers.fullDescription,
    whatToExpect: answers.whatToExpect,
    tuition: answers.tuition,
    materialsFee: answers.materialsFee,
    materialsFeeNote: answers.materialsFeeNote,
    minimumAge: answers.minimumAge,
    abilityLevel: answers.abilityLevel,
    instructorName: answers.instructorName,
    instructorBio: answers.instructorBio,
    instructorLinks: answers.instructorLinks,
    classImage: answers.classImage,
    instructorPhoto: answers.instructorPhoto,
    givebutterUrl: answers.givebutterUrl,
    submitterName: answers.submitterName,
    submitterEmail: answers.submitterEmail,
    submittedAt: new Date().toISOString()
  };
}

/**
 * Build one Sessions record per session date (uniform times, as
 * submitted through the form).
 * @param {string} offeringId - Parent offering ID
 * @param {Object<string, string>} answers - Flattened form answers
 * @param {string[]} sessionDates - Sorted ISO session dates
 * @returns {Object<string, string|number>[]} Records keyed by SESSION_COLUMNS names
 */
function buildSessionRecords(offeringId, answers, sessionDates) {
  return sessionDates.map((sessionDate, index) =>
    buildSessionRecord(offeringId, answers.classTitle, {
      sessionDate: sessionDate,
      sessionNumber: index + 1,
      sessionCount: sessionDates.length,
      startTime: answers.startTime,
      endTime: answers.endTime
    })
  );
}

/**
 * Build a single Sessions record. Shared by the form trigger and the
 * review modal so both write paths produce identical rows.
 * @param {string} offeringId - Parent offering ID
 * @param {string} classTitle - Denormalized class title
 * @param {{sessionDate: string, sessionNumber: number, sessionCount: number,
 *          startTime: string, endTime: string}} session - Session facts
 * @returns {Object<string, string|number>} Record keyed by SESSION_COLUMNS names
 */
function buildSessionRecord(offeringId, classTitle, session) {
  return {
    sessionId: `${offeringId}-s${session.sessionNumber}`,
    offeringId: offeringId,
    classTitle: classTitle,
    sessionDate: session.sessionDate,
    sessionNumber: session.sessionNumber,
    sessionCount: session.sessionCount,
    startTime: session.startTime,
    endTime: session.endTime,
    hostName: '',
    hostEmail: '',
    signedUpAt: '',
    status: 'open'
  };
}

/* ------------------------------------------------------------------ */
/* Sheet primitives                                                    */
/* ------------------------------------------------------------------ */

/**
 * Append a record to a sheet, placing each value under its named
 * header column. The row is formatted as plain text BEFORE the values
 * are written so Sheets stores exactly what was produced (ISO dates,
 * 24h times) instead of coercing them into locale-formatted cells.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target sheet
 * @param {Object<string, string|number>} record - Record keyed by column name
 */
function appendObjectRow(sheet, record) {
  const headers = readHeaderColumns(sheet);
  const rowIndex = sheet.getLastRow() + 1;
  const rowRange = sheet.getRange(rowIndex, 1, 1, headers.length);
  rowRange.setNumberFormat('@');
  rowRange.setValues([headers.map((columnName) => record[columnName] ?? '')]);
}

/**
 * Read a sheet's header row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Source sheet
 * @returns {string[]} Header labels
 */
function readHeaderColumns(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
}

/**
 * Read all values from one column, skipping the header row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Source sheet
 * @param {number} columnIndex - 1-based column index
 * @returns {string[]} Cell values as strings
 */
function readColumnValues(sheet, columnIndex) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  return sheet
    .getRange(2, columnIndex, lastRow - 1, 1)
    .getValues()
    .map((row) => String(row[0]));
}
