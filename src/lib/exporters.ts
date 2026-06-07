/**
 * File exporters. All heavy libraries (papaparse, xlsx, jspdf) are loaded with
 * dynamic import() so they're split into their own chunks and only downloaded
 * when the user actually exports something.
 */

type Row = Record<string, unknown>;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportCsv(filename: string, rows: Row[]) {
  const Papa = (await import('papaparse')).default;
  const csv = Papa.unparse(rows);
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export interface SheetSpec {
  name: string;
  rows: Row[];
}

export async function exportExcel(filename: string, sheets: SheetSpec[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    // Excel sheet names are capped at 31 chars and can't contain some symbols.
    const safe = sheet.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safe);
  }
  XLSX.writeFile(wb, filename);
}

export interface PdfTableSpec {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

/**
 * Build a PDF from one or more tables (and optional image blocks) on a single
 * document. Returns the jsPDF instance so callers can add more before saving.
 */
export async function buildPdf() {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  return { doc, autoTable };
}

export async function exportPdfTables(filename: string, tables: PdfTableSpec[]) {
  const { doc, autoTable } = await buildPdf();
  let first = true;
  for (const table of tables) {
    if (!first) doc.addPage();
    first = false;
    doc.setFontSize(16);
    doc.text(table.title, 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [table.columns],
      body: table.rows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [244, 246, 251] },
    });
  }
  doc.save(filename);
}
