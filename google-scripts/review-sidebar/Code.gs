/**
 * Row Review Sidebar for the class offerings sheet.
 *
 * Adds a "Review" menu that opens a sidebar showing the currently
 * selected row as a labeled, editable record. Column headers (row 1)
 * become the field labels. The reviewer edits long text in roomy
 * textareas and saves changes back to the sheet.
 *
 * This file is server-side Apps Script. The sidebar UI lives in
 * ReviewSidebar.html in the same project.
 */

/** Row number that holds the column headers. */
const HEADER_ROW_NUMBER = 1;

/**
 * Simple trigger. Runs when the spreadsheet is opened and adds the
 * Review menu to the menu bar.
 *
 * @returns {void}
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu( 'Review' )
    .addItem( 'Open row viewer', 'showReviewSidebar' )
    .addToUi();
}

/**
 * Opens the review sidebar. Invoked from the Review menu.
 *
 * @returns {void}
 */
function showReviewSidebar() {
  const sidebar = HtmlService.createHtmlOutputFromFile( 'ReviewSidebar' )
    .setTitle( 'Row Viewer' );

  SpreadsheetApp.getUi().showSidebar( sidebar );
}

/**
 * @typedef {Object} RowField
 * @property {string} label - Column header text
 * @property {string} value - Display value of the cell in the row
 * @property {number} columnNumber - 1-based column number of the cell
 * @property {boolean} isFormula - True when the cell holds a formula;
 *   such fields are read-only in the sidebar
 */

/**
 * @typedef {Object} RowRecord
 * @property {string} sheetName - Name of the sheet
 * @property {number} rowNumber - 1-based row number
 * @property {RowField[]} fields - Header/value pairs for the row
 * @property {string|null} message - Human-readable notice when there is
 *   nothing to show (header row selected, empty sheet); null otherwise
 */

/**
 * @typedef {Object} FieldEdit
 * @property {number} columnNumber - 1-based column number to write
 * @property {string} value - New cell value
 */

/**
 * Returns the active row as a labeled record. Called from the sidebar
 * via google.script.run on a polling interval.
 *
 * @returns {RowRecord} The record for the currently selected row
 */
function getActiveRowRecord() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const rowNumber = sheet.getActiveCell().getRow();

  return buildRowRecord( sheet, rowNumber );
}

/**
 * Writes edited fields back to a row and returns the refreshed record,
 * so the sidebar can show the values exactly as the sheet now renders
 * them (dates and numbers may be reformatted on entry).
 *
 * Only the edited cells are written, which keeps the write surface
 * minimal if someone else is working in the sheet at the same time.
 *
 * @param {string} sheetName - Sheet the row belongs to
 * @param {number} rowNumber - 1-based row number to update
 * @param {FieldEdit[]} edits - Changed cells to write
 * @returns {RowRecord} The refreshed record for the row
 */
function updateRowFields( sheetName, rowNumber, edits ) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName( sheetName );

  if ( sheet === null ) {
    throw new Error( `Sheet "${ sheetName }" no longer exists.` );
  }

  edits.forEach( ( edit ) => {
    sheet.getRange( rowNumber, edit.columnNumber ).setValue( edit.value );
  } );

  SpreadsheetApp.flush();

  return buildRowRecord( sheet, rowNumber );
}

/**
 * Builds the record for one row of a sheet.
 *
 * Uses display values so dates, times, and currency read exactly as
 * they appear in the sheet.
 *
 * @param {SpreadsheetApp.Sheet} sheet - Sheet to read from
 * @param {number} rowNumber - 1-based row number
 * @returns {RowRecord} The row as a labeled record
 */
function buildRowRecord( sheet, rowNumber ) {
  const lastColumn = sheet.getLastColumn();

  if ( lastColumn === 0 ) {
    return buildEmptyRecord( sheet.getName(), rowNumber, 'This sheet has no data.' );
  }

  if ( rowNumber <= HEADER_ROW_NUMBER ) {
    return buildEmptyRecord( sheet.getName(), rowNumber, 'Select a data row to review it.' );
  }

  const headers = sheet
    .getRange( HEADER_ROW_NUMBER, 1, 1, lastColumn )
    .getDisplayValues()[ 0 ];

  const rowRange = sheet.getRange( rowNumber, 1, 1, lastColumn );
  const rowValues = rowRange.getDisplayValues()[ 0 ];
  const rowFormulas = rowRange.getFormulas()[ 0 ];

  return {
    sheetName: sheet.getName(),
    rowNumber: rowNumber,
    fields: buildRowFields( headers, rowValues, rowFormulas ),
    message: null
  };
}

/**
 * Pairs column headers with the row's values. Columns without a header
 * fall back to their A1-style column letter so nothing is hidden from
 * the reviewer.
 *
 * @param {string[]} headers - Header row display values
 * @param {string[]} rowValues - Row display values
 * @param {string[]} rowFormulas - Row formulas ('' for plain cells)
 * @returns {RowField[]} Ordered header/value pairs
 */
function buildRowFields( headers, rowValues, rowFormulas ) {
  return headers.map( ( header, columnIndex ) => ( {
    label: header !== '' ? header : `Column ${ columnIndexToLetter( columnIndex ) }`,
    value: rowValues[ columnIndex ],
    columnNumber: columnIndex + 1,
    isFormula: rowFormulas[ columnIndex ] !== ''
  } ) );
}

/**
 * Builds a record that carries only a notice message.
 *
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowNumber - 1-based row number of the selection
 * @param {string} message - Notice to display in the sidebar
 * @returns {RowRecord} A record with no fields
 */
function buildEmptyRecord( sheetName, rowNumber, message ) {
  return {
    sheetName: sheetName,
    rowNumber: rowNumber,
    fields: [],
    message: message
  };
}

/**
 * Converts a 0-based column index to its A1-style letter(s).
 *
 * @param {number} columnIndex - 0-based column index
 * @returns {string} Column letters, e.g. 0 -> "A", 27 -> "AB"
 */
function columnIndexToLetter( columnIndex ) {
  let letters = '';
  let remaining = columnIndex;

  while ( remaining >= 0 ) {
    letters = String.fromCharCode( 65 + ( remaining % 26 ) ) + letters;
    remaining = Math.floor( remaining / 26 ) - 1;
  }

  return letters;
}
