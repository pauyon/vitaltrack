import { Box, Stack, Typography } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import type { ReactNode } from 'react';

export default function EmptyState({
  message,
  icon,
  height = 280,
}: {
  message: string;
  icon?: ReactNode;
  height?: number;
}) {
  return (
    <Box
      sx={{
        height,
        display: 'grid',
        placeItems: 'center',
        color: 'text.secondary',
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        {icon ?? <InsightsIcon fontSize="large" />}
        <Typography variant="body2">{message}</Typography>
      </Stack>
    </Box>
  );
}
