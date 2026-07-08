/**
 * CPC Class Intake — review edit modal.
 *
 * Opens a large modal dialog over the spreadsheet for editing the currently
 * selected offering row. Replaces the row-viewer sidebar: same read/write
 * pattern, different UI surface.
 *
 * The form is driven by FIELD_CONFIG below. Each entry maps a column header
 * (matched by prefix, longest match wins) to an input type and optional
 * label and suggestions. Headers without a matching entry render as plain
 * text inputs, so new form questions appear in the modal without any
 * markup changes.
 */

// The reviewer-facing sheet. Form Responses 1 is form-owned and never
// touched by hand; Offerings is where review, edits, and highlighting live.
const SHEET_NAME = 'Offerings';
const DIALOG_WIDTH = 1300;
const DIALOG_HEIGHT = 850;

/**
 * Field configuration, matched against column headers by prefix.
 *
 * Types: readonly | text | textarea | number | date | time | email | url
 * `options` renders a datalist — suggestions the reviewer can pick from
 * but is never locked into.
 *
 * @type {Array<{match: string, type: string, label?: string, options?: string[]}>}
 */
const FIELD_CONFIG = [
  { match: 'Timestamp', type: 'readonly' },
  { match: 'Your name', type: 'text', label: 'Class owner name' },
  { match: 'Your email', type: 'email', label: 'Class owner email' },
  { match: 'Class title', type: 'text' },
  {
    match: 'Category',
    type: 'text',
    options: ['Herbalism & Foraging', 'Woodworking', 'Fiber Arts', 'Ceramics'],
  },
  { match: 'Short summary', type: 'textarea', label: 'Short summary (listing page)' },
  { match: 'Full description', type: 'textarea', label: 'Full description (class page)' },
  { match: 'What to expect', type: 'textarea' },
  { match: 'Session', type: 'date' },
  { match: 'Start time', type: 'time' },
  { match: 'End time', type: 'time' },
  { match: 'Tuition in USD', type: 'number', label: 'Tuition (USD)' },
  { match: 'Materials fee in USD', type: 'number', label: 'Materials fee (USD)' },
  { match: 'Minimum age', type: 'number' },
  {
    match: 'Ability level',
    type: 'text',
    options: ['Beginner', 'Intermediate', 'Advanced', 'All levels'],
  },
  { match: 'Instructor bio', type: 'textarea' },
  { match: 'Instructor links', type: 'textarea' },
  { match: 'Second instructor bio', type: 'textarea' },
  { match: 'Second instructor links', type: 'textarea' },
  { match: 'Givebutter', type: 'url', label: 'Givebutter registration URL' },
  { match: 'Age & ability notes', type: 'textarea' },
  { match: 'Note for the announcement', type: 'textarea', label: 'Announcement email note' },
];

/**
 * Add the Review menu.
 * If you already have an onOpen with a Review menu, merge these items into it.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Review')
    .addItem('Open edit modal', 'openEditModal')
    .addItem('Refresh expired highlights', 'highlightExpiredClasses')
    .addSeparator()
    .addItem('Publish site', 'publishSite')
    .addToUi();

  highlightExpiredClasses();
}

const EXPIRED_BACKGROUND = '#fce8e6';

/**
 * Highlight rows whose class is over — at least one session date exists
 * and all of them are in the past. Expired rows get a light red
 * background so the reviewer can decide: leave the row as history or
 * clear its approved cell.
 *
 * Runs on open and from Review > Refresh expired highlights. Rows that
 * no longer qualify (dates corrected in the modal, new sessions added)
 * are reset to the default background on the next run. Note this pass
 * owns data-row backgrounds: manual cell coloring will be wiped.
 */
function highlightExpiredClasses() {
  const sheet = getIntakeSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return;
  }

  const headers = getHeaders(sheet);
  const sessionColumnIndexes = headers.reduce(
    (indexes, header, index) => (header.startsWith('Session') ? [...indexes, index] : indexes),
    []
  );

  const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const rows = dataRange.getValues();
  const today = startOfToday();

  const backgrounds = rows.map((row) => {
    const background = isClassExpired(row, sessionColumnIndexes, today)
      ? EXPIRED_BACKGROUND
      : null;
    return headers.map(() => background);
  });

  dataRange.setBackgrounds(backgrounds);
}

/**
 * Decide whether a class is expired.
 *
 * @param {Array<*>} row - Raw cell values for one data row
 * @param {number[]} sessionColumnIndexes - 0-based indexes of Session date columns
 * @param {Date} today - Start of today
 * @returns {boolean} True when every session date is before today
 */
function isClassExpired(row, sessionColumnIndexes, today) {
  const sessionDates = sessionColumnIndexes
    .map((index) => row[index])
    .filter((value) => value instanceof Date);

  if (sessionDates.length === 0) {
    return false;
  }

  return sessionDates.every((date) => date.getTime() < today.getTime());
}

