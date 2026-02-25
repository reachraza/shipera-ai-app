import { RFPLaneCSVRow } from '@/constants/types';

const REQUIRED_COLUMNS = [
  'origin_city',
  'origin_state',
  'destination_city',
  'destination_state',
  'equipment_type',
];

export interface CSVParseResult {
  lanes: RFPLaneCSVRow[];
  errors: string[];
  totalRows: number;
}

export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.trim().split('\n');
  const errors: string[] = [];
  const lanes: RFPLaneCSVRow[] = [];

  if (lines.length < 2) {
    return { lanes: [], errors: ['CSV must have a header row and at least one data row'], totalRows: 0 };
  }

  // Parse header
  const header = lines[0].split(',').map((col) => col.trim().toLowerCase().replace(/\s+/g, '_'));

  // Validate required columns
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missingColumns.length > 0) {
    return {
      lanes: [],
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      totalRows: 0,
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((val) => val.trim());
    const row: Record<string, string> = {};

    header.forEach((col, idx) => {
      row[col] = values[idx] || '';
    });

    // Validate required fields
    const emptyFields = REQUIRED_COLUMNS.filter((col) => !row[col]);
    if (emptyFields.length > 0) {
      errors.push(`Row ${i + 1}: Missing values for ${emptyFields.join(', ')}`);
      continue;
    }

    lanes.push({
      origin_city: row.origin_city,
      origin_state: row.origin_state,
      destination_city: row.destination_city,
      destination_state: row.destination_state,
      equipment_type: row.equipment_type,
      frequency: row.frequency || undefined,
    });
  }

  return { lanes, errors, totalRows: lines.length - 1 };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
