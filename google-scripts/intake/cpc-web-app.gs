/**
 * Center for People and Craft — Data Web App
 * ===========================================
 *
 * Second file in the same Apps Script project as
 * cpc-class-intake-prototype.gs (add it via the + next to "Files" in
 * the editor). It shares that file's script properties, so run
 * `buildPrototype` before deploying this.
 *
 * Endpoints (after deployment as a web app)
 * -----------------------------------------
 * GET  ?token=SECRET  Full joined data for the Metalsmith build:
 *                     every offering with its sessions nested inside.
 *                     Volunteer emails are never included.
 * GET  (no token)     Public payload for class pages at load time:
 *                     sessionId + a hosted yes/no flag per session,
 *                     nothing else. Host names are never public.
 * POST                Volunteer signup. JSON body:
 *                     {"sessionId": "...", "hostName": "...",
 *                      "hostEmail": "...", "volunteerCode": "..."}
 *                     The volunteer code must match the "volunteerCode"
 *                     Script Property (rotated by the admin and shared
 *                     in volunteer emails). Writes the host columns of
 *                     that session row if, and only if, the slot is
 *                     still empty (checked inside a LockService lock).
 *                     Responses: {"ok": true} or {"ok": false,
 *                     "error": "..."} with error one of: invalid,
 *                     code, not-found, taken.
 *
 * Setup
 * -----
 * 1. Run `setupWebApp` once. It generates the build token, stores it
 *    in Script Properties, and logs it. Put the logged token in the
 *    site build environment (e.g. CPC_SHEET_TOKEN).
 * 2. Deploy > New deployment > type "Web app".
 *    Execute as: Me. Who has access: Anyone.
 * 3. Copy the /exec URL. That single URL is the whole read/write API;
 *    the spreadsheet itself stays private.
 * 4. After code changes, use Deploy > Manage deployments > edit >
 *    new version, so the /exec URL stays stable.
 *
 * Browser gotcha
 * --------------
 * Apps Script cannot answer CORS preflight requests. The class page
 * must POST with Content-Type "text/plain;charset=utf-8" (a "simple"
 * request that skips preflight) and put the JSON in the body string.
 * Plain GET fetches work as-is.
 */

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

/**
 * One-time setup: generate and store the build token. Running it
 * again rotates the token (update the build environment afterwards).
 */
function setupWebApp() {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('buildToken', token);
  Logger.log('Build token (put this in the site build env): %s', token);
}

/* ------------------------------------------------------------------ */
/* HTTP entry points                                                   */
/* ------------------------------------------------------------------ */

/**
 * Read endpoint. Full payload with a valid token, public availability
 * payload without one.
 * @param {GoogleAppsScript.Events.DoGet} event - GET event
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function doGet(event) {
  const providedToken = event?.parameter?.token ?? '';
  const buildToken = PropertiesService.getScriptProperties().getProperty('buildToken');
  const isBuild = buildToken !== null && providedToken === buildToken;

  const offerings = readSheetRecords('Offerings');
  const sessions = readSheetRecords('Sessions');

  const payload = isBuild
    ? buildFullPayload(offerings, sessions)
    : buildPublicPayload(offerings, sessions);

  return jsonResponse(payload);
}

/**
 * Volunteer signup endpoint.
 * @param {GoogleAppsScript.Events.DoPost} event - POST event
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function doPost(event) {
  const signup = parseSignupRequest(event?.postData?.contents ?? '');
  if (signup === null) {
    return jsonResponse({ ok: false, error: 'invalid' });
  }

  if (!isVolunteerCodeValid(signup.volunteerCode)) {
    return jsonResponse({ ok: false, error: 'code' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return jsonResponse(claimSession(signup));
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* Payload builders (pure)                                             */
/* ------------------------------------------------------------------ */

/** Session fields exposed to the build. Emails stay in the sheet. */
const BUILD_SESSION_FIELDS = [
  'sessionId',
  'sessionDate',
  'sessionNumber',
  'sessionCount',
  'startTime',
  'endTime',
  'hostName',
  'status'
];

/**
 * Check whether an admin has approved an offering for publication.
 * New submissions arrive with an empty "approved" cell and stay off
 * the website until an admin sets it to "yes" in the Offerings sheet.
 * @param {Object<string, string>} offering - Offerings record
 * @returns {boolean} True when approved
 */
function isApproved(offering) {
  return String(offering.approved ?? '').trim().toLowerCase() === 'yes';
}

/**
 * Join approved offerings with their sessions for the build payload.
 * Unapproved offerings are invisible to the site build.
 * @param {Object<string, string>[]} offerings - Offerings records
 * @param {Object<string, string>[]} sessions - Sessions records
 * @returns {{offerings: Object[]}} Build payload
 */
function buildFullPayload(offerings, sessions) {
  return {
    offerings: offerings.filter(isApproved).map((offering) => ({
      ...offering,
      sessions: sessions
        .filter((session) => session.offeringId === offering.offeringId)
        .map((session) => pickFields(session, BUILD_SESSION_FIELDS))
    }))
  };
}

/**
 * Availability payload for public page-load fetches. Sessions of
 * unapproved offerings are excluded so nothing about them leaks.
 * Host privacy: the public payload carries only a hosted yes/no flag,
 * never a name. Volunteer names stay in the spreadsheet (and in the
 * token-gated build payload for admin use, though the site does not
 * display them either).
 * @param {Object<string, string>[]} offerings - Offerings records
 * @param {Object<string, string>[]} sessions - Sessions records
 * @returns {{sessions: {sessionId: string, hosted: boolean}[]}} Public payload
 */
function buildPublicPayload(offerings, sessions) {
  const approvedIds = new Set(offerings.filter(isApproved).map((offering) => offering.offeringId));
  return {
    sessions: sessions
      .filter((session) => approvedIds.has(session.offeringId))
      .map((session) => ({
        sessionId: session.sessionId,
        hosted: String(session.hostName ?? '').trim() !== ''
      }))
  };
}

/**
 * Copy only the named fields of a record.
 * @param {Object<string, string>} record - Source record
 * @param {string[]} fieldNames - Fields to keep
 * @returns {Object<string, string>} Reduced record
 */
function pickFields(record, fieldNames) {
  return fieldNames.reduce(
    (accumulator, fieldName) => ({ ...accumulator, [fieldName]: record[fieldName] ?? '' }),
    {}
  );
}

/* ------------------------------------------------------------------ */
/* Signup handling                                                     */
/* ------------------------------------------------------------------ */

/**
 * Parse and validate a signup request body.
 * @param {string} rawBody - Raw POST body
 * @returns {{sessionId: string, hostName: string, hostEmail: string, volunteerCode: string}|null}
 *   Validated signup, or null when the body is unusable
 */
function parseSignupRequest(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (error) {
    return null;
  }

  const sessionId = String(parsed?.sessionId ?? '').trim();
  const hostName = String(parsed?.hostName ?? '').trim();
  const hostEmail = String(parsed?.hostEmail ?? '').trim();
  const volunteerCode = String(parsed?.volunteerCode ?? '').trim();

  const isValid =
    sessionId.length > 0 &&
    hostName.length > 0 &&
    hostName.length <= 100 &&
    volunteerCode.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hostEmail);

  return isValid
    ? { sessionId: sessionId, hostName: hostName, hostEmail: hostEmail, volunteerCode: volunteerCode }
    : null;
}

/**
 * Check a submitted volunteer code against the current one stored in
 * Script Properties (key "volunteerCode"). Comparison ignores case and
 * surrounding whitespace so email transcription stays forgiving. Fails
 * closed: no stored code means no signups.
 *
 * Rotation: edit the "volunteerCode" Script Property (Project Settings
 * > Script Properties), then announce the new code in the volunteer
 * email. No redeployment needed.
 * @param {string} submittedCode - Code from the signup request
 * @returns {boolean} True when the code matches
 */
function isVolunteerCodeValid(submittedCode) {
  const currentCode = PropertiesService.getScriptProperties().getProperty('volunteerCode');
  if (currentCode === null || currentCode.trim() === '') {
    return false;
  }
  return submittedCode.trim().toLowerCase() === currentCode.trim().toLowerCase();
}

/**
 * Write the host columns of the requested session row if the slot is
 * still empty. Must be called while holding the script lock.
 * @param {{sessionId: string, hostName: string, hostEmail: string}} signup - Validated signup
 * @returns {{ok: boolean, error?: string}} Result for the JSON response
 */
function claimSession(signup) {
  const sheet = openPrototypeSpreadsheet().getSheetByName('Sessions');
  const headers = readHeaderRow(sheet);
  const sessionIdColumn = headers.indexOf('sessionId') + 1;
  const hostNameColumn = headers.indexOf('hostName') + 1;
  const hostEmailColumn = headers.indexOf('hostEmail') + 1;
  const signedUpAtColumn = headers.indexOf('signedUpAt') + 1;

  const rowIndex = findRowByValue(sheet, sessionIdColumn, signup.sessionId);
  if (rowIndex === -1) {
    return { ok: false, error: 'not-found' };
  }

  const currentHost = String(sheet.getRange(rowIndex, hostNameColumn).getValue()).trim();
  if (currentHost.length > 0) {
    return { ok: false, error: 'taken' };
  }

  sheet.getRange(rowIndex, hostNameColumn).setValue(signup.hostName);
  sheet.getRange(rowIndex, hostEmailColumn).setValue(signup.hostEmail);
  sheet.getRange(rowIndex, signedUpAtColumn).setValue(new Date().toISOString());
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Sheet access                                                        */
/* ------------------------------------------------------------------ */

/**
 * Open the spreadsheet created by buildPrototype.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The spreadsheet
 */
function openPrototypeSpreadsheet() {
  return SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('spreadsheetId')
  );
}

/**
 * Read one sheet into records keyed by its header row.
 * @param {string} sheetName - Sheet to read
 * @returns {Object<string, string>[]} One record per data row
 */
function readSheetRecords(sheetName) {
  const sheet = openPrototypeSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getDisplayValues();
  return recordsFromValues(values);
}

/**
 * Convert a rectangular value grid (header row first) into records.
 * @param {string[][]} values - Grid including the header row
 * @returns {Object<string, string>[]} One record per data row
 */
function recordsFromValues(values) {
  const [headers, ...rows] = values;
  return rows.map((row) =>
    headers.reduce(
      (accumulator, header, index) => ({ ...accumulator, [header]: row[index] ?? '' }),
      {}
    )
  );
}

/**
 * Read the header row of a sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Source sheet
 * @returns {string[]} Header labels
 */
function readHeaderRow(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
}

/**
 * Find the 1-based row index whose cell in the given column equals a
 * value, or -1 when absent. Skips the header row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Source sheet
 * @param {number} columnIndex - 1-based column to search
 * @param {string} value - Value to match exactly
 * @returns {number} 1-based row index or -1
 */
function findRowByValue(sheet, columnIndex, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  const columnValues = sheet
    .getRange(2, columnIndex, lastRow - 1, 1)
    .getDisplayValues()
    .map((row) => row[0]);
  const foundIndex = columnValues.indexOf(value);
  return foundIndex === -1 ? -1 : foundIndex + 2;
}

/* ------------------------------------------------------------------ */
/* Response helper                                                     */
/* ------------------------------------------------------------------ */

/**
 * Wrap an object as a JSON text response.
 * @param {Object} payload - Response body
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
