import { useEffect, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

const DRAWER_WIDTH = 248;
const NAV_STORAGE_KEY = 'ht-nav-open';

const NAV = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/blood-sugar', label: 'Blood Sugar', icon: <BloodtypeIcon /> },
  { to: '/blood-pressure', label: 'Blood Pressure', icon: <FavoriteIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(() => {
    const saved = localStorage.getItem(NAV_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, String(desktopOpen));
  }, [desktopOpen]);

  // The hamburger toggles the persistent drawer on desktop and opens the
  // temporary overlay drawer on mobile.
  const handleNavToggle = () => {
    if (isDesktop) setDesktopOpen((o) => !o);
    else setMobileOpen(true);
  };

  // How far the AppBar/content are pushed right by the open desktop drawer.
  const shift = isDesktop && desktopOpen ? DRAWER_WIDTH : 0;

  const transition = theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: desktopOpen
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  });

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
        >
          <MonitorHeartIcon fontSize="small" />
        </Box>
        <Typography variant="h6" noWrap>
          VitalTrack
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {NAV.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontWeight: selected ? 700 : 500 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          For personal tracking only — not medical advice.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${shift}px)`,
          ml: `${shift}px`,
          transition,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Tooltip title={isDesktop && desktopOpen ? 'Collapse menu' : 'Menu'}>
            <IconButton
              edge="start"
              onClick={handleNavToggle}
              aria-label="Toggle navigation"
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggle} aria-label="Toggle color mode">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Account menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {(user?.displayName || user?.email || '?')[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.displayName || 'Signed in'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile: temporary overlay drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop: persistent drawer that slides open/closed */}
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: `${shift}px`,
          minWidth: 0,
          transition,
        }}
      >
        <Toolbar />
        <Stack sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Stack>
      </Box>
    </Box>
  );
}
