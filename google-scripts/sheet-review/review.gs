/**
 * CPC Class Intake — review tools (sheet-bound).
 *
 * Reviewer-facing UX on top of the normalized Offerings and Sessions
 * sheets: a full-screen edit modal (edit-modal.html), new-class
 * creation through the same modal, expired-class highlighting, and
 * the Netlify publish hook.
 *
 * All writes go through the shared writers in intake-pipeline.gs
 * (appendObjectRow, buildSessionRecord, ID generation, normalizers),
 * so the form trigger and the modal produce identical rows.
 */

const OFFERINGS_SHEET_NAME = 'Offerings';
const SESSIONS_SHEET_NAME = 'Sessions';
const DIALOG_WIDTH = 1300;
const DIALOG_HEIGHT = 850;
const EXPIRED_BACKGROUND = '#fce8e6';

/**
 * Offering field configuration, keyed by Offerings column name.
 * Columns not listed here render as plain text inputs, so columns
 * added via migrateSheets appear without code changes.
 *
 * Types: readonly | text | textarea | number | email | url
 * `options` renders a datalist — suggestions, never a lock-in.
 *
 * @type {Object<string, {type: string, label: string, options?: string[]}>}
 */
const FIELD_CONFIG = {
  offeringId: { type: 'readonly', label: 'Offering ID' },
  status: { type: 'text', label: 'Status', options: ['open', 'needs-review'] },
  approved: { type: 'text', label: 'Approved ("yes" publishes the class)', options: ['yes'] },
  classTitle: { type: 'text', label: 'Class title' },
  category: { type: 'text', label: 'Category', options: CATEGORY_CHOICES },
  shortSummary: { type: 'textarea', label: 'Short summary (listing page)' },
  fullDescription: { type: 'textarea', label: 'Full description (class page)' },
  whatToExpect: { type: 'textarea', label: 'What to expect' },
  tuition: { type: 'number', label: 'Tuition (USD)' },
  materialsFee: { type: 'number', label: 'Materials fee (USD)' },
  materialsFeeNote: { type: 'text', label: 'Materials fee note' },
  minimumAge: { type: 'number', label: 'Minimum age' },
  abilityLevel: { type: 'text', label: 'Ability level', options: ABILITY_CHOICES },
  instructorName: { type: 'text', label: 'Instructor name' },
  instructorBio: { type: 'textarea', label: 'Instructor bio' },
  instructorLinks: { type: 'textarea', label: 'Instructor links' },
  classImage: { type: 'text', label: 'Class image file name' },
  instructorPhoto: { type: 'text', label: 'Instructor photo file name' },
  givebutterUrl: { type: 'url', label: 'Givebutter registration URL' },
  submitterName: { type: 'text', label: 'Submitter name' },
  submitterEmail: { type: 'email', label: 'Submitter email' },
  submittedAt: { type: 'readonly', label: 'Submitted at' }
};

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

/**
 * Build the Review menu and refresh the expired highlights.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Review')
    .addItem('Open edit modal', 'openEditModal')
    .addItem('Add new class', 'openNewClassModal')
    .addItem('Refresh expired highlights', 'highlightExpiredClasses')
    .addSeparator()
    .addItem('Publish site', 'publishSite')
    .addToUi();

  highlightExpiredClasses();
}

/* ------------------------------------------------------------------ */
/* Modal open                                                          */
/* ------------------------------------------------------------------ */

/**
 * Open the edit modal for the offering row the cursor is on.
 * Menu handler for Review > Open edit modal.
 */
function openEditModal() {
  const userInterface = SpreadsheetApp.getUi();
  const activeSheet = SpreadsheetApp.getActiveSheet();

  if (activeSheet.getName() !== OFFERINGS_SHEET_NAME) {
    userInterface.alert(`Select a row in the "${OFFERINGS_SHEET_NAME}" sheet first.`);
    return;
  }

  const rowNumber = activeSheet.getActiveCell().getRow();
  if (rowNumber < 2) {
    userInterface.alert('Select a cell in a data row first (row 2 or below).');
    return;
  }

  const payload = buildEditPayload(activeSheet, rowNumber);
  showModal(payload, `Edit: ${payload.classTitle || 'untitled class'}`);
}

/**
 * Open the modal empty, for creating a class without a form submission.
 * Menu handler for Review > Add new class.
 */
function openNewClassModal() {
  showModal(buildNewPayload(), 'Add new class');
}

/**
 * Render and show the modal dialog.
 * @param {Object} payload - Dialog payload (see buildEditPayload)
 * @param {string} title - Dialog title
 */
