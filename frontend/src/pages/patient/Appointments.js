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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Rating,
  Fab,
} from '@mui/material';
import {
  Add,
  CalendarToday,
  AccessTime,
  LocationOn,
  VideoCall,
  Phone,
  Cancel,
  Edit,
  Star,
  LocalHospital,
  Person,
  Payment,
  Chat,
  Refresh,
  FilterList,
  Search,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { id } from 'date-fns/locale';

const Appointments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
  });
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAppointments = [
        {
          id: 1,
          doctorName: 'Dr. Sarah Wijaya',
          doctorSpecialty: 'Dokter Umum',
          doctorPhoto: null,
          doctorRating: 4.8,
          date: new Date(Date.now() + 86400000), // Tomorrow
          time: '10:00',
          duration: 30,
          type: 'online',
          status: 'confirmed',
          location: 'Video Call',
          notes: 'Konsultasi rutin untuk pemeriksaan kesehatan',
          price: 150000,
          paymentStatus: 'paid',
          symptoms: ['Demam', 'Batuk'],
          prescription: null,
        },
        {
          id: 2,
          doctorName: 'Dr. Ahmad Hidayat',
          doctorSpecialty: 'Spesialis Jantung',
          doctorPhoto: null,
          doctorRating: 4.9,
          date: new Date(Date.now() + 172800000), // Day after tomorrow
          time: '14:30',
          duration: 45,
          type: 'offline',
          status: 'pending',
          location: 'RS Siloam Kebon Jeruk',
          notes: 'Pemeriksaan jantung rutin',
          price: 300000,
          paymentStatus: 'pending',
          symptoms: ['Nyeri dada', 'Sesak napas'],
          prescription: null,
        },
        {
          id: 3,
          doctorName: 'Dr. Lisa Sari',
          doctorSpecialty: 'Dokter Anak',
          doctorPhoto: null,
          doctorRating: 4.7,
          date: new Date(Date.now() - 86400000), // Yesterday
          time: '09:00',
          duration: 30,
          type: 'online',
          status: 'completed',
          location: 'Video Call',
          notes: 'Konsultasi untuk anak',
          price: 120000,
          paymentStatus: 'paid',
          symptoms: ['Demam anak'],
          prescription: 'Paracetamol 3x1',
        },
        {
          id: 4,
          doctorName: 'Dr. Budi Santoso',
          doctorSpecialty: 'Spesialis Mata',
          doctorPhoto: null,
          doctorRating: 4.6,
          date: new Date(Date.now() - 172800000), // 2 days ago
          time: '11:00',
          duration: 30,
          type: 'offline',
          status: 'cancelled',
          location: 'Klinik Mata Nusantara',
          notes: 'Pemeriksaan mata rutin',
          price: 200000,
          paymentStatus: 'refunded',
          symptoms: ['Mata kabur'],
          prescription: null,
        },
      ];
      
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data janji temu',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'online' ? <VideoCall /> : <LocationOn />;
  };

  const getTypeText = (type) => {
    return type === 'online' ? 'Online' : 'Offline';
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Hari ini';
    if (isTomorrow(date)) return 'Besok';
    return format(date, 'EEEE, dd MMMM yyyy', { locale: id });
  };

  const filterAppointments = (appointments) => {
    let filtered = appointments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(apt => apt.type === filters.type);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        switch (filters.dateRange) {
          case 'upcoming':
            return isFuture(apt.date);
          case 'past':
            return isPast(apt.date);
          case 'today':
            return isToday(apt.date);
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getTabAppointments = (tabIndex) => {
    const filtered = filterAppointments(appointments);
    
    switch (tabIndex) {
      case 0: // Semua
        return filtered;
      case 1: // Mendatang
        return filtered.filter(apt => isFuture(apt.date) && apt.status !== 'cancelled');
      case 2: // Selesai
        return filtered.filter(apt => apt.status === 'completed');
      case 3: // Dibatalkan
        return filtered.filter(apt => apt.status === 'cancelled');
      default:
        return filtered;
    }
  };

  const handleCancelAppointment = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: 'cancelled', paymentStatus: 'refunded' }
            : apt
        )
      );
      
      setCancelDialog(false);
      setSelectedAppointment(null);
      setSnackbar({
        open: true,
        message: 'Janji temu berhasil dibatalkan',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal membatalkan janji temu',
        severity: 'error',
      });
    }
  };

  const handleSubmitReview = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReviewDialog(false);
      setReviewData({ rating: 5, comment: '' });
      setSnackbar({
        open: true,
        message: 'Review berhasil dikirim',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal mengirim review',
        severity: 'error',
      });
    }
  };

  const AppointmentCard = ({ appointment }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          '&:hover': { boxShadow: 4 },
          transition: 'box-shadow 0.3s',
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={appointment.doctorPhoto}
                sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
              >
                <LocalHospital />
              </Avatar>
            </Grid>
            
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {appointment.doctorName}
                </Typography>
                <Chip
                  label={getStatusText(appointment.status)}
                  color={getStatusColor(appointment.status)}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {appointment.doctorSpecialty}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2">
                    {getDateLabel(appointment.date)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime fontSize="small" color="action" />
                  <Typography variant="body2">
                    {appointment.time} ({appointment.duration} menit)
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTypeIcon(appointment.type)}
                  <Typography variant="body2">
                    {getTypeText(appointment.type)}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {appointment.location}
              </Typography>
            </Grid>
            
            <Grid item>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                  Rp {appointment.price.toLocaleString('id-ID')}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setDetailDialog(true);
                    }}
                  >
                    Detail
                  </Button>
                  
                  {appointment.status === 'confirmed' && isFuture(appointment.date) && (
                    <>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setRescheduleDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setCancelDialog(true);
                        }}
                      >
                        <Cancel />
                      </IconButton>
                    </>
                  )}
                  
                  {appointment.status === 'completed' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Star />}
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setReviewDialog(true);
                      }}
                    >
                      Review
                    </Button>
                  )}
                  
                  {appointment.status === 'confirmed' && isToday(appointment.date) && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={appointment.type === 'online' ? <VideoCall /> : <LocationOn />}
                    >
                      {appointment.type === 'online' ? 'Join' : 'Mulai'}
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat janji temu..." />;
  }

  const tabAppointments = getTabAppointments(activeTab);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Janji Temu Saya
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Kelola semua janji temu dengan tenaga kesehatan
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/appointments/new')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Buat Janji Baru
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                placeholder="Cari dokter atau spesialisasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item>
              <Button
                startIcon={<FilterList />}
                onClick={() => setFilterDialog(true)}
                variant="outlined"
              >
                Filter
              </Button>
            </Grid>
            <Grid item>
              <IconButton onClick={fetchAppointments}>
                <Refresh />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab label={`Semua (${filterAppointments(appointments).length})`} />
            <Tab label={`Mendatang (${filterAppointments(appointments).filter(apt => isFuture(apt.date) && apt.status !== 'cancelled').length})`} />
            <Tab label={`Selesai (${filterAppointments(appointments).filter(apt => apt.status === 'completed').length})`} />
            <Tab label={`Dibatalkan (${filterAppointments(appointments).filter(apt => apt.status === 'cancelled').length})`} />
          </Tabs>
        </Paper>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence>
          {tabAppointments.length > 0 ? (
            tabAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Tidak ada janji temu
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {activeTab === 1 ? 'Anda belum memiliki janji temu yang dijadwalkan' :
                   activeTab === 2 ? 'Belum ada janji temu yang selesai' :
                   activeTab === 3 ? 'Tidak ada janji temu yang dibatalkan' :
                   'Anda belum memiliki janji temu'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/appointments/new')}
                >
                  Buat Janji Temu
                </Button>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #10b981, #059669)',
        }}
        onClick={() => navigate('/appointments/new')}
      >
        <Add />
      </Fab>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAppointment && (
          <>
            <DialogTitle>
              Detail Janji Temu
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Informasi Dokter
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 60, height: 60 }}>
                      <LocalHospital />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedAppointment.doctorName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAppointment.doctorSpecialty}
                      </Typography>
                      <Rating value={selectedAppointment.doctorRating} readOnly size="small" />
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Jadwal
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {format(selectedAppointment.date, 'EEEE, dd MMMM yyyy', { locale: id })}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAppointment.time} - {selectedAppointment.duration} menit
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAppointment.location}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Keluhan
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedAppointment.symptoms.map((symptom, index) => (
                      <Chip key={index} label={symptom} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Catatan
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAppointment.notes}
                  </Typography>
                  
                  {selectedAppointment.prescription && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                        Resep
                      </Typography>
                      <Typography variant="body2">
                        {selectedAppointment.prescription}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(false)}>Tutup</Button>
              {selectedAppointment.status === 'confirmed' && isToday(selectedAppointment.date) && (
                <Button
                  variant="contained"
                  startIcon={selectedAppointment.type === 'online' ? <VideoCall /> : <LocationOn />}
                >
                  {selectedAppointment.type === 'online' ? 'Join Video Call' : 'Mulai Konsultasi'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Batalkan Janji Temu</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Apakah Anda yakin ingin membatalkan janji temu ini?
          </Alert>
          <Typography variant="body2">
            Pembatalan akan diproses dan dana akan dikembalikan dalam 1-3 hari kerja.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleCancelAppointment}>
            Ya, Batalkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Berikan Review</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bagaimana pengalaman Anda?
            </Typography>
            <Rating
              value={reviewData.rating}
              onChange={(e, newValue) => setReviewData(prev => ({ ...prev, rating: newValue }))}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Komentar (opsional)"
            value={reviewData.comment}
            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Ceritakan pengalaman Anda dengan dokter ini..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSubmitReview}>
            Kirim Review
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

export default Appointments;