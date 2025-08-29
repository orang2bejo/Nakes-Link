import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Schedule,
  Person,
  MonetizationOn,
  TrendingUp,
  Notifications,
  Settings,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  VideoCall,
  Chat,
  Phone,
  LocationOn,
  Star,
  Visibility,
  Edit,
  Add,
  MoreVert,
  Refresh,
  Download,
  Share,
  Print,
  FilterList,
  Search,
  Close,
  Warning,
  Info,
  Emergency,
  MedicalServices,
  Assignment,
  Group,
  AccountBalance,
  Analytics,
  Timeline,
  Today,
  Event,
  PersonAdd,
  LocalHospital,
  Psychology,
  Healing,
  ChildCare,
  FitnessCenter,
  Elderly,
  Work,
  Home,
  Business,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const NakesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [quickActionDialog, setQuickActionDialog] = useState({ open: false, type: '' });
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDashboardData = {
        stats: {
          totalPatients: 156,
          todayAppointments: 8,
          monthlyEarnings: 15750000,
          rating: 4.8,
          completedAppointments: 142,
          cancelledAppointments: 14,
          responseTime: '< 5 menit',
          onlineHours: 45,
        },
        recentActivity: [
          {
            id: 1,
            type: 'appointment',
            message: 'Konsultasi dengan Sarah Wijaya selesai',
            time: new Date(Date.now() - 30 * 60 * 1000),
            status: 'completed',
          },
          {
            id: 2,
            type: 'payment',
            message: 'Pembayaran Rp 150.000 diterima',
            time: new Date(Date.now() - 45 * 60 * 1000),
            status: 'success',
          },
          {
            id: 3,
            type: 'review',
            message: 'Review baru dari Ahmad Rizki (5 bintang)',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'info',
          },
          {
            id: 4,
            type: 'appointment',
            message: 'Janji temu baru dari Maya Sari',
            time: new Date(Date.now() - 3 * 60 * 60 * 1000),
            status: 'pending',
          },
        ],
        earningsChart: [
          { month: 'Jan', earnings: 12500000, patients: 120 },
          { month: 'Feb', earnings: 13200000, patients: 135 },
          { month: 'Mar', earnings: 14100000, patients: 142 },
          { month: 'Apr', earnings: 13800000, patients: 138 },
          { month: 'May', earnings: 15200000, patients: 156 },
          { month: 'Jun', earnings: 15750000, patients: 162 },
        ],
        appointmentTypes: [
          { name: 'Konsultasi Online', value: 45, color: '#10b981' },
          { name: 'Kunjungan Rumah', value: 25, color: '#f59e0b' },
          { name: 'Medical Check-up', value: 20, color: '#3b82f6' },
          { name: 'Darurat', value: 10, color: '#ef4444' },
        ],
      };
      
      const mockTodayAppointments = [
        {
          id: 'apt1',
          patient: {
            name: 'Sarah Wijaya',
            avatar: '/api/placeholder/40/40',
            age: 28,
            gender: 'female',
          },
          time: '09:00',
          type: 'consultation',
          status: 'confirmed',
          complaint: 'Sakit kepala dan demam',
          duration: 30,
          fee: 150000,
          isOnline: true,
        },
        {
          id: 'apt2',
          patient: {
            name: 'Ahmad Rizki',
            avatar: '/api/placeholder/40/40',
            age: 35,
            gender: 'male',
          },
          time: '10:30',
          type: 'checkup',
          status: 'confirmed',
          complaint: 'Medical check-up rutin',
          duration: 60,
          fee: 300000,
          isOnline: false,
        },
        {
          id: 'apt3',
          patient: {
            name: 'Maya Sari',
            avatar: '/api/placeholder/40/40',
            age: 42,
            gender: 'female',
          },
          time: '14:00',
          type: 'consultation',
          status: 'pending',
          complaint: 'Konsultasi psikologi',
          duration: 45,
          fee: 200000,
          isOnline: true,
        },
        {
          id: 'apt4',
          patient: {
            name: 'Budi Santoso',
            avatar: '/api/placeholder/40/40',
            age: 50,
            gender: 'male',
          },
          time: '15:30',
          type: 'homecare',
          status: 'confirmed',
          complaint: 'Perawatan luka diabetes',
          duration: 90,
          fee: 400000,
          isOnline: false,
        },
      ];
      
      const mockRecentPatients = [
        {
          id: 'p1',
          name: 'Sarah Wijaya',
          avatar: '/api/placeholder/40/40',
          lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          condition: 'Hipertensi',
          status: 'stable',
          totalVisits: 5,
        },
        {
          id: 'p2',
          name: 'Ahmad Rizki',
          avatar: '/api/placeholder/40/40',
          lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          condition: 'Diabetes Type 2',
          status: 'monitoring',
          totalVisits: 12,
        },
        {
          id: 'p3',
          name: 'Maya Sari',
          avatar: '/api/placeholder/40/40',
          lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          condition: 'Anxiety Disorder',
          status: 'improving',
          totalVisits: 8,
        },
      ];
      
      const mockNotifications = [
        {
          id: 1,
          title: 'Janji Temu Baru',
          message: 'Anda memiliki janji temu baru dari Sarah Wijaya',
          time: new Date(Date.now() - 15 * 60 * 1000),
          type: 'appointment',
          read: false,
        },
        {
          id: 2,
          title: 'Pembayaran Diterima',
          message: 'Pembayaran sebesar Rp 150.000 telah diterima',
          time: new Date(Date.now() - 30 * 60 * 1000),
          type: 'payment',
          read: false,
        },
        {
          id: 3,
          title: 'Review Baru',
          message: 'Ahmad Rizki memberikan review 5 bintang',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'review',
          read: true,
        },
      ];
      
      setDashboardData(mockDashboardData);
      setTodayAppointments(mockTodayAppointments);
      setRecentPatients(mockRecentPatients);
      setNotifications(mockNotifications);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data dashboard',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'cancelled': return <Cancel />;
      case 'completed': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const handleQuickAction = (type) => {
    setQuickActionDialog({ open: true, type });
  };

  const speedDialActions = [
    {
      icon: <PersonAdd />,
      name: 'Tambah Pasien',
      action: () => handleQuickAction('addPatient'),
    },
    {
      icon: <Event />,
      name: 'Buat Jadwal',
      action: () => handleQuickAction('createSchedule'),
    },
    {
      icon: <Assignment />,
      name: 'Laporan',
      action: () => navigate('/nakes/reports'),
    },
    {
      icon: <Settings />,
      name: 'Pengaturan',
      action: () => navigate('/nakes/settings'),
    },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat dashboard..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Selamat datang, {user?.displayName || 'Dokter'}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    color="default"
                  />
                }
                label={isOnline ? 'Online' : 'Offline'}
                sx={{ color: 'white' }}
              />
              
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                <IconButton sx={{ color: 'white' }}>
                  <Notifications />
                </IconButton>
              </Badge>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Pasien
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {dashboardData?.stats.totalPatients}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +12 bulan ini
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <Group />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Hari Ini
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {dashboardData?.stats.todayAppointments}
                    </Typography>
                    <Typography variant="body2" color="info.main">
                      janji temu
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <Today />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pendapatan Bulan Ini
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatCurrency(dashboardData?.stats.monthlyEarnings).replace('Rp', '').trim()}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +15% dari bulan lalu
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <MonetizationOn />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Rating
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {dashboardData?.stats.rating}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      dari 156 ulasan
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <Star />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Appointments */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Jadwal Hari Ini
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/nakes/schedule')}
                  >
                    Lihat Semua
                  </Button>
                </Box>
                
                {todayAppointments.length > 0 ? (
                  <List>
                    {todayAppointments.map((appointment, index) => (
                      <React.Fragment key={appointment.id}>
                        <ListItem
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemIcon>
                            <Avatar src={appointment.patient.avatar}>
                              {appointment.patient.name.charAt(0)}
                            </Avatar>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {appointment.patient.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={appointment.status}
                                  color={getStatusColor(appointment.status)}
                                  icon={getStatusIcon(appointment.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.time} • {appointment.complaint}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    size="small"
                                    label={appointment.isOnline ? 'Online' : 'Offline'}
                                    variant="outlined"
                                    icon={appointment.isOnline ? <VideoCall /> : <LocationOn />}
                                  />
                                  <Typography variant="caption" color="primary">
                                    {formatCurrency(appointment.fee)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {appointment.isOnline && (
                                <IconButton size="small" color="primary">
                                  <VideoCall />
                                </IconButton>
                              )}
                              <IconButton size="small">
                                <Chat />
                              </IconButton>
                              <IconButton size="small">
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Tidak ada jadwal hari ini
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Quick Stats & Actions */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Recent Activity */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Aktivitas Terbaru
                    </Typography>
                    
                    <List dense>
                      {dashboardData?.recentActivity.slice(0, 4).map((activity) => (
                        <ListItem key={activity.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: getStatusColor(activity.status) + '.main',
                              }}
                            >
                              {getStatusIcon(activity.status)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.message}
                            secondary={format(activity.time, 'HH:mm', { locale: id })}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            {/* Quick Actions */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Aksi Cepat
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PersonAdd />}
                          onClick={() => handleQuickAction('addPatient')}
                          sx={{ py: 1.5 }}
                        >
                          Tambah Pasien
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Event />}
                          onClick={() => handleQuickAction('createSchedule')}
                          sx={{ py: 1.5 }}
                        >
                          Buat Jadwal
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Assignment />}
                          onClick={() => navigate('/nakes/reports')}
                          sx={{ py: 1.5 }}
                        >
                          Laporan
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Analytics />}
                          onClick={() => navigate('/nakes/analytics')}
                          sx={{ py: 1.5 }}
                        >
                          Analitik
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Earnings Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Pendapatan 6 Bulan Terakhir
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData?.earningsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <RechartsTooltip
                      formatter={[
                        (value) => [formatCurrency(value), 'Pendapatan'],
                        (value, name, props) => [props.payload.patients, 'Pasien'],
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#667eea"
                      fill="url(#colorEarnings)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Appointment Types */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Jenis Layanan
                </Typography>
                
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.appointmentTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData?.appointmentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Persentase']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <Box sx={{ mt: 2 }}>
                  {dashboardData?.appointmentTypes.map((type) => (
                    <Box key={type.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: type.color,
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {type.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {type.value}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Recent Patients */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Pasien Terbaru
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/nakes/patients')}
                  >
                    Lihat Semua
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {recentPatients.map((patient) => (
                    <Grid item xs={12} sm={6} md={4} key={patient.id}>
                      <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar src={patient.avatar}>
                              {patient.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {patient.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {patient.totalVisits} kunjungan
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" gutterBottom>
                            <strong>Kondisi:</strong> {patient.condition}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Kunjungan terakhir:</strong> {format(patient.lastVisit, 'dd MMM yyyy', { locale: id })}
                          </Typography>
                          
                          <Chip
                            size="small"
                            label={patient.status}
                            color={
                              patient.status === 'stable' ? 'success' :
                              patient.status === 'monitoring' ? 'warning' : 'info'
                            }
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              setSpeedDialOpen(false);
              action.action();
            }}
          />
        ))}
      </SpeedDial>

      {/* Quick Action Dialog */}
      <Dialog
        open={quickActionDialog.open}
        onClose={() => setQuickActionDialog({ open: false, type: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {quickActionDialog.type === 'addPatient' && 'Tambah Pasien Baru'}
          {quickActionDialog.type === 'createSchedule' && 'Buat Jadwal Baru'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Fitur ini akan segera tersedia. Anda akan diarahkan ke halaman yang sesuai.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialog({ open: false, type: '' })}>
            Tutup
          </Button>
          <Button variant="contained">
            Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NakesDashboard;