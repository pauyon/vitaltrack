export const BG_CONTEXTS = [
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'random',
] as const;

export type BgContext = (typeof BG_CONTEXTS)[number];

export const BG_CONTEXT_LABELS: Record<BgContext, string> = {
  fasting: 'Fasting',
  pre_meal: 'Before meal',
  post_meal: 'After meal',
  bedtime: 'Bedtime',
  random: 'Random',
};

/** Blood glucose reading, value stored in mg/dL. */
export interface BloodSugarReading {
  id: string;
  value: number;
  context: BgContext;
  notes: string;
  takenAt: Date;
  createdAt: Date;
}

/** Blood pressure reading, systolic/diastolic in mmHg, pulse in bpm. */
export interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  notes: string;
  takenAt: Date;
  createdAt: Date;
}

export type ReadingKind = 'bloodSugar' | 'bloodPressure';

/** Firestore collection name for each reading kind. */
export const COLLECTION: Record<ReadingKind, string> = {
  bloodSugar: 'bloodSugar',
  bloodPressure: 'bloodPressure',
};
