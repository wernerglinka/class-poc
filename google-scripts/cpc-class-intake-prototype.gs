/**
 * Center for People and Craft — Class Intake Prototype
 * =====================================================
 *
 * Creates the class-owner intake Google Form, a linked test spreadsheet,
 * and the onFormSubmit trigger that normalizes each submission into the
 * sheets the static site will consume at build time.
 *
 * Data model
 * ----------
 * A form submission describes one OFFERING (a scheduled instance of a
 * class). The trigger expands it into:
 *
 *   Offerings — one row per offering, holds all prose and fees.
 *   Sessions  — one row per dated session, keyed to its offering.
 *               Each session needs exactly one volunteer host, so the
 *               host columns (hostName, hostEmail, signedUpAt) live
 *               directly on the session row: empty means the slot is
 *               open. The future signup web app (doPost) fills them,
 *               and the class page reads them at load time (doGet).
 *
 * Org-wide boilerplate (accessibility text, cancellation policy,
 * location, scholarship link) intentionally lives in the site repo
 * config, not in this spreadsheet.
 *
 * Setup
 * -----
 * 1. Go to https://script.google.com and create a new project.
 * 2. Replace the default Code.gs content with this file.
 * 3. Run `buildPrototype` once. Grant the requested permissions.
 * 4. Open the View > Logs (or Executions) panel for the spreadsheet
 *    and form URLs.
 * 5. Optionally run `submitTestOffering` to push a realistic test
 *    submission through the whole pipeline.
 *
 * Notes
 * -----
 * - Session dates and start/end times use native Forms picker widgets.
 *   Because a date item holds exactly one date, the form offers
 *   SESSION_DATE_QUESTION_COUNT optional date pickers; the trigger
 *   collects whichever are filled.
 * - Picker answers arrive in the trigger as locale-formatted strings.
 *   The normalizers below accept ISO (YYYY-MM-DD) and US (M/D/YYYY)
 *   date forms plus 12h and 24h time forms. If the form owner's locale
 *   ever differs, extend parseDateAnswer accordingly.
 * - Images travel outside this pipeline by design: instructors email
 *   image files to the webmaster and enter only the FILE NAMES in the
 *   form. The webmaster commits the files to the site repo under
 *   /assets/images/classes/<givebutter-campaign-slug>/, where the
 *   build picks them up. (FormApp cannot create file-upload questions
 *   programmatically, and a manual upload question would force
 *   respondents to sign in to Google.)
 * - The Sessions/Offerings sheets are the editable store. Corrections
 *   after submission happen there. A submitted form cannot be edited
 *   or resubmitted; a second submission only creates a duplicate.
 * - ADDING a field mid-season does NOT require a rebuild: edit the
 *   live form, update the constants here, and run migrateSheets (see
 *   its docs below). Only renames and removals need the full rebuild.
 */

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const PROTOTYPE_NAME = 'CPC Class Intake (Prototype)';

/**
 * When set, every form submission triggers a notification email to
 * this address asking for review, with a link to the spreadsheet.
 * Leave empty to disable notifications.
 */
const ADMIN_NOTIFICATION_EMAIL = '';

/**
 * Form question titles. The trigger reads submissions via
 * event.namedValues, which is keyed by these exact strings, so they
 * are defined once here and used both when building the form and when
 * reading responses.
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

/**
 * Maximum sessions per offering. A Forms date item holds exactly one
 * date, so the form offers this many optional pickers. The current
 * catalog tops out at three sessions; six leaves headroom.
 */
const SESSION_DATE_QUESTION_COUNT = 6;

/**
 * Titles of the session date questions: "Session 1 date" ... "Session
 * N date". Only the first is required.
 */
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
/* One-time builder                                                    */
/* ------------------------------------------------------------------ */

/**
 * Entry point. Creates the spreadsheet, the form, links the two,
 * prepares the normalized sheets, and installs the submit trigger.
 * Safe to inspect afterwards via the URLs written to the log.
 */
function buildPrototype() {
  const spreadsheet = createPrototypeSpreadsheet();
  const form = createIntakeForm();

  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  installSubmitTrigger(spreadsheet);
  storePrototypeIds(spreadsheet, form);

  Logger.log('Spreadsheet: %s', spreadsheet.getUrl());
  Logger.log('Form (edit): %s', form.getEditUrl());
  Logger.log('Form (live): %s', form.getPublishedUrl());
}

/**
 * Create the test spreadsheet with the three normalized sheets and
 * frozen header rows.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The new spreadsheet
 */
function createPrototypeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.create(PROTOTYPE_NAME);

  createHeaderedSheet(spreadsheet, 'Offerings', OFFERING_COLUMNS);
  createHeaderedSheet(spreadsheet, 'Sessions', SESSION_COLUMNS);

  // Remove the default empty sheet; the form link adds its own
  // "Form Responses" sheet later.
  const defaultSheet = spreadsheet.getSheetByName('Sheet1');
  if (defaultSheet !== null) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  return spreadsheet;
}

/**
 * Add a sheet with a bold, frozen header row.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - Target spreadsheet
 * @param {string} name - Sheet name
 * @param {string[]} columns - Header labels
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The new sheet
 */
function createHeaderedSheet(spreadsheet, name, columns) {
  const sheet = spreadsheet.insertSheet(name);
  sheet.getRange(1, 1, 1, columns.length).setValues([columns]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

/**
 * Create the intake form with all questions and input validation.
 * @returns {GoogleAppsScript.Forms.Form} The new form
 */
function createIntakeForm() {
  const form = FormApp.create(PROTOTYPE_NAME)
    .setDescription(
      'Submit one scheduled offering of a class. Multi-session classes ' +
        '(e.g. three Wednesdays) are ONE submission — fill in one date ' +
        'picker per session. Corrections after submission are made by ' +
        'the site admin, so email us; please do not fill out the form ' +
        'a second time.'
    )
    .setCollectEmail(false);

  addTextQuestion(form, QUESTIONS.submitterName, true);
  addTextQuestion(form, QUESTIONS.submitterEmail, true);
  addTextQuestion(form, QUESTIONS.classTitle, true);
  addChoiceQuestion(form, QUESTIONS.category, CATEGORY_CHOICES, true);
  addParagraphQuestion(form, QUESTIONS.shortSummary, true);
  addParagraphQuestion(form, QUESTIONS.fullDescription, true);
  addParagraphQuestion(form, QUESTIONS.whatToExpect, false);
  addSessionDateQuestions(form);
  addTimeQuestion(form, QUESTIONS.startTime, true);
  addTimeQuestion(form, QUESTIONS.endTime, true);
  addNumberQuestion(form, QUESTIONS.tuition, true);
  addNumberQuestion(form, QUESTIONS.materialsFee, true);
  addTextQuestion(form, QUESTIONS.materialsFeeNote, false, 'e.g. "Paid to instructor"');
  addNumberQuestion(form, QUESTIONS.minimumAge, false);
  addChoiceQuestion(form, QUESTIONS.abilityLevel, ABILITY_CHOICES, true);
  addTextQuestion(form, QUESTIONS.instructorName, true);
  addParagraphQuestion(form, QUESTIONS.instructorBio, false);
  addTextQuestion(form, QUESTIONS.instructorLinks, false);
  addTextQuestion(
    form,
    QUESTIONS.classImage,
    false,
    'e.g. "my-class.jpg". Email the image itself to the webmaster; enter only its file name here.'
  );
  addTextQuestion(
    form,
    QUESTIONS.instructorPhoto,
    false,
    'e.g. "jane-doe.jpg". Email the photo to the webmaster; enter only its file name here.'
  );
  addTextQuestion(
    form,
    QUESTIONS.givebutterUrl,
    false,
    'Paste the full embed URL from Givebutter\'s embed dialog (it contains "/embed/" and an element id). A plain campaign URL also works.'
  );

  return form;
}

/**
 * Add the session date pickers. Only the first is required; the rest
 * are left blank for single-session classes.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 */
function addSessionDateQuestions(form) {
  SESSION_DATE_QUESTIONS.forEach((title, index) => {
    const item = form.addDateItem().setTitle(title).setRequired(index === 0);
    item.setHelpText(
      index === 0
        ? 'First (or only) session date.'
        : 'Leave blank if the class has fewer sessions.'
    );
  });
}

/**
 * Add a time picker question.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 * @param {string} title - Question title
 * @param {boolean} required - Whether an answer is required
 */
function addTimeQuestion(form, title, required) {
  form.addTimeItem().setTitle(title).setRequired(required);
}

/**
 * Add a short-text question.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 * @param {string} title - Question title
 * @param {boolean} required - Whether an answer is required
 * @param {string} [helpText] - Optional help text
 */
function addTextQuestion(form, title, required, helpText) {
  const item = form.addTextItem().setTitle(title).setRequired(required);
  if (helpText !== undefined) {
    item.setHelpText(helpText);
  }
}

/**
 * Add a paragraph question.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 * @param {string} title - Question title
 * @param {boolean} required - Whether an answer is required
 */
function addParagraphQuestion(form, title, required) {
  form.addParagraphTextItem().setTitle(title).setRequired(required);
}

/**
 * Add a short-text question that must be a non-negative number.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 * @param {string} title - Question title
 * @param {boolean} required - Whether an answer is required
 */
function addNumberQuestion(form, title, required) {
  const validation = FormApp.createTextValidation()
    .setHelpText('Enter a number, e.g. 64')
    .requireNumberGreaterThanOrEqualTo(0)
    .build();
  form.addTextItem().setTitle(title).setRequired(required).setValidation(validation);
}

/**
 * Add a multiple-choice question.
 * @param {GoogleAppsScript.Forms.Form} form - Target form
 * @param {string} title - Question title
 * @param {string[]} choices - Choice labels
 * @param {boolean} required - Whether an answer is required
 */
function addChoiceQuestion(form, title, choices, required) {
  form.addMultipleChoiceItem().setTitle(title).setChoiceValues(choices).setRequired(required);
}

/**
 * Install the installable onFormSubmit trigger on the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - Linked spreadsheet
 */
function installSubmitTrigger(spreadsheet) {
  ScriptApp.newTrigger('handleFormSubmit').forSpreadsheet(spreadsheet).onFormSubmit().create();
}

/**
 * Remember the created document IDs so other functions can find them.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The spreadsheet
 * @param {GoogleAppsScript.Forms.Form} form - The form
 */
function storePrototypeIds(spreadsheet, form) {
  PropertiesService.getScriptProperties().setProperties({
    spreadsheetId: spreadsheet.getId(),
    formId: form.getId()
  });
}

/* ------------------------------------------------------------------ */
/* Live schema migration (additive changes without data loss)          */
/* ------------------------------------------------------------------ */

/**
 * Bring the live spreadsheet's columns up to date with the column
 * constants above, WITHOUT touching existing data. Run this after
 * adding a field mid-season instead of rebuilding:
 *
 * 1. Add the new question to the live form in the Forms editor.
 * 2. Add the field to QUESTIONS, OFFERING_COLUMNS (or
 *    SESSION_COLUMNS), and buildOfferingRecord above; also add it to
 *    createIntakeForm so future rebuilds match.
 * 3. Save, then run this function once. It appends any missing
 *    columns to the live sheets. Existing rows keep all their data
 *    (including host signups) and show empty cells in the new column.
 *
 * Because appendObjectRow writes by header name, column order never
 * matters. Renaming or removing columns is NOT handled here; those
 * are destructive changes and still require the full rebuild, ideally
 * off-season.
 */
function migrateSheets() {
  const spreadsheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('spreadsheetId')
  );
  syncSheetColumns(spreadsheet.getSheetByName('Offerings'), OFFERING_COLUMNS);
  syncSheetColumns(spreadsheet.getSheetByName('Sessions'), SESSION_COLUMNS);
}

/**
 * Append columns that exist in the column constants but not yet in
 * the live sheet, and log anything unexpected the other way around.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Live sheet
 * @param {string[]} columns - Expected column names
 */
function syncSheetColumns(sheet, columns) {
  const headers = readHeaderColumns(sheet);

  const missingInSheet = columns.filter((columnName) => !headers.includes(columnName));
  missingInSheet.forEach((columnName) => {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(columnName).setFontWeight('bold');
    Logger.log('%s: added column "%s"', sheet.getName(), columnName);
  });

  const unknownInSheet = headers.filter((header) => !columns.includes(header));
  unknownInSheet.forEach((header) => {
    Logger.log(
      '%s: column "%s" exists in the sheet but not in the script; left untouched (rename/removal needs a rebuild)',
      sheet.getName(),
      header
    );
  });

  if (missingInSheet.length === 0 && unknownInSheet.length === 0) {
    Logger.log('%s: columns already in sync', sheet.getName());
  }
}

/* ------------------------------------------------------------------ */
/* Backups                                                             */
/* ------------------------------------------------------------------ */

/**
 * Drive folder that receives the weekly spreadsheet copies. Created
 * automatically on the first backup run.
 */
const BACKUP_FOLDER_NAME = 'CPC Class Data Backups';

/**
 * How many backup copies to keep. Older copies are trashed on each
 * run, so the folder never grows past this count. Eight weekly
 * copies is roughly two months of history.
 */
const BACKUP_RETENTION_COUNT = 8;

/**
 * One-time setup: install the weekly backup trigger (Mondays between
 * 4 and 5 am, script time zone). Safe to run repeatedly; an existing
 * backup trigger is replaced, never duplicated. Run it again after a
 * full rebuild, because the rebuild procedure deletes all triggers.
 *
 * The first run prompts for Drive permission (the backup copies live
 * in Drive); this is a one-time re-authorization.
 */
function installBackupTrigger() {
  removeBackupTriggers();
  ScriptApp.newTrigger('backupSpreadsheet')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(4)
    .create();
  Logger.log('Weekly backup trigger installed (Mondays 4-5am, %s).', Session.getScriptTimeZone());
}

/**
 * Delete any existing triggers pointing at backupSpreadsheet, so
 * installBackupTrigger stays idempotent.
 */
function removeBackupTriggers() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'backupSpreadsheet')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

