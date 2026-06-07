import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import logo from '../assets/logo.svg';

/** Centered card on a gradient backdrop, shared by Login and SignUp. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,0.25), transparent), radial-gradient(900px 500px at 110% 110%, rgba(236,72,153,0.22), transparent)',
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="VitalTrack"
              sx={{ width: 56, height: 56 }}
            />
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Box>
  );
}
