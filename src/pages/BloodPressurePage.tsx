import { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import ReadingDialog from '../components/ReadingDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import ExportMenu from '../components/ExportMenu';
import ImportDialog from '../components/ImportDialog';
import { useReadings, toDate } from '../hooks/useReadings';
import { useToast } from '../context/ToastContext';
import { classifyBp } from '../lib/bpCategory';
import type { BloodPressureReading } from '../types';

function mapBp(id: string, data: Record<string, unknown>): BloodPressureReading {
  const pulse = data.pulse;
  return {
    id,
    systolic: Number(data.systolic ?? 0),
    diastolic: Number(data.diastolic ?? 0),
    pulse: pulse == null || pulse === '' ? null : Number(pulse),
    notes: String(data.notes ?? ''),
    takenAt: toDate(data.takenAt),
    createdAt: toDate(data.createdAt),
  };
}

export default function BloodPressurePage() {
  const { items, loading, add, update, remove, addMany } = useReadings(
    'bloodPressure',
    mapBp,
  );
  const { notify } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BloodPressureReading | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const columns = useMemo<GridColDef<BloodPressureReading>[]>(
    () => [
      {
        field: 'takenAt',
        headerName: 'Date & time',
        type: 'dateTime',
        flex: 1.2,
        minWidth: 170,
        valueGetter: (value: Date) => value,
        renderCell: (params) =>
          params.value ? format(params.value as Date, 'MMM d, yyyy • h:mm a') : '',
      },
      {
        field: 'reading',
        headerName: 'mmHg',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        valueGetter: (_value, row) => `${row.systolic}/${row.diastolic}`,
        renderCell: (params) => {
          const row = params.row;
          const cat = classifyBp(row.systolic, row.diastolic);
          return (
            <Chip
              label={`${row.systolic}/${row.diastolic}`}
              size="small"
              sx={{ fontWeight: 700, color: '#fff', bgcolor: cat.color }}
            />
          );
        },
      },
      {
        field: 'systolic',
        headerName: 'Systolic',
        type: 'number',
        flex: 0.6,
        minWidth: 100,
      },
      {
        field: 'diastolic',
        headerName: 'Diastolic',
        type: 'number',
        flex: 0.6,
        minWidth: 100,
      },
      {
        field: 'pulse',
        headerName: 'Pulse',
        type: 'number',
        flex: 0.5,
        minWidth: 90,
        valueFormatter: (value: number | null) => (value == null ? '—' : value),
      },
      {
        field: 'category',
        headerName: 'Category',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        valueGetter: (_value, row) =>
          classifyBp(row.systolic, row.diastolic).label,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        flex: 1.2,
        minWidth: 150,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 90,
        getActions: (params) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => {
              setEditing(params.row);
              setDialogOpen(true);
            }}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => setDeleteId(params.row.id)}
          />,
        ],
      },
    ],
    [],
  );

  async function handleSubmit(data: Record<string, unknown> & { takenAt: Date }) {
    try {
      if (editing) {
        await update(editing.id, data);
        notify('Reading updated');
      } else {
        await add(data);
        notify('Reading added');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      notify('Could not save reading', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      notify('Reading deleted');
    } catch {
      notify('Could not delete reading', 'error');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Blood Pressure"
        subtitle="All your blood pressure readings (mmHg)"
        actionLabel="Add reading"
        onAction={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<UploadFileIcon />}
          onClick={() => setImportOpen(true)}
        >
          Import
        </Button>
        <ExportMenu kind="bloodPressure" readings={items} />
      </PageHeader>

      <Paper sx={{ height: 'calc(100vh - 220px)', minHeight: 420 }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          showToolbar
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'takenAt', sort: 'desc' }] },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      <ReadingDialog
        open={dialogOpen}
        kind="bloodPressure"
        editing={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete reading?"
        message="This blood pressure reading will be permanently removed."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />

      <ImportDialog
        open={importOpen}
        kind="bloodPressure"
        onClose={() => setImportOpen(false)}
        onImport={addMany}
      />
    </Box>
  );
}