/**
 * Copy the live spreadsheet into the backup folder and prune old
 * copies. Runs weekly via the installed trigger; can also be run by
 * hand from the function dropdown before anything risky. Reads the
 * spreadsheet ID from Script Properties at run time, so it follows a
 * rebuilt spreadsheet automatically.
 */
function backupSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheetId');
  const backupFolder = findOrCreateBackupFolder();
  const dateStamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  DriveApp.getFileById(spreadsheetId).makeCopy(`${PROTOTYPE_NAME} backup ${dateStamp}`, backupFolder);
  const removedCount = pruneOldBackups(backupFolder);
  Logger.log('Backup created (%s); pruned %s old cop%s.', dateStamp, removedCount, removedCount === 1 ? 'y' : 'ies');
}

/**
 * Find the backup folder in Drive, creating it on first use.
 * @returns {GoogleAppsScript.Drive.Folder} The backup folder
 */
function findOrCreateBackupFolder() {
  const matches = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  return matches.hasNext() ? matches.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
}

/**
 * Trash all but the newest BACKUP_RETENTION_COUNT files in the backup
 * folder. Only touches files inside that folder.
 * @param {GoogleAppsScript.Drive.Folder} backupFolder - Folder to prune
 * @returns {number} How many old copies were trashed
 */
