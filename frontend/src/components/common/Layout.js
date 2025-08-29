import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  Settings,
  Dashboard,
  Person,
  LocalHospital,
  CalendarToday,
  Payment,
  AccountBalanceWallet,
  Chat,
  Assignment,
  Search,
  People,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { notificationsAPI } from '../../services/api';
import { useQuery } from 'react-query';
import NavigationItem from './NavigationItem';
import NotificationPanel from './NotificationPanel';
import UserMenu from './UserMenu';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Get unread notifications count
  const { data: unreadCount = 0 } = useQuery(
    'unreadNotifications',
    () => notificationsAPI.getUnreadCount().then(res => res.data.count),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!user,
    }
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
      },
      {
        text: 'Profil',
        icon: <Person />,
        path: '/profile',
      },
    ];

    if (user?.role === 'patient') {
      return [
        ...commonItems,
        {
          text: 'Cari Layanan',
          icon: <Search />,
          path: '/search',
        },
        {
          text: 'Janji Temu',
          icon: <CalendarToday />,
          path: '/appointments',
        },
        {
          text: 'Rekam Medis',
          icon: <Assignment />,
          path: '/medical-records',
        },
        {
          text: 'Pembayaran',
          icon: <Payment />,
          path: '/payments',
        },
        {
          text: 'Dompet',
          icon: <AccountBalanceWallet />,
          path: '/wallet',
        },
        {
          text: 'Chat',
          icon: <Chat />,
          path: '/chat',
        },
      ];
    }

    if (user?.role === 'nakes') {
      return [
        ...commonItems,
        {
          text: 'Layanan Saya',
          icon: <LocalHospital />,
          path: '/services',
        },
        {
          text: 'Janji Temu',
          icon: <CalendarToday />,
          path: '/appointments',
        },
        {
          text: 'Pasien',
          icon: <People />,
          path: '/patients',
        },
        {
          text: 'Dompet',
          icon: <AccountBalanceWallet />,
          path: '/wallet',
        },
        {
          text: 'Chat',
          icon: <Chat />,
          path: '/chat',
        },
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <LocalHospital />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          NakesLink
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          src={user?.photoURL}
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            bgcolor: 'primary.main',
          }}
        >
          {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {user?.displayName || `${user?.firstName} ${user?.lastName}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {user?.email}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 1,
            bgcolor: user?.role === 'nakes' ? 'primary.100' : 'secondary.100',
            color: user?.role === 'nakes' ? 'primary.800' : 'secondary.800',
            textTransform: 'capitalize',
          }}
        >
          {user?.role === 'nakes' ? 'Tenaga Kesehatan' : 'Pasien'}
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
          />
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          NakesLink v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notifikasi">
            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Profil">
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                src={user?.photoURL}
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              >
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* User Menu */}
      <UserMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
        user={user}
      />

      {/* Notification Panel */}
      <NotificationPanel
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
      />
    </Box>
  );
};

export default Layout;