function showModal(payload, title) {
  const template = HtmlService.createTemplateFromFile('edit-modal');
  // Escape "<" so the JSON can never terminate the <script> block early.
  template.payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');

  const dialog = template.evaluate().setWidth(DIALOG_WIDTH).setHeight(DIALOG_HEIGHT);
  SpreadsheetApp.getUi().showModalDialog(dialog, title);
}

/* ------------------------------------------------------------------ */
/* Payload builders                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build the payload for editing an existing offering.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} offeringsSheet - Offerings sheet
 * @param {number} rowNumber - 1-based offering row
 * @returns {Object} Dialog payload
 */
function buildEditPayload(offeringsSheet, rowNumber) {
  const headers = readHeaderColumns(offeringsSheet);
  const values = offeringsSheet.getRange(rowNumber, 1, 1, headers.length).getDisplayValues()[0];

  const fields = headers.map((column, index) => buildField(column, values[index]));
  const offeringId = values[headers.indexOf('offeringId')] ?? '';
  const classTitle = values[headers.indexOf('classTitle')] ?? '';

  return {
    mode: 'edit',
    rowNumber: rowNumber,
    offeringId: offeringId,
    classTitle: classTitle,
    fields: fields,
    sessions: readSessions(offeringId)
  };
}

/**
 * Build the payload for creating a new offering: same columns, empty
 * values, generated fields marked read-only.
 * @returns {Object} Dialog payload
 */
function buildNewPayload() {
  const headers = readHeaderColumns(getRequiredSheet(OFFERINGS_SHEET_NAME));
  const generatedPlaceholders = {
    offeringId: '(generated on save)',
    status: '(set on save)',
    submittedAt: '(set on save)'
  };

  const fields = headers.map((column) =>
    column in generatedPlaceholders
      ? { ...buildField(column, generatedPlaceholders[column]), type: 'readonly' }
      : buildField(column, '')
  );

  return {
    mode: 'new',
    rowNumber: null,
    offeringId: '',
    classTitle: '',
    fields: fields,
    sessions: []
  };
}

/**
 * Build one field descriptor from a column name and its value.
 * @param {string} column - Offerings column name
 * @param {string} value - Current display value
 * @returns {{column: string, label: string, type: string,
 *            options: string[]|null, value: string}} Field descriptor
 */
function buildField(column, value) {
  const config = FIELD_CONFIG[column] ?? { type: 'text', label: column };
  return {
    column: column,
    label: config.label,
    type: config.type,
    options: config.options ?? null,
    value: value
  };
}

/**
 * Read the sessions belonging to one offering, sorted by date.
 * @param {string} offeringId - Parent offering ID
 * @returns {Object[]} Session descriptors including their sheet row
 */
function readSessions(offeringId) {
  const sheet = getRequiredSheet(SESSIONS_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || offeringId === '') {
    return [];
  }

  const headers = readHeaderColumns(sheet);
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();

  return rows
    .map((row, index) => ({
      sheetRow: index + 2,
      sessionId: row[headers.indexOf('sessionId')],
      offeringId: row[headers.indexOf('offeringId')],
      sessionDate: row[headers.indexOf('sessionDate')],
      startTime: row[headers.indexOf('startTime')],
      endTime: row[headers.indexOf('endTime')],
      hostName: row[headers.indexOf('hostName')],
      hostEmail: row[headers.indexOf('hostEmail')],
      signedUpAt: row[headers.indexOf('signedUpAt')],
      status: row[headers.indexOf('status')]
    }))
    .filter((session) => session.offeringId === offeringId)
    .sort((first, second) => first.sessionDate.localeCompare(second.sessionDate));
}

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

/**
 * Persist a modal submission. Called from the dialog via
 * google.script.run.
 * @param {Object} request - {mode, rowNumber, offeringId,
 *   offering: Object<string,string> (changed values by column),
 *   sessions: {updated: Object[], added: Object[], removed: number[]}}
 * @returns {{offeringId: string}} The affected offering ID
 */
function saveOffering(request) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    const offeringId =
      request.mode === 'new' ? createOfferingFromModal(request) : updateOfferingFromModal(request);
    return { offeringId: offeringId };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Create a new offering plus its sessions from modal input.
 * @param {Object} request - Modal save request
 * @returns {string} The generated offering ID
 */
