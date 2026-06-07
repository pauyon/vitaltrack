import type { RawRow } from './readingIO';

/**
 * Read a user-selected CSV/XLSX/XLS file into an array of raw header->value
 * rows. Parsing libraries are dynamically imported so they only load on use.
 */
export async function readRowsFromFile(file: File): Promise<RawRow[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv') || file.type === 'text/csv') {
    const Papa = (await import('papaparse')).default;
    const text = await file.text();
    const result = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    return (result.data as RawRow[]).filter(
      (r) => r && Object.keys(r).length > 0,
    );
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    // raw:false formats cells (incl. dates) as strings for uniform parsing.
    return XLSX.utils.sheet_to_json<RawRow>(ws, { raw: false, defval: '' });
  }

  throw new Error('Unsupported file type. Use a .csv, .xlsx, or .xls file.');
}
