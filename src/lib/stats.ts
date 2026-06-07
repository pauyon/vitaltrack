/** Generic numeric summary helpers shared by the dashboard. */

export interface NumberSummary {
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  latest: number | null;
}

export function summarize<T>(
  items: T[],
  getValue: (item: T) => number,
): NumberSummary {
  if (items.length === 0) {
    return { count: 0, avg: null, min: null, max: null, latest: null };
  }
  const values = items.map(getValue);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: items.length,
    avg: Math.round((sum / values.length) * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: getValue(items[0]), // items assumed sorted newest-first
  };
}

/** Percentage (0-100, rounded) of items for which predicate is true. */
export function percentTrue<T>(items: T[], predicate: (item: T) => boolean): number {
  if (items.length === 0) return 0;
  const n = items.filter(predicate).length;
  return Math.round((n / items.length) * 100);
}

export type RangeKey = '7' | '30' | '90' | 'all';

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All time' },
];

/** Filter readings (with a `takenAt` Date) to the selected rolling window. */
export function withinRange<T extends { takenAt: Date }>(
  items: T[],
  range: RangeKey,
): T[] {
  if (range === 'all') return items;
  const days = Number(range);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((i) => i.takenAt.getTime() >= cutoff);
}
