import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
} from '@mui/material';

export interface ReportOptions {
  summary: boolean;
  charts: boolean;
  bgTable: boolean;
  bpTable: boolean;
}

interface Props {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onGenerate: (opts: ReportOptions) => void;
}

const ITEMS: { key: keyof ReportOptions; label: string }[] = [
  { key: 'summary', label: 'Summary statistics' },
  { key: 'charts', label: 'Trend charts' },
  { key: 'bgTable', label: 'Blood sugar readings table' },
  { key: 'bpTable', label: 'Blood pressure readings table' },
];

export default function ReportDialog({ open, busy, onClose, onGenerate }: Props) {
  const [opts, setOpts] = useState<ReportOptions>({
    summary: true,
    charts: true,
    bgTable: false,
    bpTable: false,
  });

  const noneSelected = !Object.values(opts).some(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export PDF report</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1.5 }}>
          Choose what to include. Everything goes into one PDF — pick the summary,
          the readings tables, or both.
        </DialogContentText>
        <FormGroup>
          {ITEMS.map((item) => (
            <FormControlLabel
              key={item.key}
              control={
                <Checkbox
                  checked={opts[item.key]}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, [item.key]: e.target.checked }))
                  }
                />
              }
              label={item.label}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={noneSelected || busy}
          onClick={() => onGenerate(opts)}
        >
          {busy ? 'Generating…' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
