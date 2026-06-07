import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        mb: 3,
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        {children}
        {actionLabel && onAction && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
