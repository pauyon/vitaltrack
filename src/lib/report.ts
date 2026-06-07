import { buildPdf } from './exporters';
import { bgToRow, bpToRow } from './readingIO';
import type { ReportOptions } from '../components/ReportDialog';
import type { BloodPressureReading, BloodSugarReading } from '../types';

export interface ReportData {
  rangeLabel: string;
  /** [metric, value] pairs for the summary table. */
  summaryRows: [string, string][];
  charts: { title: string; node: HTMLElement | null }[];
  bg: BloodSugarReading[];
  bp: BloodPressureReading[];
}

const INDIGO: [number, number, number] = [99, 102, 241];
const STRIPE: [number, number, number] = [244, 246, 251];

/** Build a single combined PDF from the selected sections. */
export async function generateReport(opts: ReportOptions, data: ReportData) {
  const { doc, autoTable } = await buildPdf();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFontSize(20);
  doc.text('VitalTrack Health Report', margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(
    `${data.rangeLabel}  •  Generated ${new Date().toLocaleString()}`,
    margin,
    y,
  );
  doc.setTextColor(0);
  y += 18;

  const lastFinalY = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y;

  if (opts.summary && data.summaryRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: data.summaryRows,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: INDIGO },
      alternateRowStyles: { fillColor: STRIPE },
      columnStyles: { 0: { cellWidth: contentW * 0.55 } },
    });
    y = lastFinalY() + 24;
  }

  if (opts.charts) {
    const { toPng } = await import('html-to-image');
    for (const chart of data.charts) {
      if (!chart.node) continue;
      const dataUrl = await toPng(chart.node, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const props = doc.getImageProperties(dataUrl);
      const w = contentW;
      const h = (props.height / props.width) * w;
      if (y + h + 24 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(13);
      doc.text(chart.title, margin, y);
      y += 12;
      doc.addImage(dataUrl, 'PNG', margin, y, w, h);
      y += h + 24;
    }
  }

  if (opts.bgTable && data.bg.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Blood Sugar Readings', margin, margin);
    const rows = data.bg.map(bgToRow);
    const cols = Object.keys(rows[0]);
    autoTable(doc, {
      startY: margin + 16,
      head: [cols],
      body: rows.map((r) => cols.map((c) => r[c] as string | number)),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: INDIGO },
      alternateRowStyles: { fillColor: STRIPE },
    });
  }

  if (opts.bpTable && data.bp.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Blood Pressure Readings', margin, margin);
    const rows = data.bp.map(bpToRow);
    const cols = Object.keys(rows[0]);
    autoTable(doc, {
      startY: margin + 16,
      head: [cols],
      body: rows.map((r) => cols.map((c) => r[c] as string | number)),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: INDIGO },
      alternateRowStyles: { fillColor: STRIPE },
    });
  }

  doc.save('vitaltrack-report.pdf');
}
