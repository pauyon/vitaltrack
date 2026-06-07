import { useState } from 'react';
import { Button, ListItemIcon, Menu, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import GridOnIcon from '@mui/icons-material/GridOn';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import { exportCsv, exportExcel, exportPdfTables } from '../lib/exporters';
import { bgToRow, bpToRow } from '../lib/readingIO';
import { useToast } from '../context/ToastContext';
import type {
  BloodPressureReading,
  BloodSugarReading,
  ReadingKind,
} from '../types';

interface Props {
  kind: ReadingKind;
  readings: (BloodSugarReading | BloodPressureReading)[];
}

export default function ExportMenu({ kind, readings }: Props) {
  const { notify } = useToast();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const close = () => setAnchorEl(null);

  const label = kind === 'bloodSugar' ? 'blood-sugar' : 'blood-pressure';
  const stamp = format(new Date(), 'yyyy-MM-dd');

  function rows() {
    return kind === 'bloodSugar'
      ? (readings as BloodSugarReading[]).map(bgToRow)
      : (readings as BloodPressureReading[]).map(bpToRow);
  }

  async function run(kindOf: 'csv' | 'excel' | 'pdf') {
    close();
    if (readings.length === 0) {
      notify('Nothing to export yet', 'info');
      return;
    }
    try {
      const data = rows();
      if (kindOf === 'csv') {
        await exportCsv(`${label}-${stamp}.csv`, data);
      } else if (kindOf === 'excel') {
        await exportExcel(`${label}-${stamp}.xlsx`, [
          { name: label, rows: data },
        ]);
      } else {
        const columns = Object.keys(data[0]);
        await exportPdfTables(`${label}-${stamp}.pdf`, [
          {
            title:
              kind === 'bloodSugar'
                ? 'Blood Sugar Readings'
                : 'Blood Pressure Readings',
            columns,
            rows: data.map((r) => columns.map((c) => r[c] as string | number)),
          },
        ]);
      }
      notify('Export ready');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<DownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={close}>
        <MenuItem onClick={() => run('csv')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          CSV (.csv)
        </MenuItem>
        <MenuItem onClick={() => run('excel')}>
          <ListItemIcon>
            <GridOnIcon fontSize="small" />
          </ListItemIcon>
          Excel (.xlsx)
        </MenuItem>
        <MenuItem onClick={() => run('pdf')}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          PDF (.pdf)
        </MenuItem>
      </Menu>
    </>
  );
}
