/**
 * Center for People and Crafts — class intake notification
 *
 * Runs when a class owner submits the class intake Google Form and
 * sends a notification email built from the submitted facts plus the
 * optional "Note for the announcement email" answer.
 *
 * Recipients live in the Script Property "notifyRecipients" (Project
 * Settings > Script Properties), a comma-separated list of addresses,
 * so an admin can change them without touching code. With the
 * property missing or empty, no email is sent (logged as a warning).
 *
 * Offering IDs are handled by the existing offerings pipeline (slug of
 * class title + first session date); this script only mirrors that
 * convention to reference the offering in the email. It writes nothing
 * to the sheet.
 *
 * This file lives in the spreadsheet-bound "Sheet review" project,
 * alongside the review sidebar files. Like the sidebar, it dies with
 * the spreadsheet on a full rebuild and must be re-installed
 * (including the Script Property and the installable trigger).
 *
 * Wire this up via an INSTALLABLE trigger (Triggers → Add Trigger →
 * function onFormSubmit, event source "From spreadsheet", event type
 * "On form submit"). A simple trigger cannot send email.
 */


/**
 * Script configuration. Question titles must match the form questions
 * (and therefore the Sheet column headers) exactly.
 */
const INTAKE_CONFIG = {
  recipientsProperty: 'notifyRecipients',
  classNameQuestion: 'Class title',
  sessionDateQuestion: 'Session 1 date',
  noteQuestion: 'Note for the announcement email',
  excludeFromEmail: ['Timestamp'],
  subjectPrefix: 'New class submitted'
};

/**
 * Entry point, wired to the installable "On form submit" trigger.
 *
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} event - Form submit event.
 * @returns {void}
 */
function onFormSubmit(event) {
  const sheet = event.range.getSheet();
  const rowIndex = event.range.getRow();

  try {
    const facts = readRowFacts(sheet, rowIndex);
    const subject = buildEmailSubject(facts);
    const body = buildEmailBody(facts);
    sendNotificationEmail(subject, body);
  } catch (error) {
    console.error(`Notification email failed for row ${rowIndex}: ${error.message}`);
  }
}


/**
 * Reads the notification recipients from the Script Property
 * "notifyRecipients": a comma-separated list of email addresses.
 *
 * @returns {Array<string>} Recipient addresses; empty when unset.
 */
function readNotifyRecipients() {
  const rawValue = PropertiesService.getScriptProperties().getProperty(
    INTAKE_CONFIG.recipientsProperty
  );
  if (rawValue === null || rawValue.trim() === '') {
    return [];
  }
  return rawValue
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address !== '');
}

/**
 * Reads the submitted row as an ordered list of label/value pairs,
 * pairing each cell with its column header. Reading from the sheet
 * (rather than event.namedValues) preserves column order and picks up
 * everything the form wrote.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The response sheet.
 * @param {number} rowIndex - 1-based row of the new submission.
 * @returns {Array<{label: string, value: string}>} Non-empty cells with their headers.
 */
function readRowFacts(sheet, rowIndex) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const values = sheet.getRange(rowIndex, 1, 1, lastColumn).getDisplayValues()[0];

  return headers
    .map((label, index) => ({ label: label, value: values[index] }))
    .filter((fact) => fact.value !== '' && fact.label !== '');
}

/**
 * Finds the value of a fact by its label.
 *
 * @param {Array<{label: string, value: string}>} facts - Row facts.
 * @param {string} label - The column header to look up.
 * @returns {string} The value, or an empty string when absent.
 */
function findFactValue(facts, label) {
  const fact = facts.find((candidate) => candidate.label === label);
  return fact ? fact.value : '';
}

/**
 * Builds the offering ID the same way the existing offerings pipeline
 * does: a slug of the class title plus the first session date as
 * YYYYMMDD, e.g. "summer-herbs-for-home-20260710".
 *
 * @param {Array<{label: string, value: string}>} facts - Row facts.
 * @returns {string} The offering slug, or an empty string when the
 *   title or date is missing or unparseable.
 */
function buildOfferingSlug(facts) {
  const title = findFactValue(facts, INTAKE_CONFIG.classNameQuestion);
  const dateValue = findFactValue(facts, INTAKE_CONFIG.sessionDateQuestion);
  if (title === '' || dateValue === '') {
    return '';
  }

  const parsedDate = new Date(dateValue);
  if (isNaN(parsedDate.getTime())) {
    return '';
  }

  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const datePart = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyyMMdd');

  return `${titleSlug}-${datePart}`;
}

/**
 * Builds the email subject from the class title, falling back to a
 * generic subject when the class title is missing.
 *
 * @param {Array<{label: string, value: string}>} facts - Row facts.
 * @returns {string} The subject line.
 */
function buildEmailSubject(facts) {
  const title = findFactValue(facts, INTAKE_CONFIG.classNameQuestion);
  return title !== ''
    ? `${INTAKE_CONFIG.subjectPrefix}: ${title}`
    : INTAKE_CONFIG.subjectPrefix;
}

/**
 * Builds the plain-text email body: all submitted facts in column order,
 * the offering slug, then the optional note from the class owner.
 *
 * @param {Array<{label: string, value: string}>} facts - Row facts.
 * @returns {string} The email body.
 */
function buildEmailBody(facts) {
  const hiddenLabels = [INTAKE_CONFIG.noteQuestion].concat(INTAKE_CONFIG.excludeFromEmail);

  const factLines = facts
    .filter((fact) => hiddenLabels.indexOf(fact.label) === -1)
    .map((fact) => `${fact.label}: ${fact.value}`);

  const offeringSlug = buildOfferingSlug(facts);
  const slugLine = offeringSlug !== '' ? `Offering ID: ${offeringSlug}` : '';

  const note = findFactValue(facts, INTAKE_CONFIG.noteQuestion);
  const noteSection = note !== ''
    ? `\n\nMessage from the class owner:\n${note}`
    : '';

  return [
    'A new class was submitted to the class intake form.',
    '',
    factLines.join('\n'),
    slugLine,
    noteSection,
    '',
    '— Sent automatically by the class intake script.'
  ].join('\n');
}

/**
 * Sends the notification email to the recipients configured in the
 * "notifyRecipients" Script Property. Logs a warning and sends nothing
 * when the property is missing or empty.
 *
 * @param {string} subject - The email subject.
 * @param {string} body - The plain-text email body.
 * @returns {void}
 */
function sendNotificationEmail(subject, body) {
  const recipients = readNotifyRecipients();
  if (recipients.length === 0) {
    console.warn(
      'No notification sent: Script Property "notifyRecipients" is empty or missing.'
    );
    return;
  }
  MailApp.sendEmail({
    to: recipients.join(','),
    subject: subject,
    body: body
  });
}
