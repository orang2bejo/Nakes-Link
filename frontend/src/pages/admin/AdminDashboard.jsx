import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, chartResponse, activitiesResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getChartData({ period: '30d' }),
        adminAPI.getRecentActivities({ limit: 10 })
      ]);

      setDashboardData(statsResponse.data);
      setChartData(chartResponse.data);
      setRecentActivities(activitiesResponse.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <PeopleIcon color="primary" />;
      case 'appointment':
        return <ScheduleIcon color="info" />;
      case 'payment':
        return <PaymentIcon color="success" />;
      case 'review':
        return <StarIcon color="warning" />;
      default:
        return <DashboardIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_registration':
        return 'primary';
      case 'appointment':
        return 'info';
      case 'payment':
        return 'success';
      case 'review':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Chart configurations
  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue Trend (Last 30 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const userRegistrationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Registrations (Last 30 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const appointmentStatusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Appointment Status Distribution',
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Box>
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('/admin/users')}>Manage Users</MenuItem>
            <MenuItem onClick={() => navigate('/admin/nakes')}>Verify Nakes</MenuItem>
            <MenuItem onClick={() => navigate('/admin/payments')}>View Payments</MenuItem>
            <MenuItem onClick={() => navigate('/admin/reports')}>View Reports</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Users Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData?.users?.total || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" ml={0.5}>
                      +{dashboardData?.users?.newToday || 0} today
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(dashboardData?.revenue?.total || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" ml={0.5}>
                      {formatCurrency(dashboardData?.revenue?.today || 0)} today
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <PaymentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Appointments Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Appointments
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData?.appointments?.total || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <ScheduleIcon color="info" fontSize="small" />
                    <Typography variant="body2" color="info.main" ml={0.5}>
                      {dashboardData?.appointments?.today || 0} today
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Verifications */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending Verifications
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData?.nakes?.pending || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="body2" color="warning.main" ml={0.5}>
                      Needs attention
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <HospitalIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              {chartData?.revenueData && (
                <Line
                  data={{
                    labels: chartData.revenueData.map(item => formatDate(item._id)),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: chartData.revenueData.map(item => item.revenue),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                      }
                    ]
                  }}
                  options={revenueChartOptions}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Appointment Status Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Status
              </Typography>
              {chartData?.appointmentStatus && (
                <Doughnut
                  data={{
                    labels: chartData.appointmentStatus.map(item => item._id),
                    datasets: [
                      {
                        data: chartData.appointmentStatus.map(item => item.count),
                        backgroundColor: [
                          '#4CAF50',
                          '#FF9800',
                          '#F44336',
                          '#2196F3'
                        ]
                      }
                    ]
                  }}
                  options={appointmentStatusChartOptions}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Registration Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Registrations
              </Typography>
              {chartData?.userRegistrations && (
                <Bar
                  data={{
                    labels: chartData.userRegistrations.map(item => formatDate(item._id)),
                    datasets: [
                      {
                        label: 'New Users',
                        data: chartData.userRegistrations.map(item => item.count),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={userRegistrationChartOptions}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.main` }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={formatDate(activity.timestamp)}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
              {recentActivities.length === 0 && (
                <Typography color="textSecondary" textAlign="center" py={2}>
                  No recent activities
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ mb: 2 }}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HospitalIcon />}
                    onClick={() => navigate('/admin/nakes')}
                    sx={{ mb: 2 }}
                  >
                    Verify Nakes
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaymentIcon />}
                    onClick={() => navigate('/admin/payments')}
                    sx={{ mb: 2 }}
                  >
                    View Payments
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/admin/reports')}
                    sx={{ mb: 2 }}
                  >
                    View Reports
                  </Button>
                </Grid>
              </Grid>

              {/* System Status */}
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  System Status
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">All systems operational</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">Database connected</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">Payment gateway active</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;