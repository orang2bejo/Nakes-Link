import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CalendarToday,
  LocalHospital,
  AccountBalanceWallet,
  Chat,
  History,
  Add,
  Notifications,
  TrendingUp,
  Schedule,
  Payment,
  HealthAndSafety,
  Emergency,
  Star,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentActivities: [],
    walletBalance: 0,
    unreadMessages: 0,
    healthScore: 85,
    loading: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboardData({
        upcomingAppointments: [
          {
            id: 1,
            doctorName: 'Dr. Sarah Wijaya',
            specialty: 'Dokter Umum',
            date: new Date(Date.now() + 86400000), // Tomorrow
            time: '10:00',
            type: 'Konsultasi Online',
            status: 'confirmed',
          },
          {
            id: 2,
            doctorName: 'Dr. Ahmad Hidayat',
            specialty: 'Spesialis Jantung',
            date: new Date(Date.now() + 172800000), // Day after tomorrow
            time: '14:30',
            type: 'Pemeriksaan Rutin',
            status: 'pending',
          },
        ],
        recentActivities: [
          {
            id: 1,
            type: 'appointment',
            title: 'Konsultasi dengan Dr. Sarah Wijaya',
            description: 'Konsultasi online selesai',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            icon: LocalHospital,
            color: 'success',
          },
          {
            id: 2,
            type: 'payment',
            title: 'Pembayaran Berhasil',
            description: 'Rp 150.000 untuk konsultasi',
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            icon: Payment,
            color: 'primary',
          },
          {
            id: 3,
            type: 'medical_record',
            title: 'Rekam Medis Diperbarui',
            description: 'Hasil lab ditambahkan',
            timestamp: new Date(Date.now() - 86400000), // Yesterday
            icon: HealthAndSafety,
            color: 'info',
          },
        ],
        walletBalance: 500000,
        unreadMessages: 3,
        healthScore: 85,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const quickActions = [
    {
      title: 'Buat Janji',
      description: 'Jadwalkan konsultasi',
      icon: CalendarToday,
      color: 'primary',
      path: '/appointments/new',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Cari Dokter',
      description: 'Temukan spesialis',
      icon: LocalHospital,
      color: 'success',
      path: '/doctors',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      title: 'Chat Dokter',
      description: 'Konsultasi online',
      icon: Chat,
      color: 'info',
      path: '/chat',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    },
    {
      title: 'Darurat',
      description: 'Bantuan segera',
      icon: Emergency,
      color: 'error',
      path: '/emergency',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (dashboardData.loading) {
    return <LoadingSpinner fullScreen message="Memuat dashboard..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Selamat datang, {user?.firstName || 'Pasien'}! 👋
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Kelola kesehatan Anda dengan mudah melalui platform NakesLink
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<HealthAndSafety />}
                  label={`Skor Kesehatan: ${dashboardData.healthScore}%`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip
                  icon={<Notifications />}
                  label={`${dashboardData.unreadMessages} Pesan Baru`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={user?.photoURL}
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    border: '3px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
                <Typography variant="h6">{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Member sejak {format(new Date(user?.createdAt || Date.now()), 'MMMM yyyy', { locale: id })}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Aksi Cepat
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={action.title}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    background: action.gradient,
                    color: 'white',
                    '&:hover': {
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <action.icon sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      <Grid container spacing={4}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Janji Temu Mendatang
                  </Typography>
                  <Button
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/appointments')}
                    sx={{ textTransform: 'none' }}
                  >
                    Lihat Semua
                  </Button>
                </Box>

                {dashboardData.upcomingAppointments.length > 0 ? (
                  <List>
                    {dashboardData.upcomingAppointments.map((appointment, index) => (
                      <React.Fragment key={appointment.id}>
                        <ListItem
                          sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            mb: 2,
                            '&:hover': { bgcolor: 'grey.100' },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <LocalHospital />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {appointment.doctorName}
                                </Typography>
                                <Chip
                                  label={getStatusText(appointment.status)}
                                  size="small"
                                  color={getStatusColor(appointment.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.specialty} • {appointment.type}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                  {format(appointment.date, 'EEEE, dd MMMM yyyy', { locale: id })} • {appointment.time}
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                            sx={{ ml: 1 }}
                          >
                            <ArrowForward />
                          </IconButton>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    Tidak ada janji temu yang dijadwalkan. 
                    <Button
                      size="small"
                      onClick={() => navigate('/appointments/new')}
                      sx={{ ml: 1 }}
                    >
                      Buat Janji Sekarang
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Wallet Balance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalanceWallet sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Saldo Wallet
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
                    Rp {dashboardData.walletBalance.toLocaleString('id-ID')}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => navigate('/wallet/topup')}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                      },
                    }}
                  >
                    Top Up
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Aktivitas Terbaru
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/history')}
                      sx={{ textTransform: 'none' }}
                    >
                      Lihat Semua
                    </Button>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {dashboardData.recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: `${activity.color}.light`, width: 40, height: 40 }}>
                              <activity.icon sx={{ fontSize: 20, color: `${activity.color}.main` }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {activity.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(activity.timestamp, 'dd MMM, HH:mm', { locale: id })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.recentActivities.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;