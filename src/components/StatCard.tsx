import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function StatCard({
  label,
  value,
  unit,
  caption,
  icon,
  accent = '#6366f1',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: accent,
              bgcolor: `${accent}1f`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
            {value}
            {unit && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' '}
                {unit}
              </Typography>
            )}
          </Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
