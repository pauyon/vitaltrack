import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  BG_CONTEXTS,
  BG_CONTEXT_LABELS,
  type BloodPressureReading,
  type BloodSugarReading,
  type ReadingKind,
} from '../types';

// ---- Schemas -------------------------------------------------------------

const bgSchema = z.object({
  value: z
    .number({ error: 'Enter a number' })
    .int('Whole number')
    .min(20, 'Too low')
    .max(800, 'Too high'),
  context: z.enum(BG_CONTEXTS),
  takenAt: z.date({ error: 'Pick a date & time' }),
  notes: z.string().max(280, 'Keep notes under 280 characters').optional(),
});

const bpSchema = z.object({
  systolic: z
    .number({ error: 'Enter a number' })
    .int('Whole number')
    .min(50, 'Too low')
    .max(300, 'Too high'),
  diastolic: z
    .number({ error: 'Enter a number' })
    .int('Whole number')
    .min(30, 'Too low')
    .max(200, 'Too high'),
  // Empty pulse field comes through as NaN (valueAsNumber); treated as "not provided".
  pulse: z.union([
    z.number().int('Whole number').min(20, 'Too low').max(250, 'Too high'),
    z.nan(),
  ]),
  takenAt: z.date({ error: 'Pick a date & time' }),
  notes: z.string().max(280, 'Keep notes under 280 characters').optional(),
});

type BgForm = z.infer<typeof bgSchema>;
type BpForm = z.infer<typeof bpSchema>;

type AnyReading = BloodSugarReading | BloodPressureReading;

interface Props {
  open: boolean;
  kind: ReadingKind;
  /** Existing reading when editing; null when adding. */
  editing: AnyReading | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown> & { takenAt: Date }) => Promise<void>;
}

export default function ReadingDialog(props: Props) {
  return props.kind === 'bloodSugar' ? (
    <BgDialog {...props} />
  ) : (
    <BpDialog {...props} />
  );
}

// ---- Blood sugar ---------------------------------------------------------

function BgDialog({ open, editing, onClose, onSubmit }: Props) {
  const existing = editing as BloodSugarReading | null;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BgForm>({ resolver: zodResolver(bgSchema) });

  useEffect(() => {
    if (!open) return;
    reset({
      value: existing?.value ?? NaN,
      context: existing?.context ?? 'fasting',
      takenAt: existing?.takenAt ?? new Date(),
      notes: existing?.notes ?? '',
    });
  }, [open, existing, reset]);

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      value: v.value,
      context: v.context,
      takenAt: v.takenAt,
      notes: v.notes ?? '',
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{existing ? 'Edit' : 'Add'} blood sugar reading</DialogTitle>
      <form onSubmit={submit} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Blood sugar (mg/dL)"
              type="number"
              autoFocus
              error={!!errors.value}
              helperText={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
            />
            <TextField
              label="Context"
              select
              defaultValue="fasting"
              error={!!errors.context}
              helperText={errors.context?.message}
              {...register('context')}
            >
              {BG_CONTEXTS.map((c) => (
                <MenuItem key={c} value={c}>
                  {BG_CONTEXT_LABELS[c]}
                </MenuItem>
              ))}
            </TextField>
            <Controller
              control={control}
              name="takenAt"
              render={({ field }) => (
                <DateTimePicker
                  label="Date & time"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      error: !!errors.takenAt,
                      helperText: errors.takenAt?.message,
                    },
                  }}
                />
              )}
            />
            <TextField
              label="Notes (optional)"
              multiline
              minRows={2}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              {...register('notes')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {existing ? 'Save changes' : 'Add reading'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ---- Blood pressure ------------------------------------------------------

function BpDialog({ open, editing, onClose, onSubmit }: Props) {
  const existing = editing as BloodPressureReading | null;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BpForm>({ resolver: zodResolver(bpSchema) });

  useEffect(() => {
    if (!open) return;
    reset({
      systolic: existing?.systolic ?? NaN,
      diastolic: existing?.diastolic ?? NaN,
      pulse: existing?.pulse ?? NaN,
      takenAt: existing?.takenAt ?? new Date(),
      notes: existing?.notes ?? '',
    });
  }, [open, existing, reset]);

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      systolic: v.systolic,
      diastolic: v.diastolic,
      pulse: typeof v.pulse === 'number' && !Number.isNaN(v.pulse) ? v.pulse : null,
      takenAt: v.takenAt,
      notes: v.notes ?? '',
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {existing ? 'Edit' : 'Add'} blood pressure reading
      </DialogTitle>
      <form onSubmit={submit} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Systolic"
                type="number"
                autoFocus
                fullWidth
                error={!!errors.systolic}
                helperText={errors.systolic?.message}
                {...register('systolic', { valueAsNumber: true })}
              />
              <TextField
                label="Diastolic"
                type="number"
                fullWidth
                error={!!errors.diastolic}
                helperText={errors.diastolic?.message}
                {...register('diastolic', { valueAsNumber: true })}
              />
            </Stack>
            <TextField
              label="Pulse (bpm, optional)"
              type="number"
              error={!!errors.pulse}
              helperText={errors.pulse?.message}
              {...register('pulse', { valueAsNumber: true })}
            />
            <Controller
              control={control}
              name="takenAt"
              render={({ field }) => (
                <DateTimePicker
                  label="Date & time"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      error: !!errors.takenAt,
                      helperText: errors.takenAt?.message,
                    },
                  }}
                />
              )}
            />
            <TextField
              label="Notes (optional)"
              multiline
              minRows={2}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              {...register('notes')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {existing ? 'Save changes' : 'Add reading'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
