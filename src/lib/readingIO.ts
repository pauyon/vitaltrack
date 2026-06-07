import { format } from 'date-fns';
import {
  BG_CONTEXTS,
  BG_CONTEXT_LABELS,
  type BgContext,
  type BloodPressureReading,
  type BloodSugarReading,
  type ReadingKind,
} from '../types';
import { classifyBg } from './bgCategory';
import { classifyBp } from './bpCategory';

/**
 * Shared import/export schema for readings. Column headers are the contract for
 * both CSV/Excel export and import, so round-tripping a file works.
 */

export const BG_HEADERS = ['date', 'value', 'context', 'notes'] as const;
export const BP_HEADERS = [
  'date',
  'systolic',
  'diastolic',
  'pulse',
  'notes',
] as const;

export type RawRow = Record<string, unknown>;

export interface ParsedRow<T> {
  ok: boolean;
  /** Reading payload (without id/createdAt) when ok. */
  data?: Omit<T, 'id' | 'createdAt'>;
  /** Human-readable problem when not ok. */
  error?: string;
}

// ---- value parsing helpers ----------------------------------------------

function parseDate(input: unknown): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const s = String(input ?? '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseInt0(input: unknown): number | null {
  const s = String(input ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

// Accept either the stored key ("post_meal") or a friendly label ("After meal").
const CONTEXT_LOOKUP: Record<string, BgContext> = (() => {
  const map: Record<string, BgContext> = {};
  for (const c of BG_CONTEXTS) {
    map[c.toLowerCase()] = c;
    map[BG_CONTEXT_LABELS[c].toLowerCase()] = c;
  }
  // a couple of common aliases
  map['before meal'] = 'pre_meal';
  map['after meal'] = 'post_meal';
  return map;
})();

/** Case-insensitive header access (so "Date", "VALUE" etc. all work). */
function field(row: RawRow, name: string): unknown {
  if (name in row) return row[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().trim() === lower) return row[key];
  }
  return undefined;
}

// ---- row -> reading ------------------------------------------------------

export function parseBgRow(row: RawRow): ParsedRow<BloodSugarReading> {
  const date = parseDate(field(row, 'date'));
  if (!date) return { ok: false, error: 'Invalid or missing date' };

  const value = parseInt0(field(row, 'value'));
  if (value == null) return { ok: false, error: 'Invalid or missing value' };
  if (value < 20 || value > 800)
    return { ok: false, error: 'Value out of range (20–800)' };

  const rawCtx = String(field(row, 'context') ?? '')
    .trim()
    .toLowerCase();
  const context = CONTEXT_LOOKUP[rawCtx] ?? 'random';

  return {
    ok: true,
    data: {
      value,
      context,
      notes: String(field(row, 'notes') ?? '').trim(),
      takenAt: date,
    },
  };
}

export function parseBpRow(row: RawRow): ParsedRow<BloodPressureReading> {
  const date = parseDate(field(row, 'date'));
  if (!date) return { ok: false, error: 'Invalid or missing date' };

  const systolic = parseInt0(field(row, 'systolic'));
  const diastolic = parseInt0(field(row, 'diastolic'));
  if (systolic == null || diastolic == null)
    return { ok: false, error: 'Missing systolic/diastolic' };
  if (systolic < 50 || systolic > 300)
    return { ok: false, error: 'Systolic out of range (50–300)' };
  if (diastolic < 30 || diastolic > 200)
    return { ok: false, error: 'Diastolic out of range (30–200)' };

  const pulse = parseInt0(field(row, 'pulse'));

  return {
    ok: true,
    data: {
      systolic,
      diastolic,
      pulse: pulse != null && pulse >= 20 && pulse <= 250 ? pulse : null,
      notes: String(field(row, 'notes') ?? '').trim(),
      takenAt: date,
    },
  };
}

export function parseRow(kind: ReadingKind, row: RawRow) {
  return kind === 'bloodSugar' ? parseBgRow(row) : parseBpRow(row);
}

// ---- reading -> row (export) --------------------------------------------

export function bgToRow(r: BloodSugarReading): Record<string, string | number> {
  return {
    date: r.takenAt.toISOString(),
    value: r.value,
    context: r.context,
    category: classifyBg(r.value, r.context).label,
    notes: r.notes,
  };
}

export function bpToRow(r: BloodPressureReading): Record<string, string | number> {
  return {
    date: r.takenAt.toISOString(),
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse ?? '',
    category: classifyBp(r.systolic, r.diastolic).label,
    notes: r.notes,
  };
}

/** Example rows used for the downloadable import template. */
export function templateRows(kind: ReadingKind): Record<string, string>[] {
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  if (kind === 'bloodSugar') {
    return [
      { date: now, value: '95', context: 'fasting', notes: 'example row' },
    ];
  }
  return [
    {
      date: now,
      systolic: '120',
      diastolic: '80',
      pulse: '68',
      notes: 'example row',
    },
  ];
}

export function headersFor(kind: ReadingKind): readonly string[] {
  return kind === 'bloodSugar' ? BG_HEADERS : BP_HEADERS;
}