function createOfferingFromModal(request) {
  const classTitle = String(request.offering.classTitle ?? '').trim();
  if (classTitle === '') {
    throw new Error('Class title is required.');
  }

  const offeringsSheet = getRequiredSheet(OFFERINGS_SHEET_NAME);
  const sessionsSheet = getRequiredSheet(SESSIONS_SHEET_NAME);

  const sessions = request.sessions.added
    .map(normalizeSessionInput)
    .filter((session) => session.sessionDate !== '')
    .sort((first, second) => first.sessionDate.localeCompare(second.sessionDate));

  const existingIds = readColumnValues(offeringsSheet, 1);
  const offeringId = createUniqueOfferingId(
    classTitle,
    sessions.length > 0 ? sessions[0].sessionDate : undefined,
    existingIds
  );

  appendObjectRow(offeringsSheet, {
    ...request.offering,
    offeringId: offeringId,
    classTitle: classTitle,
    status: sessions.length > 0 ? 'open' : 'needs-review',
    approved: request.offering.approved ?? '',
    submittedAt: new Date().toISOString()
  });

  sessions.forEach((session, index) => {
    appendObjectRow(
      sessionsSheet,
      buildSessionRecord(offeringId, classTitle, {
        sessionDate: session.sessionDate,
        sessionNumber: index + 1,
        sessionCount: sessions.length,
        startTime: session.startTime,
        endTime: session.endTime
      })
    );
  });

  return offeringId;
}

/**
 * Apply modal edits to an existing offering and its sessions.
 * Order matters: cell updates first (row numbers still valid), then
 * row deletions bottom-up, then appends, then renumbering.
 * @param {Object} request - Modal save request
 * @returns {string} The offering ID
 */
function updateOfferingFromModal(request) {
  const offeringsSheet = getRequiredSheet(OFFERINGS_SHEET_NAME);
  const sessionsSheet = getRequiredSheet(SESSIONS_SHEET_NAME);
  const offeringId = request.offeringId;

  writeChangedCells(offeringsSheet, request.rowNumber, request.offering);

  const sessionHeaders = readHeaderColumns(sessionsSheet);
  request.sessions.updated.forEach((session) => {
    const normalized = normalizeSessionInput(session);
    writeChangedCells(sessionsSheet, session.sheetRow, {
      sessionDate: normalized.sessionDate,
      startTime: normalized.startTime,
      endTime: normalized.endTime
    });
  });

  [...request.sessions.removed]
    .sort((first, second) => second - first)
    .forEach((sheetRow) => sessionsSheet.deleteRow(sheetRow));

  const classTitle =
    request.offering.classTitle !== undefined
      ? request.offering.classTitle
      : readOfferingTitle(offeringsSheet, request.rowNumber);

  const nextSuffix = readNextSessionSuffix(sessionsSheet, sessionHeaders, offeringId);
  request.sessions.added
    .map(normalizeSessionInput)
    .filter((session) => session.sessionDate !== '')
    .forEach((session, index) => {
      appendObjectRow(
        sessionsSheet,
        buildSessionRecord(offeringId, classTitle, {
          sessionDate: session.sessionDate,
          sessionNumber: nextSuffix + index,
          sessionCount: 0, // corrected by renumberOfferingSessions below
          startTime: session.startTime,
          endTime: session.endTime
        })
      );
    });

  renumberOfferingSessions(sessionsSheet, offeringId, classTitle);
  return offeringId;
}

/**
 * Normalize modal session input through the shared parsers, so the
 * store keeps ISO dates and 24h times regardless of what was typed.
 * @param {Object} session - Raw session input from the dialog
 * @returns {Object} Session with normalized date and times
 */
function normalizeSessionInput(session) {
  return {
    ...session,
    sessionDate: parseDateAnswer(session.sessionDate) ?? String(session.sessionDate ?? '').trim(),
    startTime: parseTimeAnswer(session.startTime),
    endTime: parseTimeAnswer(session.endTime)
  };
}

/**
 * Write a set of values into one row, addressed by column header.
 * Cells are formatted as plain text first, matching appendObjectRow.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target sheet
 * @param {number} rowNumber - 1-based row
 * @param {Object<string, string>} valuesByColumn - Column name → value
 */
function writeChangedCells(sheet, rowNumber, valuesByColumn) {
  const headers = readHeaderColumns(sheet);
  Object.keys(valuesByColumn).forEach((column) => {
    const columnIndex = headers.indexOf(column);
    if (columnIndex === -1) {
      return;
    }
    sheet
      .getRange(rowNumber, columnIndex + 1)
      .setNumberFormat('@')
      .setValue(valuesByColumn[column]);
  });
}

/**
 * Read the classTitle of an offering row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} offeringsSheet - Offerings sheet
 * @param {number} rowNumber - 1-based offering row
 * @returns {string} The class title
 */
function readOfferingTitle(offeringsSheet, rowNumber) {
  const headers = readHeaderColumns(offeringsSheet);
  return String(
    offeringsSheet.getRange(rowNumber, headers.indexOf('classTitle') + 1).getDisplayValue()
  );
}

/**
 * Find the next free numeric sessionId suffix for an offering.
 * Existing IDs are never renumbered (the volunteer web app references
 * them), so new sessions continue the sequence.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sessionsSheet - Sessions sheet
 * @param {string[]} headers - Sessions header row
 * @param {string} offeringId - Parent offering ID
 * @returns {number} Next free suffix
 */
