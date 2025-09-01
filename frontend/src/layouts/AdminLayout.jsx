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
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  Payment as PaymentIcon,
  MedicalServices as MedicalServicesIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  MonetizationOn as MonetizationOnIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
  Emergency as EmergencyIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';

const drawerWidth = 280;

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Load notifications
    loadNotifications();
  }, [user, navigate]);

  const loadNotifications = async () => {
    try {
      const response = await adminAPI.getNotifications();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleMenuExpand = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setAlert({
        open: true,
        message: 'Logout failed. Please try again.',
        severity: 'error'
      });
    }
    handleUserMenuClose();
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard'
    },
    {
      title: 'User Management',
      icon: <PeopleIcon />,
      children: [
        { title: 'All Users', path: '/admin/users' },
        { title: 'User Details', path: '/admin/users/details' }
      ]
    },
    {
      title: 'Nakes Verification',
      icon: <VerifiedUserIcon />,
      path: '/admin/nakes-verification'
    },
    {
      title: 'Payment Management',
      icon: <PaymentIcon />,
      children: [
        { title: 'All Payments', path: '/admin/payments' },
        { title: 'Revenue Reports', path: '/admin/payments/reports' }
      ]
    },
    {
      title: 'Service Management',
      icon: <MedicalServicesIcon />,
      children: [
        { title: 'All Services', path: '/admin/services' },
        { title: 'Service Categories', path: '/admin/services/categories' }
      ]
    },
    {
      title: 'Reports & Analytics',
      icon: <AssessmentIcon />,
      children: [
        { title: 'User Reports', path: '/admin/reports/users' },
        { title: 'Revenue Reports', path: '/admin/reports/revenue' },
        { title: 'Service Analytics', path: '/admin/reports/services' }
      ]
    },
    {
      title: 'Emergency Monitoring',
      icon: <EmergencyIcon />,
      path: '/admin/emergency'
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      children: [
        { title: 'Security Monitor', path: '/admin/security/monitor' },
        { title: 'Audit Logs', path: '/admin/security/audit' }
      ]
    },
    {
      title: 'System Settings',
      icon: <SettingsIcon />,
      children: [
        { title: 'General Settings', path: '/admin/settings/general' },
        { title: 'Email Templates', path: '/admin/settings/email' },
        { title: 'System Health', path: '/admin/settings/health' }
      ]
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.title];
    const isActive = item.path ? isActiveRoute(item.path) : false;

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleMenuExpand(item.title);
              } else if (item.path) {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }
            }}
            selected={isActive}
            sx={{
              pl: 2 + level * 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <HealthAndSafetyIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" fontWeight="bold" color="primary">
          Nakes Link
        </Typography>
        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
          Admin
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Admin Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <AdminPanelSettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              System Administrator
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Navigation Menu */}
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
            Admin Panel
          </Typography>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
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
              width: drawerWidth
            }
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
          bgcolor: 'grey.50'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { navigate('/admin/profile'); handleUserMenuClose(); }}>
          <PersonIcon sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/admin/settings'); handleUserMenuClose(); }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationMenuClose}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
        {notifications.length > 5 && (
          <MenuItem onClick={() => { navigate('/admin/notifications'); handleNotificationMenuClose(); }}>
            <Typography variant="body2" color="primary" textAlign="center" width="100%">
              View All Notifications
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLayout;