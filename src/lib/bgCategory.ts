import type { BgContext } from '../types';

export type BgLevel = 'low' | 'normal' | 'elevated' | 'high';

export interface BgCategory {
  level: BgLevel;
  label: string;
  /** MUI palette-ish color used for chips and chart accents. */
  color: string;
}

const CATEGORY: Record<BgLevel, Omit<BgCategory, 'level'>> = {
  low: { label: 'Low', color: '#d32f2f' },
  normal: { label: 'In range', color: '#2e7d32' },
  elevated: { label: 'Elevated', color: '#ed6c02' },
  high: { label: 'High', color: '#c62828' },
};

/**
 * Classify a blood glucose value (mg/dL). Target ranges depend on whether the
 * reading was taken fasting/before a meal vs. after a meal. Reference ranges
 * follow common ADA guidance and are for context only, not medical advice.
 */
export function classifyBg(value: number, context: BgContext): BgCategory {
  if (value < 70) return { level: 'low', ...CATEGORY.low };

  const postMeal = context === 'post_meal';
  const upperNormal = postMeal ? 140 : 100;
  const upperElevated = postMeal ? 180 : 125;

  let level: BgLevel;
  if (value <= upperNormal) level = 'normal';
  else if (value <= upperElevated) level = 'elevated';
  else level = 'high';

  return { level, ...CATEGORY[level] };
}

/** Whether a reading counts as "in range" for in-range-% stats. */
export function isBgInRange(value: number, context: BgContext): boolean {
  return classifyBg(value, context).level === 'normal';
}