function readNextSessionSuffix(sessionsSheet, headers, offeringId) {
  const lastRow = sessionsSheet.getLastRow();
  if (lastRow < 2) {
    return 1;
  }

  const rows = sessionsSheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();
  const suffixes = rows
    .filter((row) => row[headers.indexOf('offeringId')] === offeringId)
    .map((row) => {
      const match = String(row[headers.indexOf('sessionId')]).match(/-s(\d+)$/);
      return match === null ? 0 : Number(match[1]);
    });

  return suffixes.length === 0 ? 1 : Math.max(...suffixes) + 1;
}

/**
 * Rewrite sessionNumber (by date order), sessionCount, and the
 * denormalized classTitle for every session of one offering.
 * sessionIds stay untouched.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sessionsSheet - Sessions sheet
 * @param {string} offeringId - Parent offering ID
 * @param {string} classTitle - Current class title
 */
function renumberOfferingSessions(sessionsSheet, offeringId, classTitle) {
  const lastRow = sessionsSheet.getLastRow();
  if (lastRow < 2) {
    return;
  }

  const headers = readHeaderColumns(sessionsSheet);
  const rows = sessionsSheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();

  const offeringRows = rows
    .map((row, index) => ({
      sheetRow: index + 2,
      offeringId: row[headers.indexOf('offeringId')],
      sessionDate: row[headers.indexOf('sessionDate')]
    }))
    .filter((row) => row.offeringId === offeringId)
    .sort((first, second) => first.sessionDate.localeCompare(second.sessionDate));

  offeringRows.forEach((row, index) => {
    writeChangedCells(sessionsSheet, row.sheetRow, {
      sessionNumber: String(index + 1),
      sessionCount: String(offeringRows.length),
      classTitle: classTitle
    });
  });
}

/* ------------------------------------------------------------------ */
/* Expired highlighting                                                */
/* ------------------------------------------------------------------ */

/**
 * Highlight offerings whose sessions all lie in the past, so the
 * reviewer can decide: keep the row as history or clear its approved
 * cell. Joins the Sessions sheet by offeringId; dates are the stored
 * ISO strings, which compare correctly as text. Rows that no longer
 * qualify are reset on the next run. This pass owns data-row
 * backgrounds on the Offerings sheet.
 */
function highlightExpiredClasses() {
  const offeringsSheet = getRequiredSheet(OFFERINGS_SHEET_NAME);
  const lastRow = offeringsSheet.getLastRow();
  if (lastRow < 2) {
    return;
  }

  const latestSessionDates = readLatestSessionDates();
  const todayIso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const headers = readHeaderColumns(offeringsSheet);
  const idIndex = headers.indexOf('offeringId');
  const dataRange = offeringsSheet.getRange(2, 1, lastRow - 1, headers.length);
  const rows = dataRange.getDisplayValues();

  const backgrounds = rows.map((row) => {
    const latestDate = latestSessionDates[row[idIndex]];
    const expired = latestDate !== undefined && latestDate < todayIso;
    return headers.map(() => (expired ? EXPIRED_BACKGROUND : null));
  });

  dataRange.setBackgrounds(backgrounds);
}

/**
 * Map each offeringId to its latest session date (ISO string).
 * @returns {Object<string, string>} offeringId → latest ISO date
 */
function readLatestSessionDates() {
  const sheet = getRequiredSheet(SESSIONS_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {};
  }

  const headers = readHeaderColumns(sheet);
  const idIndex = headers.indexOf('offeringId');
  const dateIndex = headers.indexOf('sessionDate');
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();

  return rows.reduce((latest, row) => {
    const offeringId = row[idIndex];
    const sessionDate = row[dateIndex];
    if (offeringId === '' || sessionDate === '') {
      return latest;
    }
    const current = latest[offeringId];
    return current === undefined || sessionDate > current
      ? { ...latest, [offeringId]: sessionDate }
      : latest;
  }, {});
}

/* ------------------------------------------------------------------ */
/* Publish                                                             */
/* ------------------------------------------------------------------ */

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
    muteHttpExceptions: true
  });

  const succeeded = response.getResponseCode() >= 200 && response.getResponseCode() < 300;
  const message = succeeded
    ? 'Build triggered — the site rebuilds in a minute or two.'
    : `Build hook failed (HTTP ${response.getResponseCode()}).`;

  spreadsheet.toast(message, 'Publish site', 8);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Get a sheet by name, failing loudly if it was renamed.
 * @param {string} name - Sheet name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet
 */
function getRequiredSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found — was it renamed?`);
  }
  return sheet;
}