/**
 * Start of today in the script's timezone.
 *
 * @returns {Date} Today at 00:00
 */
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Trigger a Netlify rebuild via the build hook.
 * Menu handler for Review > Publish site.
 *
 * The hook URL lives in Script Properties (key: NETLIFY_BUILD_HOOK,
 * set under Project Settings > Script Properties), not in code, so the
 * repo copy of this file stays safe to publish.
 */
function publishSite() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const hookUrl = PropertiesService.getScriptProperties().getProperty('NETLIFY_BUILD_HOOK');

  if (!hookUrl) {
    SpreadsheetApp.getUi().alert(
      'No build hook configured. Add NETLIFY_BUILD_HOOK under ' +
        'Extensions > Apps Script > Project Settings > Script Properties.'
    );
    return;
  }

  const response = UrlFetchApp.fetch(hookUrl, {
    method: 'post',
    payload: '',
    muteHttpExceptions: true,
  });

  const succeeded = response.getResponseCode() >= 200 && response.getResponseCode() < 300;
  const message = succeeded
    ? 'Build triggered — the site rebuilds in a minute or two.'
    : `Build hook failed (HTTP ${response.getResponseCode()}).`;

  spreadsheet.toast(message, 'Publish site', 8);
}

/**
 * Open the edit modal for the currently selected row.
 * Menu handler for Review > Open edit modal.
 */
function openEditModal() {
  const userInterface = SpreadsheetApp.getUi();
  const sheet = getIntakeSheet();
  const rowNumber = sheet.getActiveCell().getRow();

  if (rowNumber < 2) {
    userInterface.alert('Select a cell in a data row first (row 2 or below).');
    return;
  }

  const payload = buildPayload(sheet, rowNumber);
  const template = HtmlService.createTemplateFromFile('edit-modal');
  // Escape "<" so the JSON can never terminate the <script> block early.
  template.payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');

  const dialog = template.evaluate().setWidth(DIALOG_WIDTH).setHeight(DIALOG_HEIGHT);
  userInterface.showModalDialog(dialog, buildDialogTitle(payload));
}

/**
 * Write edited values back to the sheet.
 * Called from the dialog via google.script.run. Only changed fields arrive
 * here; each is written to its own cell so untouched cells keep their
 * underlying values and formatting.
 *
 * @param {number} rowNumber - 1-based sheet row to update
 * @param {Object<string, string>} changedValuesByHeader - Header → new display value
 * @returns {{updated: number}} Count of cells written
 */
function saveRow(rowNumber, changedValuesByHeader) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    const sheet = getIntakeSheet();
    const headers = getHeaders(sheet);

    const updatedCount = Object.keys(changedValuesByHeader).reduce((count, header) => {
      const columnIndex = headers.indexOf(header);
      if (columnIndex === -1) {
        return count;
      }
      sheet.getRange(rowNumber, columnIndex + 1).setValue(changedValuesByHeader[header]);
      return count + 1;
    }, 0);

    return { updated: updatedCount };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Build the data payload the dialog renders from.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Intake sheet
 * @param {number} rowNumber - 1-based sheet row
 * @returns {{rowNumber: number, fields: Array<Object>}} Dialog payload
 */
function buildPayload(sheet, rowNumber) {
  const headers = getHeaders(sheet);
  const displayValues = sheet.getRange(rowNumber, 1, 1, headers.length).getDisplayValues()[0];

  const fields = headers.map((header, index) => {
    const config = findFieldConfig(header);
    return {
      header,
      label: config.label ?? header,
      type: config.type,
      options: config.options ?? null,
      value: displayValues[index],
    };
  });

  return { rowNumber, fields };
}

/**
 * Find the config entry for a header, longest prefix match first.
 * Falls back to a plain text input for unconfigured headers.
 *
 * @param {string} header - Column header from row 1
 * @returns {{match?: string, type: string, label?: string, options?: string[]}} Config entry
 */
function findFieldConfig(header) {
  const matches = FIELD_CONFIG.filter((entry) => header.startsWith(entry.match));

  if (matches.length === 0) {
    return { type: 'text' };
  }

  return matches.reduce((longest, entry) =>
    entry.match.length > longest.match.length ? entry : longest
  );
}

/**
 * Build the dialog title from the class title field.
 *
 * @param {{rowNumber: number, fields: Array<Object>}} payload - Dialog payload
 * @returns {string} Dialog title
 */
function buildDialogTitle(payload) {
  const titleField = payload.fields.find((field) => field.header.startsWith('Class title'));
  const classTitle = titleField?.value || 'untitled class';
  return `Edit: ${classTitle} (row ${payload.rowNumber})`;
}

/**
 * Get the intake sheet, failing loudly if it was renamed.
 *
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Intake sheet
 */
function getIntakeSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found — was it renamed?`);
  }
  return sheet;
}

/**
 * Read the header row.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Intake sheet
 * @returns {string[]} Column headers
 */
function getHeaders(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((header) => String(header));
}
