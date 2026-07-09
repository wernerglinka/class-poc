/**
 * Center for People and Craft — Class Intake Builder (standalone).
 *
 * This file belongs to the STANDALONE Apps Script project ("CPC
 * Classes"), alongside cpc-web-app.gs. It contains only what must be
 * standalone: the one-time builder (it creates the form and the
 * spreadsheet, so it cannot be bound to them), the additive schema
 * migration, the weekly backups, and the test submitter.
 *
 * The form submission pipeline (handleFormSubmit and its helpers)
 * does NOT live here. It lives in the sheet-bound "Sheet review"
 * project (google-scripts/sheet-review/intake-pipeline.gs) so that
 * every write to the Offerings and Sessions sheets comes from one
 * project. Do not re-add pipeline functions here, and never install
 * a handleFormSubmit trigger from this project — that is how
 * submissions get normalized twice (or, worse, by stale code).
 *
 * The schema constants (QUESTIONS, OFFERING_COLUMNS, SESSION_COLUMNS)
 * are deliberately duplicated between this file and intake-pipeline.gs
 * because Apps Script projects cannot import from each other. When one
 * changes, change both, in the repo, and re-paste both projects.
 *
 * Setup and rebuild procedures live in docs/cpc-google-howto.md.
 */

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const PROTOTYPE_NAME = 'CPC Class Intake (Prototype)';

/**
 * Form question titles. The bound project's trigger reads submissions
 * via event.namedValues, which is keyed by these exact strings. This
 * copy MUST stay identical to QUESTIONS in intake-pipeline.gs; it is
 * used here to build the form and to fill the test submission.
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
  registrationUrl: 'Online registration URL',
  instructor2Name: 'Second instructor name',
  instructor2Bio: 'Second instructor bio',
  instructor2Links: 'Second instructor links (website, Instagram, ...)',
  instructor2Photo: 'Second instructor photo file name',
  ageAbilityNote: 'Age & ability notes',
  whatToBring: 'What to bring',
  accessibilityNote: 'Accessibility note'
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

/** MUST match SCHEDULE_TYPE_CHOICES in intake-pipeline.gs. */
const SCHEDULE_TYPE_CHOICES = ['sessions', 'recurring'];

/** MUST match REGISTRATION_TYPE_CHOICES in intake-pipeline.gs. */
const REGISTRATION_TYPE_CHOICES = ['online-registration', 'walk-in'];

/** MUST match RECURRING_DAY_CHOICES in intake-pipeline.gs. */
const RECURRING_DAY_CHOICES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

/**
 * Offerings sheet columns. MUST stay identical to OFFERING_COLUMNS in
 * intake-pipeline.gs (the bound project owns the writes; this copy
 * builds the sheet and drives migrateSheets).
 */
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
  'imageFolder',
  'registrationUrl',
  'submitterName',
  'submitterEmail',
  'submittedAt',
  'instructor2Name',
  'instructor2Bio',
  'instructor2Links',
  'instructor2Photo',
  'ageAbilityNote',
  'scheduleType',
  'recurringDay',
  'recurringStart',
  'recurringEnd',
  'recurringExceptions',
  'registrationType',
  'whatToBring',
  'accessibilityNote'
];

/** Sessions sheet columns. MUST match SESSION_COLUMNS in intake-pipeline.gs. */
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
 * Entry point. Creates the spreadsheet and the form, links the two,
 * and stores their IDs. Safe to inspect afterwards via the URLs
 * written to the log.
 *
 * NOTE: this deliberately does NOT install the form-submit trigger.
 * The intake pipeline lives in the sheet-bound project; after a
 * rebuild, paste the sheet-review files into the new spreadsheet's
 * bound project and run installIntakeTrigger there (see the rebuild
 * procedure in cpc-google-howto.md).
 */
function buildPrototype() {
  const spreadsheet = createPrototypeSpreadsheet();
  const form = createIntakeForm();

  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  storePrototypeIds(spreadsheet, form);

  Logger.log('Spreadsheet: %s', spreadsheet.getUrl());
  Logger.log('Form (edit): %s', form.getEditUrl());
  Logger.log('Form (live): %s', form.getPublishedUrl());
  Logger.log(
    'REMINDER: install the intake pipeline in the new spreadsheet\'s bound project (see rebuild procedure).'
  );
}

/**
 * Create the spreadsheet with the two normalized sheets and frozen
 * header rows. The form link adds its own "Form Responses" sheet.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The new spreadsheet
 */
function createPrototypeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.create(PROTOTYPE_NAME);

  createHeaderedSheet(spreadsheet, 'Offerings', OFFERING_COLUMNS);
  createHeaderedSheet(spreadsheet, 'Sessions', SESSION_COLUMNS);

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
  addParagraphQuestion(form, QUESTIONS.whatToBring, false);
  addSessionDateQuestions(form);
  addTimeQuestion(form, QUESTIONS.startTime, true);
  addTimeQuestion(form, QUESTIONS.endTime, true);
  addNumberQuestion(form, QUESTIONS.tuition, true);
  addNumberQuestion(form, QUESTIONS.materialsFee, true);
  addTextQuestion(form, QUESTIONS.materialsFeeNote, false, 'e.g. "Paid to instructor"');
  addNumberQuestion(form, QUESTIONS.minimumAge, false);
  addChoiceQuestion(form, QUESTIONS.abilityLevel, ABILITY_CHOICES, true);
  addTextQuestion(form, QUESTIONS.ageAbilityNote, false);
  addParagraphQuestion(form, QUESTIONS.accessibilityNote, false);
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
  addTextQuestion(form, QUESTIONS.instructor2Name, false, 'Only for classes with two instructors.');
  addParagraphQuestion(form, QUESTIONS.instructor2Bio, false);
  addTextQuestion(form, QUESTIONS.instructor2Links, false);
  addTextQuestion(form, QUESTIONS.instructor2Photo, false);
  addTextQuestion(
    form,
    QUESTIONS.registrationUrl,
    false,
    'Paste the full embed URL from the registration platform\'s embed ' +
      'dialog if it offers one; a plain campaign/event URL also works. ' +
      'Leave blank for walk-in classes.'
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
 * Remember the created document IDs so other functions (including
 * cpc-web-app.gs in this project) can find them.
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
/* Column validations                                                  */
/* ------------------------------------------------------------------ */

/**
 * Apply data-validation dropdowns to the enum columns of the live
 * Offerings sheet: scheduleType, registrationType, recurringDay, and
 * category. Values outside the list produce a warning, not a hard
 * reject, so legacy rows and edge cases stay editable. Idempotent;
 * run it once after migrateSheets adds the columns, and again after
 * any rebuild.
 */
function applyColumnValidations() {
  const spreadsheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('spreadsheetId')
  );
  const sheet = spreadsheet.getSheetByName('Offerings');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];

  const validations = {
    category: CATEGORY_CHOICES,
    abilityLevel: ABILITY_CHOICES,
    scheduleType: SCHEDULE_TYPE_CHOICES,
    registrationType: REGISTRATION_TYPE_CHOICES,
    recurringDay: RECURRING_DAY_CHOICES
  };

  Object.keys(validations).forEach((columnName) => {
    const columnIndex = headers.indexOf(columnName);
    if (columnIndex === -1) {
      Logger.log('Column "%s" not found; run migrateSheets first.', columnName);
      return;
    }
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(validations[columnName], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, columnIndex + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
    Logger.log('Validation applied to "%s".', columnName);
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
 * 1. Add the new question to the live form in the Forms editor (skip
 *    this step for sheet-only columns like imageFolder).
 * 2. Add the field to the constants here AND in the bound project's
 *    intake-pipeline.gs (QUESTIONS, OFFERING_COLUMNS or
 *    SESSION_COLUMNS, and buildOfferingRecord); re-paste both.
 * 3. Run this function once. It appends any missing columns to the
 *    live sheets. Existing rows keep all their data (including host
 *    signups) and show empty cells in the new column.
 *
 * Renaming or removing columns is NOT handled here; those are
 * destructive changes and still require the full rebuild, off-season.
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

/**
 * Read a sheet's header row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Source sheet
 * @returns {string[]} Header labels
 */
function readHeaderColumns(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
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
/* Test helper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Push a realistic multi-session test submission through the form so
 * the whole pipeline (form -> responses sheet -> bound trigger ->
 * normalized sheets) can be verified without typing anything by hand.
 * Delete the resulting rows (Offerings, Sessions, Form Responses)
 * after checking them.
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
    [QUESTIONS.whatToBring]: 'Closed-toe shoes; all tools are provided.',
    [QUESTIONS.tuition]: '225',
    [QUESTIONS.materialsFee]: '50',
    [QUESTIONS.materialsFeeNote]: 'Paid to instructor',
    [QUESTIONS.minimumAge]: '16',
    [QUESTIONS.abilityLevel]: 'Advanced beginner',
    [QUESTIONS.ageAbilityNote]: 'Some hand-tool experience helps but is not required.',
    [QUESTIONS.instructorName]: 'Jacob Mathioudis-Goudey',
    [QUESTIONS.instructorBio]:
      'Jacob is a woodworker and furniture maker located in Minneapolis. His ' +
      'work focuses on vernacular furniture forms.',
    [QUESTIONS.instructorLinks]: 'instagram.com/@jake.mg.furniture',
    [QUESTIONS.classImage]: 'side-table.jpg',
    [QUESTIONS.instructorPhoto]: 'jacob.jpg',
    [QUESTIONS.registrationUrl]: 'https://givebutter.com/example-staked-side-table'
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
