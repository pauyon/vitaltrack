import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MonitorWeightIcon from '@mui/icons-material/Insights';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ReportDialog, { type ReportOptions } from '../components/ReportDialog';
import { useReadings, toDate } from '../hooks/useReadings';
import { useToast } from '../context/ToastContext';
import { classifyBp } from '../lib/bpCategory';
import { isBgInRange } from '../lib/bgCategory';
import { generateReport } from '../lib/report';
import {
  RANGE_OPTIONS,
  type RangeKey,
  summarize,
  percentTrue,
  withinRange,
} from '../lib/stats';
import type {
  BgContext,
  BloodPressureReading,
  BloodSugarReading,
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

export default function Dashboard() {
  const theme = useTheme();
  const { notify } = useToast();
  const [range, setRange] = useState<RangeKey>('30');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const bgChartRef = useRef<HTMLDivElement>(null);
  const bpChartRef = useRef<HTMLDivElement>(null);

  const { items: bg } = useReadings('bloodSugar', mapBg);
  const { items: bp } = useReadings('bloodPressure', mapBp);

  const bgInRange = useMemo(() => withinRange(bg, range), [bg, range]);
  const bpInRange = useMemo(() => withinRange(bp, range), [bp, range]);

  const bgStats = useMemo(() => summarize(bgInRange, (r) => r.value), [bgInRange]);
  const bgPctInRange = useMemo(
    () => percentTrue(bgInRange, (r) => isBgInRange(r.value, r.context)),
    [bgInRange],
  );
  const sysStats = useMemo(
    () => summarize(bpInRange, (r) => r.systolic),
    [bpInRange],
  );

  const latestBp = bpInRange[0] ?? null;
  const latestBpCat = latestBp
    ? classifyBp(latestBp.systolic, latestBp.diastolic)
    : null;

  // Charts want oldest-first.
  const bgChart = useMemo(
    () =>
      [...bgInRange].reverse().map((r) => ({
        t: r.takenAt.getTime(),
        label: format(r.takenAt, 'MMM d'),
        value: r.value,
      })),
    [bgInRange],
  );
  const bpChart = useMemo(
    () =>
      [...bpInRange].reverse().map((r) => ({
        t: r.takenAt.getTime(),
        label: format(r.takenAt, 'MMM d'),
        systolic: r.systolic,
        diastolic: r.diastolic,
      })),
    [bpInRange],
  );

  const axisColor = theme.palette.text.secondary;
  const gridColor = theme.palette.divider;

  async function handleGenerate(opts: ReportOptions) {
    setReportBusy(true);
    try {
      const rangeLabel =
        RANGE_OPTIONS.find((o) => o.key === range)?.label ?? '';
      const diaAvg = summarize(bpInRange, (r) => r.diastolic).avg;
      const summaryRows: [string, string][] = [
        ['Date range', rangeLabel],
        ['Blood sugar readings', String(bgStats.count)],
        ['Latest blood sugar', bgStats.latest != null ? `${bgStats.latest} mg/dL` : '—'],
        ['Average blood sugar', bgStats.avg != null ? `${bgStats.avg} mg/dL` : '—'],
        [
          'Min / Max blood sugar',
          bgStats.min != null ? `${bgStats.min} / ${bgStats.max} mg/dL` : '—',
        ],
        ['In-range blood sugar', `${bgPctInRange}%`],
        ['Blood pressure readings', String(sysStats.count)],
        [
          'Latest blood pressure',
          latestBp
            ? `${latestBp.systolic}/${latestBp.diastolic} mmHg (${latestBpCat?.label})`
            : '—',
        ],
        [
          'Average blood pressure',
          sysStats.avg != null ? `${sysStats.avg}/${diaAvg} mmHg` : '—',
        ],
      ];

      await generateReport(opts, {
        rangeLabel,
        summaryRows,
        charts: [
          { title: 'Blood Sugar Trend', node: bgChart.length ? bgChartRef.current : null },
          { title: 'Blood Pressure Trend', node: bpChart.length ? bpChartRef.current : null },
        ],
        bg: bgInRange,
        bp: bpInRange,
      });
      notify('Report ready');
      setReportOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not build report', 'error');
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Trends across your recent readings"
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_e, v) => v && setRange(v)}
          color="primary"
        >
          {RANGE_OPTIONS.map((o) => (
            <ToggleButton key={o.key} value={o.key} sx={{ px: 1.5 }}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => setReportOpen(true)}
        >
          Export report
        </Button>
      </PageHeader>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Latest blood sugar"
            value={bgStats.latest ?? '—'}
            unit={bgStats.latest != null ? 'mg/dL' : undefined}
            caption={`${bgStats.count} readings`}
            icon={<BloodtypeIcon />}
            accent={theme.palette.error.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Average blood sugar"
            value={bgStats.avg ?? '—'}
            unit={bgStats.avg != null ? 'mg/dL' : undefined}
            caption={
              bgStats.min != null ? `min ${bgStats.min} • max ${bgStats.max}` : ''
            }
            icon={<MonitorWeightIcon />}
            accent={theme.palette.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="In-range blood sugar"
            value={`${bgPctInRange}%`}
            caption="of readings in target"
            icon={<CheckCircleIcon />}
            accent={theme.palette.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Latest blood pressure"
            value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '—'}
            unit={latestBp ? 'mmHg' : undefined}
            caption={latestBpCat ? latestBpCat.label : `${sysStats.count} readings`}
            icon={<FavoriteIcon />}
            accent={latestBpCat?.color ?? theme.palette.primary.main}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title="Blood sugar trend"
            subtitle="mg/dL over time (green band = typical target)"
          >
            {bgChart.length === 0 ? (
              <EmptyState message="No blood sugar readings in this range yet." />
            ) : (
              <Box ref={bgChartRef}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={bgChart}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={theme.palette.error.main}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={theme.palette.error.main}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <ReferenceArea
                    y1={70}
                    y2={140}
                    fill={theme.palette.success.main}
                    fillOpacity={0.08}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
                  <YAxis stroke={axisColor} fontSize={12} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${gridColor}`,
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="mg/dL"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    fill="url(#bgFill)"
                    dot={{ r: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title="Blood pressure trend"
            subtitle="Systolic & diastolic (mmHg) over time"
          >
            {bpChart.length === 0 ? (
              <EmptyState message="No blood pressure readings in this range yet." />
            ) : (
              <Box ref={bpChartRef}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={bpChart}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
                  <YAxis stroke={axisColor} fontSize={12} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${gridColor}`,
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <ReportDialog
        open={reportOpen}
        busy={reportBusy}
        onClose={() => setReportOpen(false)}
        onGenerate={handleGenerate}
      />
    </Box>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={0.25} sx={{ mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {children}
    </Paper>
  );
}
