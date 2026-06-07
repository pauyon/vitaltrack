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
import { classifyBg } from '../lib/bgCategory';
import {
  BG_CONTEXT_LABELS,
  type BgContext,
  type BloodSugarReading,
} from '../types';

function mapBg(id: string, data: Record<string, unknown>): BloodSugarReading {
  return {
    id,
    value: Number(data.value ?? 0),
    context: (data.context as BgContext) ?? 'random',
    notes: String(data.notes ?? ''),
    takenAt: toDate(data.takenAt),
    createdAt: toDate(data.createdAt),
  };
}

export default function BloodSugarPage() {
  const { items, loading, add, update, remove, addMany } = useReadings(
    'bloodSugar',
    mapBg,
  );
  const { notify } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BloodSugarReading | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const columns = useMemo<GridColDef<BloodSugarReading>[]>(
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
        field: 'value',
        headerName: 'mg/dL',
        type: 'number',
        flex: 0.7,
        minWidth: 110,
        renderCell: (params) => {
          const row = params.row;
          const cat = classifyBg(row.value, row.context);
          return (
            <Chip
              label={row.value}
              size="small"
              sx={{
                fontWeight: 700,
                color: '#fff',
                bgcolor: cat.color,
              }}
            />
          );
        },
      },
      {
        field: 'category',
        headerName: 'Category',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        valueGetter: (_value, row) => classifyBg(row.value, row.context).label,
      },
      {
        field: 'context',
        headerName: 'Context',
        flex: 0.9,
        minWidth: 130,
        valueFormatter: (value: BgContext) => BG_CONTEXT_LABELS[value] ?? value,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        flex: 1.4,
        minWidth: 160,
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
        title="Blood Sugar"
        subtitle="All your glucose readings (mg/dL)"
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
        <ExportMenu kind="bloodSugar" readings={items} />
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
        kind="bloodSugar"
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
        message="This blood sugar reading will be permanently removed."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />

      <ImportDialog
        open={importOpen}
        kind="bloodSugar"
        onClose={() => setImportOpen(false)}
        onImport={addMany}
      />
    </Box>
  );
}