function pruneOldBackups(backupFolder) {
  const files = [];
  const iterator = backupFolder.getFiles();
  while (iterator.hasNext()) {
    files.push(iterator.next());
  }

  const expired = files
    .sort((first, second) => second.getDateCreated() - first.getDateCreated())
    .slice(BACKUP_RETENTION_COUNT);

  expired.forEach((file) => file.setTrashed(true));
  return expired.length;
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

  const spreadsheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('spreadsheetId')
  );
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
 * Email the admin that a submission awaits review, if notifications
 * are enabled via ADMIN_NOTIFICATION_EMAIL.
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
 * Normalize one date picker answer to an ISO date string. Picker
 * answers arrive as locale-formatted strings; this accepts ISO
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
 * Normalize one time picker answer to 24h HH:MM. Accepts "18:00",
 * "18:00:00", "6:00 PM", and "6:00:00 PM". Unrecognized values are
 * returned unchanged so nothing is silently lost.
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

/**
 * Build a stable, human-readable offering ID: title slug plus first
 * session date, e.g. "staked-side-table-20260715".
 * @param {string} classTitle - Class title
 * @param {string|undefined} firstSessionDate - First ISO session date, if any
 * @returns {string} Offering ID
 */
function createOfferingId(classTitle, firstSessionDate) {
  const datePart = firstSessionDate !== undefined ? firstSessionDate.replace(/-/g, '') : 'undated';
  return `${slugify(classTitle)}-${datePart}`;
}

/**
 * Make an offering ID unique against already-stored IDs by appending
 * a numeric suffix when needed (covers e.g. Wednesday and Thursday
 * groups of the same class starting the same week, or resubmissions).
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
 * Build the Offerings record for one submission.
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
 * Build one Sessions record per session date.
 * @param {string} offeringId - Parent offering ID
 * @param {Object<string, string>} answers - Flattened form answers
 * @param {string[]} sessionDates - Sorted ISO session dates
 * @returns {Object<string, string|number>[]} Records keyed by SESSION_COLUMNS names
 */
function buildSessionRecords(offeringId, answers, sessionDates) {
  return sessionDates.map((sessionDate, index) => ({
    sessionId: `${offeringId}-s${index + 1}`,
    offeringId: offeringId,
    classTitle: answers.classTitle,
    sessionDate: sessionDate,
    sessionNumber: index + 1,
    sessionCount: sessionDates.length,
    startTime: answers.startTime,
    endTime: answers.endTime,
    hostName: '',
    hostEmail: '',
    signedUpAt: '',
    status: 'open'
  }));
}

