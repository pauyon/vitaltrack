import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { readRowsFromFile } from '../lib/importers';
import { exportCsv } from '../lib/exporters';
import {
  headersFor,
  parseRow,
  templateRows,
  type RawRow,
} from '../lib/readingIO';
import { useToast } from '../context/ToastContext';
import type { ReadingKind } from '../types';

interface PreviewRow {
  index: number;
  raw: RawRow;
  ok: boolean;
  error?: string;
  data?: Record<string, unknown> & { takenAt: Date };
}

interface Props {
  open: boolean;
  kind: ReadingKind;
  onClose: () => void;
  onImport: (
    rows: Array<Record<string, unknown> & { takenAt: Date }>,
  ) => Promise<void>;
}

export default function ImportDialog({ open, kind, onClose, onImport }: Props) {
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [busy, setBusy] = useState(false);

  const label = kind === 'bloodSugar' ? 'Blood Sugar' : 'Blood Pressure';
  const validRows = rows.filter((r) => r.ok);
  const invalidCount = rows.length - validRows.length;

  function reset() {
    setFileName('');
    setRows([]);
    setParseError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFile(file: File) {
    setParseError('');
    setRows([]);
    setFileName(file.name);
    try {
      const raw = await readRowsFromFile(file);
      if (raw.length === 0) {
        setParseError('No rows found in this file.');
        return;
      }
      const parsed: PreviewRow[] = raw.map((r, i) => {
        const res = parseRow(kind, r);
        return {
          index: i + 1,
          raw: r,
          ok: res.ok,
          error: res.error,
          data: res.data as (Record<string, unknown> & { takenAt: Date }) | undefined,
        };
      });
      setRows(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read file');
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setBusy(true);
    try {
      await onImport(validRows.map((r) => r.data!));
      notify(`Imported ${validRows.length} reading${validRows.length === 1 ? '' : 's'}`);
      reset();
      onClose();
    } catch {
      notify('Import failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    exportCsv(`${kind === 'bloodSugar' ? 'blood-sugar' : 'blood-pressure'}-template.csv`, templateRows(kind));
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Import {label} readings</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Upload a CSV or Excel file with columns:{' '}
            <code>{headersFor(kind).join(', ')}</code>. Dates work best in ISO
            format (e.g. 2026-06-01T08:30). Need a starting point?{' '}
            <Link component="button" type="button" onClick={downloadTemplate}>
              Download a template
            </Link>
            .
          </Typography>

          <Box>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => inputRef.current?.click()}
            >
              {fileName || 'Choose file'}
            </Button>
          </Box>

          {parseError && <Alert severity="error">{parseError}</Alert>}

          {rows.length > 0 && (
            <>
              <Stack direction="row" spacing={1}>
                <Chip
                  color="success"
                  label={`${validRows.length} valid`}
                  size="small"
                />
                {invalidCount > 0 && (
                  <Chip
                    color="error"
                    label={`${invalidCount} skipped`}
                    size="small"
                  />
                )}
              </Stack>

              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Status</TableCell>
                      {headersFor(kind).map((h) => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.slice(0, 100).map((r) => (
                      <TableRow key={r.index}>
                        <TableCell>{r.index}</TableCell>
                        <TableCell>
                          {r.ok ? (
                            <Chip label="OK" color="success" size="small" />
                          ) : (
                            <Chip
                              label={r.error ?? 'Invalid'}
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        {headersFor(kind).map((h) => (
                          <TableCell key={h}>
                            {String(
                              r.raw[h] ??
                                r.raw[
                                  Object.keys(r.raw).find(
                                    (k) => k.toLowerCase() === h,
                                  ) ?? ''
                                ] ??
                                '',
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {rows.length > 100 && (
                <Typography variant="caption" color="text.secondary">
                  Showing first 100 of {rows.length} rows. All valid rows will be
                  imported.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="inherit"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={validRows.length === 0 || busy}
          onClick={handleImport}
        >
          {busy
            ? 'Importing…'
            : `Import ${validRows.length || ''} reading${validRows.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
