import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  Badge,
  Tooltip,
  InputAdornment,
  Avatar,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Info,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Message,
  VideoCall,
  Assignment,
  AttachMoney,
  Star,
  StarBorder,
  Today,
  DateRange,
  Event,
  EventAvailable,
  EventBusy,
  Refresh,
  Print,
  Download,
  Share,
  Close,
  Save,
  Clear,
  ArrowBack,
  ArrowForward,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  MedicalServices,
  Psychology,
  LocalHospital,
  Healing,
  MonetizationOn,
  Timeline as TimelineIcon,
  TrendingUp,
  Group,
  Notifications,
  NotificationsActive,
  Block,
  Done,
  Replay,
  Update,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';

const NakesAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // day, week, month
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [dialogs, setDialogs] = useState({
    appointmentDetail: false,
    reschedule: false,
    cancel: false,
    addNote: false,
    blockTime: false,
    bulkAction: false,
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [noteText, setNoteText] = useState('');
  const [blockTimeData, setBlockTimeData] = useState({ date: '', startTime: '', endTime: '', reason: '' });

  const appointmentStatuses = {
    scheduled: { label: 'Terjadwal', color: 'primary', icon: Schedule },
    confirmed: { label: 'Dikonfirmasi', color: 'success', icon: CheckCircle },
    in_progress: { label: 'Berlangsung', color: 'warning', icon: AccessTime },
    completed: { label: 'Selesai', color: 'success', icon: Done },
    cancelled: { label: 'Dibatalkan', color: 'error', icon: Cancel },
    no_show: { label: 'Tidak Hadir', color: 'error', icon: Block },
    rescheduled: { label: 'Dijadwal Ulang', color: 'info', icon: Update },
  };

  const serviceTypes = {
    consultation: 'Konsultasi',
    checkup: 'Pemeriksaan',
    treatment: 'Perawatan',
    therapy: 'Terapi',
    surgery: 'Operasi',
    emergency: 'Darurat',
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter, serviceFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAppointments = [
        {
          id: 'apt1',
          patientId: 'pat1',
          patientName: 'Ahmad Wijaya',
          patientPhone: '+62 812-3456-7890',
          patientEmail: 'ahmad.wijaya@email.com',
          patientAge: 35,
          patientGender: 'male',
          date: '2024-01-15',
          time: '09:00',
          duration: 30,
          service: 'consultation',
          serviceTitle: 'Konsultasi Jantung',
          status: 'confirmed',
          type: 'online',
          fee: 150000,
          notes: 'Pasien mengeluh nyeri dada',
          symptoms: ['Nyeri dada', 'Sesak napas'],
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-12T14:30:00Z',
        },
        {
          id: 'apt2',
          patientId: 'pat2',
          patientName: 'Siti Nurhaliza',
          patientPhone: '+62 813-9876-5432',
          patientEmail: 'siti.nurhaliza@email.com',
          patientAge: 28,
          patientGender: 'female',
          date: '2024-01-15',
          time: '10:30',
          duration: 45,
          service: 'checkup',
          serviceTitle: 'Pemeriksaan Rutin',
          status: 'scheduled',
          type: 'offline',
          fee: 200000,
          notes: 'Pemeriksaan kesehatan tahunan',
          symptoms: [],
          createdAt: '2024-01-11T09:15:00Z',
          updatedAt: '2024-01-11T09:15:00Z',
        },
        {
          id: 'apt3',
          patientId: 'pat3',
          patientName: 'Budi Santoso',
          patientPhone: '+62 814-1111-2222',
          patientEmail: 'budi.santoso@email.com',
          patientAge: 42,
          patientGender: 'male',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          service: 'treatment',
          serviceTitle: 'Perawatan Hipertensi',
          status: 'in_progress',
          type: 'offline',
          fee: 300000,
          notes: 'Follow up pengobatan hipertensi',
          symptoms: ['Tekanan darah tinggi', 'Pusing'],
          createdAt: '2024-01-08T16:20:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
        {
          id: 'apt4',
          patientId: 'pat4',
          patientName: 'Maya Sari',
          patientPhone: '+62 815-3333-4444',
          patientEmail: 'maya.sari@email.com',
          patientAge: 31,
          patientGender: 'female',
          date: '2024-01-16',
          time: '08:30',
          duration: 30,
          service: 'consultation',
          serviceTitle: 'Konsultasi Gizi',
          status: 'scheduled',
          type: 'online',
          fee: 120000,
          notes: 'Konsultasi diet sehat',
          symptoms: [],
          createdAt: '2024-01-12T11:45:00Z',
          updatedAt: '2024-01-12T11:45:00Z',
        },
        {
          id: 'apt5',
          patientId: 'pat5',
          patientName: 'Andi Pratama',
          patientPhone: '+62 816-5555-6666',
          patientEmail: 'andi.pratama@email.com',
          patientAge: 25,
          patientGender: 'male',
          date: '2024-01-14',
          time: '16:00',
          duration: 30,
          service: 'consultation',
          serviceTitle: 'Konsultasi Kulit',
          status: 'completed',
          type: 'offline',
          fee: 180000,
          notes: 'Masalah jerawat',
          symptoms: ['Jerawat', 'Kulit berminyak'],
          createdAt: '2024-01-09T13:30:00Z',
          updatedAt: '2024-01-14T16:30:00Z',
        },
        {
          id: 'apt6',
          patientId: 'pat6',
          patientName: 'Rina Wati',
          patientPhone: '+62 817-7777-8888',
          patientEmail: 'rina.wati@email.com',
          patientAge: 38,
          patientGender: 'female',
          date: '2024-01-13',
          time: '11:00',
          duration: 30,
          service: 'consultation',
          serviceTitle: 'Konsultasi Mata',
          status: 'cancelled',
          type: 'online',
          fee: 160000,
          notes: 'Dibatalkan oleh pasien',
          symptoms: ['Mata minus', 'Mata lelah'],
          createdAt: '2024-01-07T08:15:00Z',
          updatedAt: '2024-01-13T10:00:00Z',
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

  const filterAppointments = () => {
    let filtered = appointments;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientPhone.includes(searchQuery)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by service
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.service === serviceFilter);
    }
    
    // Filter by date based on view mode
    if (viewMode === 'day') {
      filtered = filtered.filter(apt => isSameDay(parseISO(apt.date), selectedDate));
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.date);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
          : apt
      ));
      
      setSnackbar({
        open: true,
        message: `Status janji temu berhasil diubah menjadi ${appointmentStatuses[newStatus].label}`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal mengubah status janji temu',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              date: rescheduleData.date, 
              time: rescheduleData.time,
              status: 'rescheduled',
              notes: apt.notes + `\n\nDijadwal ulang: ${rescheduleData.reason}`,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      setDialogs(prev => ({ ...prev, reschedule: false }));
      setRescheduleData({ date: '', time: '', reason: '' });
      setSnackbar({
        open: true,
        message: 'Janji temu berhasil dijadwal ulang',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal menjadwal ulang janji temu',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              status: 'cancelled',
              notes: apt.notes + `\n\nDibatalkan: ${cancelReason}`,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      setDialogs(prev => ({ ...prev, cancel: false }));
      setCancelReason('');
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
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (date) => {
    if (isToday(parseISO(date))) return 'Hari ini';
    if (isTomorrow(parseISO(date))) return 'Besok';
    if (isYesterday(parseISO(date))) return 'Kemarin';
    return format(parseISO(date), 'EEEE, dd MMMM yyyy', { locale: id });
  };

  const getStatusChip = (status) => {
    const statusInfo = appointmentStatuses[status];
    const IconComponent = statusInfo.icon;
    
    return (
      <Chip
        icon={<IconComponent />}
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const TodayTab = () => {
    const todayAppointments = filteredAppointments.filter(apt => isToday(parseISO(apt.date)));
    
    return (
      <Box>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Jadwal Hari Ini
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAppointments}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogs(prev => ({ ...prev, blockTime: true }))}
              >
                Blokir Waktu
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                  {todayAppointments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Janji
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                  {todayAppointments.filter(apt => apt.status === 'confirmed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dikonfirmasi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                  {todayAppointments.filter(apt => apt.status === 'scheduled').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Menunggu
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                  Rp {todayAppointments.reduce((sum, apt) => sum + apt.fee, 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendapatan
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Timeline */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Timeline Hari Ini
            </Typography>
            
            {todayAppointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Tidak ada janji temu hari ini
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Anda bisa beristirahat atau mengatur jadwal untuk hari lain
                </Typography>
              </Box>
            ) : (
              <Timeline>
                {todayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment, index) => (
                    <TimelineItem key={appointment.id}>
                      <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                        {appointment.time}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={appointmentStatuses[appointment.status].color}>
                          {React.createElement(appointmentStatuses[appointment.status].icon)}
                        </TimelineDot>
                        {index < todayAppointments.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {appointment.patientName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {appointment.serviceTitle}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {getStatusChip(appointment.status)}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedAppointment(appointment);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Chip
                              icon={appointment.type === 'online' ? <VideoCall /> : <LocationOn />}
                              label={appointment.type === 'online' ? 'Online' : 'Offline'}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<AccessTime />}
                              label={`${appointment.duration} menit`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<MonetizationOn />}
                              label={`Rp ${appointment.fee.toLocaleString()}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          
                          {appointment.symptoms.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Keluhan: {appointment.symptoms.join(', ')}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            {appointment.status === 'scheduled' && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                              >
                                Konfirmasi
                              </Button>
                            )}
                            {appointment.status === 'confirmed' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleStatusChange(appointment.id, 'in_progress')}
                              >
                                Mulai
                              </Button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                              >
                                Selesai
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Visibility />}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setDialogs(prev => ({ ...prev, appointmentDetail: true }));
                              }}
                            >
                              Detail
                            </Button>
                          </Box>
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  ))
                }
              </Timeline>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const AllAppointmentsTab = () => (
    <Box>
      {/* Header & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari pasien, layanan, atau nomor telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Semua Status</MenuItem>
                {Object.entries(appointmentStatuses).map(([key, status]) => (
                  <MenuItem key={key} value={key}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Layanan</InputLabel>
              <Select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                label="Layanan"
              >
                <MenuItem value="all">Semua Layanan</MenuItem>
                {Object.entries(serviceTypes).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tampilan</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                label="Tampilan"
              >
                <MenuItem value="day">Harian</MenuItem>
                <MenuItem value="week">Mingguan</MenuItem>
                <MenuItem value="month">Bulanan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={() => setSelectedDate(new Date())}>
                <Today />
              </IconButton>
              <IconButton onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                <ChevronRight />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Appointments Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Daftar Janji Temu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredAppointments.length} janji temu ditemukan
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pasien</TableCell>
                  <TableCell>Tanggal & Waktu</TableCell>
                  <TableCell>Layanan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tipe</TableCell>
                  <TableCell>Biaya</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {appointment.patientName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {appointment.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.patientAge} tahun, {appointment.patientGender === 'male' ? 'L' : 'P'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getDateLabel(appointment.date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.time} ({appointment.duration} menit)
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.serviceTitle}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusChip(appointment.status)}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={appointment.type === 'online' ? <VideoCall /> : <LocationOn />}
                          label={appointment.type === 'online' ? 'Online' : 'Offline'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rp {appointment.fee.toLocaleString()}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedAppointment(appointment);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredAppointments.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
          />
        </CardContent>
      </Card>
    </Box>
  );

  if (loading && appointments.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat jadwal janji temu..." />;
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
            Manajemen Janji Temu
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola jadwal dan janji temu dengan pasien Anda
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
          <Tab icon={<Today />} label="Hari Ini" />
          <Tab icon={<CalendarToday />} label="Semua Janji Temu" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <TodayTab />}
        {activeTab === 1 && <AllAppointmentsTab />}
      </AnimatePresence>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, appointmentDetail: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>Lihat Detail</ListItemText>
        </MenuItemComponent>
        
        {selectedAppointment?.status === 'scheduled' && (
          <MenuItemComponent
            onClick={() => {
              handleStatusChange(selectedAppointment.id, 'confirmed');
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>Konfirmasi</ListItemText>
          </MenuItemComponent>
        )}
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, reschedule: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Update /></ListItemIcon>
          <ListItemText>Jadwal Ulang</ListItemText>
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, addNote: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Assignment /></ListItemIcon>
          <ListItemText>Tambah Catatan</ListItemText>
        </MenuItemComponent>
        
        <Divider />
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, cancel: true }));
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Cancel sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Batalkan</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Appointment Detail Dialog */}
      <Dialog
        open={dialogs.appointmentDetail}
        onClose={() => setDialogs(prev => ({ ...prev, appointmentDetail: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detail Janji Temu</Typography>
            <IconButton onClick={() => setDialogs(prev => ({ ...prev, appointmentDetail: false }))}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {selectedAppointment && (
          <DialogContent>
            <Grid container spacing={3}>
              {/* Patient Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Informasi Pasien
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {selectedAppointment.patientName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedAppointment.patientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedAppointment.patientAge} tahun, {selectedAppointment.patientGender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText primary={selectedAppointment.patientPhone} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText primary={selectedAppointment.patientEmail} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Appointment Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Informasi Janji Temu
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CalendarToday /></ListItemIcon>
                        <ListItemText 
                          primary="Tanggal & Waktu"
                          secondary={`${getDateLabel(selectedAppointment.date)} - ${selectedAppointment.time}`}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><MedicalServices /></ListItemIcon>
                        <ListItemText 
                          primary="Layanan"
                          secondary={selectedAppointment.serviceTitle}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><AccessTime /></ListItemIcon>
                        <ListItemText 
                          primary="Durasi"
                          secondary={`${selectedAppointment.duration} menit`}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><MonetizationOn /></ListItemIcon>
                        <ListItemText 
                          primary="Biaya"
                          secondary={`Rp ${selectedAppointment.fee.toLocaleString()}`}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          {selectedAppointment.type === 'online' ? <VideoCall /> : <LocationOn />}
                        </ListItemIcon>
                        <ListItemText 
                          primary="Tipe"
                          secondary={selectedAppointment.type === 'online' ? 'Konsultasi Online' : 'Kunjungan Langsung'}
                        />
                      </ListItem>
                    </List>
                    
                    <Box sx={{ mt: 2 }}>
                      {getStatusChip(selectedAppointment.status)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Symptoms & Notes */}
              {(selectedAppointment.symptoms.length > 0 || selectedAppointment.notes) && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                        Keluhan & Catatan
                      </Typography>
                      
                      {selectedAppointment.symptoms.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Keluhan:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedAppointment.symptoms.map((symptom, index) => (
                              <Chip key={index} label={symptom} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {selectedAppointment.notes && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Catatan:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedAppointment.notes}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, appointmentDetail: false }))}>
            Tutup
          </Button>
          {selectedAppointment?.type === 'online' && (
            <Button variant="contained" startIcon={<VideoCall />}>
              Mulai Video Call
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={dialogs.reschedule}
        onClose={() => setDialogs(prev => ({ ...prev, reschedule: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Jadwal Ulang Janji Temu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tanggal Baru"
                type="date"
                value={rescheduleData.date}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Waktu Baru"
                type="time"
                value={rescheduleData.time}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alasan Perubahan Jadwal"
                multiline
                rows={3}
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Jelaskan alasan perubahan jadwal..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, reschedule: false }))}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleReschedule} disabled={loading}>
            Jadwal Ulang
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={dialogs.cancel}
        onClose={() => setDialogs(prev => ({ ...prev, cancel: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Batalkan Janji Temu</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tindakan ini akan membatalkan janji temu dan mengirim notifikasi ke pasien.
          </Alert>
          
          <TextField
            fullWidth
            label="Alasan Pembatalan"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Jelaskan alasan pembatalan..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, cancel: false }))}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={loading}>
            Batalkan Janji Temu
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

export default NakesAppointments;