import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Tooltip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Schedule,
  MonetizationOn,
  MedicalServices,
  VideoCall,
  Home,
  Business,
  AccessTime,
  LocationOn,
  Star,
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Info,
  Settings,
  Save,
  Close,
  ExpandMore,
  LocalHospital,
  Psychology,
  Healing,
  ChildCare,
  FitnessCenter,
  Elderly,
  Emergency,
  Assignment,
  Group,
  Timeline,
  TrendingUp,
  Analytics,
  CalendarToday,
  Today,
  Event,
  Refresh,
  FilterList,
  Search,
  MoreVert,
  ContentCopy,
  Share,
  Download,
  Upload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

const NakesServices = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [pricing, setPricing] = useState([]);
  const [serviceDialog, setServiceDialog] = useState({ open: false, mode: 'add', data: null });
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, day: '' });
  const [pricingDialog, setPricingDialog] = useState({ open: false, mode: 'add', data: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const daysOfWeek = [
    { key: 'monday', label: 'Senin' },
    { key: 'tuesday', label: 'Selasa' },
    { key: 'wednesday', label: 'Rabu' },
    { key: 'thursday', label: 'Kamis' },
    { key: 'friday', label: 'Jumat' },
    { key: 'saturday', label: 'Sabtu' },
    { key: 'sunday', label: 'Minggu' },
  ];

  const serviceTypes = [
    { id: 'consultation', name: 'Konsultasi Online', icon: <VideoCall />, color: '#10b981' },
    { id: 'homecare', name: 'Home Care', icon: <Home />, color: '#f59e0b' },
    { id: 'checkup', name: 'Medical Check-up', icon: <MedicalServices />, color: '#3b82f6' },
    { id: 'emergency', name: 'Layanan Darurat', icon: <Emergency />, color: '#ef4444' },
    { id: 'therapy', name: 'Terapi', icon: <Healing />, color: '#8b5cf6' },
    { id: 'vaccination', name: 'Vaksinasi', icon: <LocalHospital />, color: '#06b6d4' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockServices = [
        {
          id: 'srv1',
          name: 'Konsultasi Umum Online',
          type: 'consultation',
          description: 'Konsultasi kesehatan umum melalui video call',
          duration: 30,
          price: 150000,
          isActive: true,
          features: ['Video Call HD', 'Chat Real-time', 'Resep Digital', 'Follow-up'],
          requirements: ['Koneksi internet stabil', 'Kamera dan mikrofon'],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          totalBookings: 156,
          rating: 4.8,
          reviews: 89,
        },
        {
          id: 'srv2',
          name: 'Home Care Perawatan Luka',
          type: 'homecare',
          description: 'Perawatan luka di rumah pasien',
          duration: 90,
          price: 300000,
          isActive: true,
          features: ['Perawat berpengalaman', 'Peralatan steril', 'Laporan kondisi'],
          requirements: ['Alamat lengkap', 'Akses kendaraan'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          totalBookings: 67,
          rating: 4.9,
          reviews: 34,
        },
        {
          id: 'srv3',
          name: 'Medical Check-up Komprehensif',
          type: 'checkup',
          description: 'Pemeriksaan kesehatan menyeluruh',
          duration: 180,
          price: 500000,
          isActive: true,
          features: ['Lab lengkap', 'Radiologi', 'EKG', 'Konsultasi dokter'],
          requirements: ['Puasa 8-12 jam', 'Bawa identitas'],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          totalBookings: 89,
          rating: 4.7,
          reviews: 56,
        },
        {
          id: 'srv4',
          name: 'Terapi Fisik',
          type: 'therapy',
          description: 'Terapi fisik untuk rehabilitasi',
          duration: 60,
          price: 200000,
          isActive: false,
          features: ['Fisioterapis bersertifikat', 'Peralatan modern', 'Program khusus'],
          requirements: ['Rujukan dokter', 'Pakaian olahraga'],
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          totalBookings: 23,
          rating: 4.6,
          reviews: 12,
        },
      ];
      
      const mockSchedule = {
        monday: { isAvailable: true, startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        tuesday: { isAvailable: true, startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        wednesday: { isAvailable: true, startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        thursday: { isAvailable: true, startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        friday: { isAvailable: true, startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        saturday: { isAvailable: true, startTime: '08:00', endTime: '14:00', breakStart: '', breakEnd: '' },
        sunday: { isAvailable: false, startTime: '', endTime: '', breakStart: '', breakEnd: '' },
      };
      
      const mockPricing = [
        {
          id: 'price1',
          serviceType: 'consultation',
          name: 'Konsultasi Online - Reguler',
          basePrice: 150000,
          duration: 30,
          description: 'Konsultasi standar dengan dokter umum',
          isActive: true,
        },
        {
          id: 'price2',
          serviceType: 'consultation',
          name: 'Konsultasi Online - Premium',
          basePrice: 250000,
          duration: 45,
          description: 'Konsultasi dengan dokter spesialis',
          isActive: true,
        },
        {
          id: 'price3',
          serviceType: 'homecare',
          name: 'Home Care - Perawatan Dasar',
          basePrice: 200000,
          duration: 60,
          description: 'Perawatan dasar di rumah pasien',
          isActive: true,
        },
        {
          id: 'price4',
          serviceType: 'homecare',
          name: 'Home Care - Perawatan Intensif',
          basePrice: 400000,
          duration: 120,
          description: 'Perawatan intensif dengan peralatan khusus',
          isActive: true,
        },
      ];
      
      setServices(mockServices);
      setSchedule(mockSchedule);
      setPricing(mockPricing);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data layanan',
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

  const handleSaveService = async (serviceData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (serviceDialog.mode === 'add') {
        const newService = {
          ...serviceData,
          id: `srv${Date.now()}`,
          createdAt: new Date(),
          totalBookings: 0,
          rating: 0,
          reviews: 0,
        };
        setServices(prev => [...prev, newService]);
        setSnackbar({ open: true, message: 'Layanan berhasil ditambahkan', severity: 'success' });
      } else {
        setServices(prev => prev.map(s => s.id === serviceData.id ? { ...s, ...serviceData } : s));
        setSnackbar({ open: true, message: 'Layanan berhasil diperbarui', severity: 'success' });
      }
      
      setServiceDialog({ open: false, mode: 'add', data: null });
    } catch (error) {
      setSnackbar({ open: true, message: 'Gagal menyimpan layanan', severity: 'error' });
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setSnackbar({ open: true, message: 'Layanan berhasil dihapus', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Gagal menghapus layanan', severity: 'error' });
    }
  };

  const handleToggleService = async (serviceId, isActive) => {
    try {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isActive } : s));
      setSnackbar({
        open: true,
        message: `Layanan ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Gagal mengubah status layanan', severity: 'error' });
    }
  };

  const handleSaveSchedule = async (day, scheduleData) => {
    try {
      setSchedule(prev => ({ ...prev, [day]: scheduleData }));
      setScheduleDialog({ open: false, day: '' });
      setSnackbar({ open: true, message: 'Jadwal berhasil disimpan', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Gagal menyimpan jadwal', severity: 'error' });
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.isActive) ||
                         (filterStatus === 'inactive' && !service.isActive);
    return matchesSearch && matchesStatus;
  });

  const ServicesTab = () => (
    <Box>
      {/* Header Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <TextField
              placeholder="Cari layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="inactive">Tidak Aktif</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setServiceDialog({ open: true, mode: 'add', data: null })}
          >
            Tambah Layanan
          </Button>
        </Box>
      </Paper>
      
      {/* Services Grid */}
      <Grid container spacing={3}>
        {filteredServices.map((service, index) => (
          <Grid item xs={12} md={6} lg={4} key={service.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: service.isActive ? 1 : 0.7,
                }}
              >
                {/* Status Badge */}
                <Chip
                  label={service.isActive ? 'Aktif' : 'Tidak Aktif'}
                  size="small"
                  color={service.isActive ? 'success' : 'default'}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1,
                  }}
                />
                
                <CardContent sx={{ flex: 1 }}>
                  {/* Service Type Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: serviceTypes.find(t => t.id === service.type)?.color || '#gray',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {serviceTypes.find(t => t.id === service.type)?.icon}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {serviceTypes.find(t => t.id === service.type)?.name}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>
                  
                  {/* Service Details */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Durasi:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {service.duration} menit
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Harga:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(service.price)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total Booking:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {service.totalBookings}
                      </Typography>
                    </Box>
                    
                    {service.rating > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Rating:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {service.rating} ({service.reviews})
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Features */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {service.features.slice(0, 3).map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                    {service.features.length > 3 && (
                      <Chip label={`+${service.features.length - 3}`} size="small" />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => setServiceDialog({ open: true, mode: 'edit', data: service })}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      size="small"
                      startIcon={service.isActive ? <VisibilityOff /> : <Visibility />}
                      onClick={() => handleToggleService(service.id, !service.isActive)}
                    >
                      {service.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Yakin ingin menghapus layanan ini?')) {
                          handleDeleteService(service.id);
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {filteredServices.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tidak ada layanan ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coba ubah filter pencarian atau tambah layanan baru
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const ScheduleTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          Jadwal Praktik Mingguan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Atur jadwal praktik Anda untuk setiap hari dalam seminggu
        </Typography>
        
        <Grid container spacing={2}>
          {daysOfWeek.map((day) => {
            const daySchedule = schedule[day.key] || {};
            return (
              <Grid item xs={12} sm={6} md={4} key={day.key}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                    bgcolor: daySchedule.isAvailable ? 'success.50' : 'grey.50',
                  }}
                  onClick={() => setScheduleDialog({ open: true, day: day.key })}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {day.label}
                      </Typography>
                      <Chip
                        label={daySchedule.isAvailable ? 'Tersedia' : 'Tutup'}
                        size="small"
                        color={daySchedule.isAvailable ? 'success' : 'default'}
                      />
                    </Box>
                    
                    {daySchedule.isAvailable ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {daySchedule.startTime} - {daySchedule.endTime}
                        </Typography>
                        {daySchedule.breakStart && daySchedule.breakEnd && (
                          <Typography variant="body2" color="text.secondary">
                            Istirahat: {daySchedule.breakStart} - {daySchedule.breakEnd}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada jadwal praktik
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );

  const PricingTab = () => (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Pengaturan Tarif Layanan
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setPricingDialog({ open: true, mode: 'add', data: null })}
          >
            Tambah Tarif
          </Button>
        </Box>
      </Paper>
      
      {/* Pricing Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Jenis Layanan</TableCell>
              <TableCell>Nama Paket</TableCell>
              <TableCell>Durasi</TableCell>
              <TableCell>Harga</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pricing.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((price) => (
              <TableRow key={price.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {serviceTypes.find(t => t.id === price.serviceType)?.icon}
                    {serviceTypes.find(t => t.id === price.serviceType)?.name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {price.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {price.description}
                  </Typography>
                </TableCell>
                <TableCell>{price.duration} menit</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                    {formatCurrency(price.basePrice)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={price.isActive ? 'Aktif' : 'Tidak Aktif'}
                    size="small"
                    color={price.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => setPricingDialog({ open: true, mode: 'edit', data: price })}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Yakin ingin menghapus tarif ini?')) {
                          setPricing(prev => prev.filter(p => p.id !== price.id));
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pricing.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data layanan..." />;
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Manajemen Layanan
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola layanan, jadwal praktik, dan tarif Anda
          </Typography>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab icon={<MedicalServices />} label="Layanan" />
          <Tab icon={<Schedule />} label="Jadwal" />
          <Tab icon={<MonetizationOn />} label="Tarif" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <ServicesTab />}
        {activeTab === 1 && <ScheduleTab />}
        {activeTab === 2 && <PricingTab />}
      </AnimatePresence>

      {/* Service Dialog */}
      <ServiceDialog
        open={serviceDialog.open}
        mode={serviceDialog.mode}
        data={serviceDialog.data}
        serviceTypes={serviceTypes}
        onClose={() => setServiceDialog({ open: false, mode: 'add', data: null })}
        onSave={handleSaveService}
      />

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={scheduleDialog.open}
        day={scheduleDialog.day}
        data={schedule[scheduleDialog.day] || {}}
        onClose={() => setScheduleDialog({ open: false, day: '' })}
        onSave={handleSaveSchedule}
      />

      {/* Pricing Dialog */}
      <PricingDialog
        open={pricingDialog.open}
        mode={pricingDialog.mode}
        data={pricingDialog.data}
        serviceTypes={serviceTypes}
        onClose={() => setPricingDialog({ open: false, mode: 'add', data: null })}
        onSave={(pricingData) => {
          if (pricingDialog.mode === 'add') {
            setPricing(prev => [...prev, { ...pricingData, id: `price${Date.now()}` }]);
          } else {
            setPricing(prev => prev.map(p => p.id === pricingData.id ? pricingData : p));
          }
          setPricingDialog({ open: false, mode: 'add', data: null });
          setSnackbar({ open: true, message: 'Tarif berhasil disimpan', severity: 'success' });
        }}
      />

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

// Service Dialog Component
const ServiceDialog = ({ open, mode, data, serviceTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    duration: 30,
    price: 0,
    isActive: true,
    features: [],
    requirements: [],
  });
  const [newFeature, setNewFeature] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        name: '',
        type: '',
        description: '',
        duration: 30,
        price: 0,
        isActive: true,
        features: [],
        requirements: [],
      });
    }
  }, [data, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Tambah Layanan Baru' : 'Edit Layanan'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nama Layanan"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Jenis Layanan</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                label="Jenis Layanan"
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Aktif"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Deskripsi"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Durasi (menit)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Harga"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
            />
          </Grid>
          
          {/* Features */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Fitur Layanan
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tambah fitur..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              />
              <Button variant="outlined" onClick={addFeature}>
                <Add />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {formData.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => removeFeature(index)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
          
          {/* Requirements */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Persyaratan
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tambah persyaratan..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
              />
              <Button variant="outlined" onClick={addRequirement}>
                <Add />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {formData.requirements.map((requirement, index) => (
                <Chip
                  key={index}
                  label={requirement}
                  onDelete={() => removeRequirement(index)}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Schedule Dialog Component
const ScheduleDialog = ({ open, day, data, onClose, onSave }) => {
  const [scheduleData, setScheduleData] = useState({
    isAvailable: false,
    startTime: '',
    endTime: '',
    breakStart: '',
    breakEnd: '',
  });

  useEffect(() => {
    setScheduleData(data);
  }, [data, open]);

  const handleSubmit = () => {
    onSave(day, scheduleData);
  };

  const dayLabel = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
  }[day];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Jadwal {dayLabel}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={scheduleData.isAvailable}
                onChange={(e) => setScheduleData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              />
            }
            label="Tersedia untuk praktik"
            sx={{ mb: 3 }}
          />
          
          {scheduleData.isAvailable && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Jam Mulai"
                  type="time"
                  value={scheduleData.startTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Jam Selesai"
                  type="time"
                  value={scheduleData.endTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Istirahat Mulai (Opsional)"
                  type="time"
                  value={scheduleData.breakStart}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, breakStart: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Istirahat Selesai (Opsional)"
                  type="time"
                  value={scheduleData.breakEnd}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, breakEnd: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Pricing Dialog Component
const PricingDialog = ({ open, mode, data, serviceTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    serviceType: '',
    name: '',
    basePrice: 0,
    duration: 30,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        serviceType: '',
        name: '',
        basePrice: 0,
        duration: 30,
        description: '',
        isActive: true,
      });
    }
  }, [data, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Tambah Tarif Baru' : 'Edit Tarif'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Jenis Layanan</InputLabel>
              <Select
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                label="Jenis Layanan"
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nama Paket"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Deskripsi"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Durasi (menit)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Harga"
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseInt(e.target.value) }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Aktif"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NakesServices;