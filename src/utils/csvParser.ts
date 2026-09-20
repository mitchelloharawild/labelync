// Small hand-rolled CSV parser for batch printing.
//
// The app's batch-print use case is simple tabular data exported from a
// spreadsheet (one row per label), not general-purpose RFC-4180 ingestion, so
// a tiny parser is used here instead of pulling in a dependency. It still
// supports the common cases: quoted fields, embedded commas, escaped ("")
// quotes, and quoted fields containing newlines.

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV text into a header row plus data rows. Blank lines (no non-empty
 * cells) are skipped. Returns empty headers/rows if the input has no usable
 * header row or no data rows.
 */
export const parseCSV = (text: string): ParsedCSV => {
  const clean = text.replace(/^﻿/, ''); // strip BOM if present

  const allRows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    allRows.push(row);
    row = [];
  };

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\r') {
      // ignore; \n (bare or following \r) ends the row
    } else if (char === '\n') {
      endRow();
    } else {
      field += char;
    }
  }

  // Flush a trailing field/row that wasn't terminated by a newline.
  if (field.length > 0 || row.length > 0) {
    endRow();
  }

  const nonEmptyRows = allRows.filter(r => r.some(cell => cell.trim() !== ''));
  if (nonEmptyRows.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = nonEmptyRows[0].map(h => h.trim());
  const rows = nonEmptyRows.slice(1);

  return { headers, rows };
};
