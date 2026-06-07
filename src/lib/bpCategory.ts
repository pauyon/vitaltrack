export type BpLevel =
  | 'low'
  | 'normal'
  | 'elevated'
  | 'stage1'
  | 'stage2'
  | 'crisis';

export interface BpCategory {
  level: BpLevel;
  label: string;
  color: string;
}

const CATEGORY: Record<BpLevel, Omit<BpCategory, 'level'>> = {
  low: { label: 'Low', color: '#0288d1' },
  normal: { label: 'Normal', color: '#2e7d32' },
  elevated: { label: 'Elevated', color: '#9e9d24' },
  stage1: { label: 'Stage 1', color: '#ed6c02' },
  stage2: { label: 'Stage 2', color: '#d32f2f' },
  crisis: { label: 'Crisis', color: '#b71c1c' },
};

/**
 * Classify a blood pressure reading per ACC/AHA categories. When systolic and
 * diastolic fall in different categories, the higher (more severe) one wins.
 * Reference only, not medical advice.
 */
export function classifyBp(systolic: number, diastolic: number): BpCategory {
  let level: BpLevel;
  if (systolic > 180 || diastolic > 120) level = 'crisis';
  else if (systolic >= 140 || diastolic >= 90) level = 'stage2';
  else if (systolic >= 130 || diastolic >= 80) level = 'stage1';
  else if (systolic >= 120) level = 'elevated';
  else if (systolic < 90 || diastolic < 60) level = 'low';
  else level = 'normal';

  return { level, ...CATEGORY[level] };
}