/**
 * Append a record to a sheet, placing each value under its named
 * header column. Being header-driven (rather than positional) means
 * columns can be added to a live sheet without misaligning writes;
 * see migrateSheets below.
 *
 * The row is formatted as plain text BEFORE the values are written so
 * Sheets stores exactly what the trigger produced (ISO dates like
 * "2026-07-15", 24h times like "18:00") instead of coercing them into
 * locale-formatted date and time cells. The build-time fetcher then
 * reads back the same unambiguous strings that were written.
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

/* ------------------------------------------------------------------ */
/* Test helper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Push a realistic multi-session test submission through the form so
 * the whole pipeline (form -> responses sheet -> trigger -> normalized
 * sheets) can be verified without typing anything by hand.
 */
function submitTestOffering() {
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('formId'));

  const textAnswers = {
    [QUESTIONS.submitterName]: 'Jacob Mathioudis-Goudey',
    [QUESTIONS.submitterEmail]: 'jacob@example.com',
    [QUESTIONS.classTitle]: 'Staked Side Table (Wednesday Group)',
    [QUESTIONS.category]: 'Woodworking',
    [QUESTIONS.shortSummary]:
      'A perfect companion when you are sitting and carving, knitting, or ' +
      'sipping your morning coffee. Learn the fundamental skills of staked furniture.',
    [QUESTIONS.fullDescription]:
      'In this class, we will make a staked side table. Through this project ' +
      'we cover all of the fundamental skills of staked furniture, and how ' +
      'these skills can be used to make a world of other pieces for your home.',
    [QUESTIONS.whatToExpect]: 'A fundamental woodworking class with hand tools.',
    [QUESTIONS.tuition]: '225',
    [QUESTIONS.materialsFee]: '50',
    [QUESTIONS.materialsFeeNote]: 'Paid to instructor',
    [QUESTIONS.minimumAge]: '16',
    [QUESTIONS.abilityLevel]: 'Advanced beginner',
    [QUESTIONS.instructorName]: 'Jacob Mathioudis-Goudey',
    [QUESTIONS.instructorBio]:
      'Jacob is a woodworker and furniture maker located in Minneapolis. His ' +
      'work focuses on vernacular furniture forms.',
    [QUESTIONS.instructorLinks]: 'instagram.com/@jake.mg.furniture',
    [QUESTIONS.classImage]: 'side-table.jpg',
    [QUESTIONS.instructorPhoto]: 'jacob.jpg',
    [QUESTIONS.givebutterUrl]: 'https://givebutter.com/example-staked-side-table'
  };

  // Months are zero-based in the Date constructor: 6 = July.
  const dateAnswers = {
    [SESSION_DATE_QUESTIONS[0]]: new Date(2026, 6, 15),
    [SESSION_DATE_QUESTIONS[1]]: new Date(2026, 6, 22),
    [SESSION_DATE_QUESTIONS[2]]: new Date(2026, 6, 29)
  };

  const timeAnswers = {
    [QUESTIONS.startTime]: [18, 0],
    [QUESTIONS.endTime]: [21, 0]
  };

  const response = form.createResponse();
  form.getItems().forEach((item) => {
    const title = item.getTitle();
    const itemType = item.getType();

    if (itemType === FormApp.ItemType.TEXT && textAnswers[title] !== undefined) {
      response.withItemResponse(item.asTextItem().createResponse(textAnswers[title]));
    } else if (itemType === FormApp.ItemType.PARAGRAPH_TEXT && textAnswers[title] !== undefined) {
      response.withItemResponse(item.asParagraphTextItem().createResponse(textAnswers[title]));
    } else if (itemType === FormApp.ItemType.MULTIPLE_CHOICE && textAnswers[title] !== undefined) {
      response.withItemResponse(item.asMultipleChoiceItem().createResponse(textAnswers[title]));
    } else if (itemType === FormApp.ItemType.DATE && dateAnswers[title] !== undefined) {
      response.withItemResponse(item.asDateItem().createResponse(dateAnswers[title]));
    } else if (itemType === FormApp.ItemType.TIME && timeAnswers[title] !== undefined) {
      const [hour, minute] = timeAnswers[title];
      response.withItemResponse(item.asTimeItem().createResponse(hour, minute));
    }
  });
  response.submit();

  Logger.log('Test submission sent. Check the Offerings and Sessions sheets.');
}
