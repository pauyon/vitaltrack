import { createTheme, type Theme } from '@mui/material/styles';

type Mode = 'light' | 'dark';

/**
 * Flat, modern theme: soft surfaces, low elevation, rounded corners, a bold
 * indigo→violet accent, and the Inter typeface.
 */
export function buildTheme(mode: Mode): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: '#6366f1' }, // indigo
      secondary: { main: '#ec4899' }, // pink
      success: { main: '#10b981' },
      warning: { main: '#f59e0b' },
      error: { main: '#ef4444' },
      info: { main: '#0ea5e9' },
      background: {
        default: isDark ? '#0b0f1a' : '#f4f6fb',
        paper: isDark ? '#141a2a' : '#ffffff',
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily:
        '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontWeight: 700, letterSpacing: -0.3 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'}`,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 10,
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'primary' && {
                backgroundImage:
                  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: 'none',
              }),
          }),
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'}`,
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
    },
  });
}
