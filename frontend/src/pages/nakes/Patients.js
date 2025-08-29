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
  CardHeader,
  CardActions,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
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
  PersonAdd,
  History,
  CalendarToday,
  FolderSpecial,
  Description,
  AttachFile,
  CloudUpload,
  GetApp,
  Favorite,
  FavoriteBorder,
  BookmarkBorder,
  Bookmark,
  Flag,
  PriorityHigh,
  Schedule,
  AccountCircle,
  ContactPhone,
  Home,
  Work,
  School,
  Cake,
  Wc,
  Height,
  FitnessCenter,
  Bloodtype,
  Medication,
  LocalPharmacy,
  Emergency,
  ContactEmergency,
  Family,
  ChildCare,
  Elderly,
  Accessible,
  HealthAndSafety,
  Vaccines,
  MonitorHeart,
  Thermostat,
  Speed,
  ShowChart,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, isToday, isTomorrow, isYesterday, differenceInYears } from 'date-fns';
import { id } from 'date-fns/locale';

const NakesPatients = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table
  
  const [dialogs, setDialogs] = useState({
    patientDetail: false,
    addPatient: false,
    editPatient: false,
    medicalHistory: false,
    addRecord: false,
    uploadDocument: false,
    sendMessage: false,
    scheduleAppointment: false,
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    bloodType: '',
    allergies: '',
    medications: '',
    medicalHistory: '',
  });
  const [newRecord, setNewRecord] = useState({
    type: '',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    followUp: '',
  });
  const [messageData, setMessageData] = useState({ subject: '', message: '' });

  const patientStatuses = {
    active: { label: 'Aktif', color: 'success', icon: CheckCircle },
    inactive: { label: 'Tidak Aktif', color: 'default', icon: Person },
    critical: { label: 'Kritis', color: 'error', icon: PriorityHigh },
    follow_up: { label: 'Follow Up', color: 'warning', icon: Schedule },
    recovered: { label: 'Sembuh', color: 'success', icon: Healing },
  };

  const recordTypes = {
    consultation: 'Konsultasi',
    checkup: 'Pemeriksaan',
    diagnosis: 'Diagnosis',
    treatment: 'Perawatan',
    prescription: 'Resep',
    lab_result: 'Hasil Lab',
    imaging: 'Pencitraan',
    surgery: 'Operasi',
    therapy: 'Terapi',
    vaccination: 'Vaksinasi',
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, statusFilter, genderFilter, ageFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPatients = [
        {
          id: 'pat1',
          name: 'Ahmad Wijaya',
          email: 'ahmad.wijaya@email.com',
          phone: '+62 812-3456-7890',
          dateOfBirth: '1988-05-15',
          gender: 'male',
          address: 'Jl. Sudirman No. 123, Jakarta',
          emergencyContact: '+62 813-9999-8888',
          bloodType: 'A+',
          allergies: 'Seafood, Dust',
          medications: 'Lisinopril 10mg',
          medicalHistory: 'Hipertensi, Diabetes Type 2',
          status: 'active',
          lastVisit: '2024-01-10',
          totalVisits: 15,
          totalSpent: 2500000,
          avatar: null,
          notes: 'Pasien kooperatif, rutin kontrol',
          priority: 'normal',
          createdAt: '2023-06-15T10:00:00Z',
          updatedAt: '2024-01-10T14:30:00Z',
        },
        {
          id: 'pat2',
          name: 'Siti Nurhaliza',
          email: 'siti.nurhaliza@email.com',
          phone: '+62 813-9876-5432',
          dateOfBirth: '1995-08-22',
          gender: 'female',
          address: 'Jl. Thamrin No. 456, Jakarta',
          emergencyContact: '+62 814-7777-6666',
          bloodType: 'B+',
          allergies: 'Penicillin',
          medications: 'Vitamin D3',
          medicalHistory: 'Anemia ringan',
          status: 'follow_up',
          lastVisit: '2024-01-12',
          totalVisits: 8,
          totalSpent: 1200000,
          avatar: null,
          notes: 'Perlu follow up hasil lab',
          priority: 'high',
          createdAt: '2023-09-20T09:15:00Z',
          updatedAt: '2024-01-12T11:20:00Z',
        },
        {
          id: 'pat3',
          name: 'Budi Santoso',
          email: 'budi.santoso@email.com',
          phone: '+62 814-1111-2222',
          dateOfBirth: '1982-03-10',
          gender: 'male',
          address: 'Jl. Gatot Subroto No. 789, Jakarta',
          emergencyContact: '+62 815-5555-4444',
          bloodType: 'O+',
          allergies: 'None',
          medications: 'Metformin 500mg, Amlodipine 5mg',
          medicalHistory: 'Diabetes Type 2, Hipertensi',
          status: 'critical',
          lastVisit: '2024-01-15',
          totalVisits: 25,
          totalSpent: 4500000,
          avatar: null,
          notes: 'Pasien dengan komplikasi diabetes',
          priority: 'critical',
          createdAt: '2023-03-10T16:20:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
        {
          id: 'pat4',
          name: 'Maya Sari',
          email: 'maya.sari@email.com',
          phone: '+62 815-3333-4444',
          dateOfBirth: '1992-11-05',
          gender: 'female',
          address: 'Jl. Kuningan No. 321, Jakarta',
          emergencyContact: '+62 816-2222-3333',
          bloodType: 'AB+',
          allergies: 'Latex',
          medications: 'Folic Acid',
          medicalHistory: 'Kehamilan pertama',
          status: 'active',
          lastVisit: '2024-01-08',
          totalVisits: 12,
          totalSpent: 1800000,
          avatar: null,
          notes: 'Ibu hamil 20 minggu',
          priority: 'high',
          createdAt: '2023-08-05T11:45:00Z',
          updatedAt: '2024-01-08T09:30:00Z',
        },
        {
          id: 'pat5',
          name: 'Andi Pratama',
          email: 'andi.pratama@email.com',
          phone: '+62 816-5555-6666',
          dateOfBirth: '1998-12-18',
          gender: 'male',
          address: 'Jl. Senayan No. 654, Jakarta',
          emergencyContact: '+62 817-1111-0000',
          bloodType: 'A-',
          allergies: 'Peanuts',
          medications: 'None',
          medicalHistory: 'Healthy',
          status: 'recovered',
          lastVisit: '2024-01-05',
          totalVisits: 3,
          totalSpent: 450000,
          avatar: null,
          notes: 'Pasien muda, kondisi sehat',
          priority: 'low',
          createdAt: '2023-12-01T13:30:00Z',
          updatedAt: '2024-01-05T16:15:00Z',
        },
        {
          id: 'pat6',
          name: 'Rina Wati',
          email: 'rina.wati@email.com',
          phone: '+62 817-7777-8888',
          dateOfBirth: '1985-07-30',
          gender: 'female',
          address: 'Jl. Kemang No. 987, Jakarta',
          emergencyContact: '+62 818-9999-0000',
          bloodType: 'B-',
          allergies: 'Sulfa drugs',
          medications: 'Levothyroxine 50mcg',
          medicalHistory: 'Hypothyroidism',
          status: 'inactive',
          lastVisit: '2023-12-20',
          totalVisits: 6,
          totalSpent: 900000,
          avatar: null,
          notes: 'Tidak aktif sejak Desember',
          priority: 'normal',
          createdAt: '2023-05-30T08:15:00Z',
          updatedAt: '2023-12-20T10:00:00Z',
        },
      ];
      
      setPatients(mockPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data pasien',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.medicalHistory.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }
    
    // Filter by gender
    if (genderFilter !== 'all') {
      filtered = filtered.filter(patient => patient.gender === genderFilter);
    }
    
    // Filter by age
    if (ageFilter !== 'all') {
      filtered = filtered.filter(patient => {
        const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth));
        switch (ageFilter) {
          case 'child': return age < 18;
          case 'adult': return age >= 18 && age < 60;
          case 'elderly': return age >= 60;
          default: return true;
        }
      });
    }
    
    setFilteredPatients(filtered);
  };

  const handleAddPatient = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPatientData = {
        id: `pat${Date.now()}`,
        ...newPatient,
        status: 'active',
        lastVisit: null,
        totalVisits: 0,
        totalSpent: 0,
        avatar: null,
        notes: '',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setPatients(prev => [newPatientData, ...prev]);
      setDialogs(prev => ({ ...prev, addPatient: false }));
      setNewPatient({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContact: '',
        bloodType: '',
        allergies: '',
        medications: '',
        medicalHistory: '',
      });
      
      setSnackbar({
        open: true,
        message: 'Pasien baru berhasil ditambahkan',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal menambahkan pasien baru',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDialogs(prev => ({ ...prev, sendMessage: false }));
      setMessageData({ subject: '', message: '' });
      
      setSnackbar({
        open: true,
        message: 'Pesan berhasil dikirim ke pasien',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal mengirim pesan',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusInfo = patientStatuses[status];
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error.main';
      case 'high': return 'warning.main';
      case 'normal': return 'info.main';
      case 'low': return 'success.main';
      default: return 'text.secondary';
    }
  };

  const PatientCard = ({ patient }) => {
    const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth));
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          sx={{ 
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            },
            borderLeft: `4px solid ${getPriorityColor(patient.priority)}`,
          }}
          onClick={() => {
            setSelectedPatient(patient);
            setDialogs(prev => ({ ...prev, patientDetail: true }));
          }}
        >
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {patient.name.charAt(0)}
              </Avatar>
            }
            action={
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setAnchorEl(e.currentTarget);
                  setSelectedPatient(patient);
                }}
              >
                <MoreVert />
              </IconButton>
            }
            title={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {patient.name}
              </Typography>
            }
            subheader={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {age} tahun, {patient.gender === 'male' ? 'L' : 'P'}
                </Typography>
                <Chip
                  size="small"
                  label={patient.bloodType}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            }
          />
          
          <CardContent sx={{ pt: 0 }}>
            <Box sx={{ mb: 2 }}>
              {getStatusChip(patient.status)}
            </Box>
            
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Phone fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={patient.phone}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CalendarToday fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={patient.lastVisit ? `Terakhir: ${format(parseISO(patient.lastVisit), 'dd MMM yyyy', { locale: id })}` : 'Belum pernah berkunjung'}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <History fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${patient.totalVisits} kunjungan`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
            
            {patient.medicalHistory && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Riwayat: {patient.medicalHistory.length > 50 ? `${patient.medicalHistory.substring(0, 50)}...` : patient.medicalHistory}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          <CardActions>
            <Button
              size="small"
              startIcon={<Message />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(patient);
                setDialogs(prev => ({ ...prev, sendMessage: true }));
              }}
            >
              Pesan
            </Button>
            <Button
              size="small"
              startIcon={<CalendarToday />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(patient);
                setDialogs(prev => ({ ...prev, scheduleAppointment: true }));
              }}
            >
              Jadwal
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    );
  };

  const PatientsOverview = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Group sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {patients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Pasien
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {patients.filter(p => p.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pasien Aktif
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PriorityHigh sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {patients.filter(p => p.priority === 'critical' || p.priority === 'high').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prioritas Tinggi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {patients.filter(p => p.status === 'follow_up').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow Up
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari nama, email, telepon, atau riwayat medis..."
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
                {Object.entries(patientStatuses).map(([key, status]) => (
                  <MenuItem key={key} value={key}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Jenis Kelamin</InputLabel>
              <Select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                label="Jenis Kelamin"
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="male">Laki-laki</MenuItem>
                <MenuItem value="female">Perempuan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Usia</InputLabel>
              <Select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                label="Usia"
              >
                <MenuItem value="all">Semua Usia</MenuItem>
                <MenuItem value="child">Anak (< 18)</MenuItem>
                <MenuItem value="adult">Dewasa (18-60)</MenuItem>
                <MenuItem value="elderly">Lansia (> 60)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Tampilan Grid">
                <IconButton
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <Group />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tampilan Tabel">
                <IconButton
                  color={viewMode === 'table' ? 'primary' : 'default'}
                  onClick={() => setViewMode('table')}
                >
                  <Assignment />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setDialogs(prev => ({ ...prev, addPatient: true }))}
                size="small"
              >
                Tambah
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Patients Display */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredPatients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={patient.id}>
              <PatientCard patient={patient} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pasien</TableCell>
                    <TableCell>Kontak</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Kunjungan Terakhir</TableCell>
                    <TableCell>Total Kunjungan</TableCell>
                    <TableCell>Prioritas</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((patient) => {
                      const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth));
                      
                      return (
                        <TableRow key={patient.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {patient.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {patient.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {age} tahun, {patient.gender === 'male' ? 'L' : 'P'} • {patient.bloodType}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {patient.phone}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusChip(patient.status)}
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {patient.lastVisit ? format(parseISO(patient.lastVisit), 'dd MMM yyyy', { locale: id }) : 'Belum pernah'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {patient.totalVisits} kali
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              size="small"
                              label={patient.priority}
                              sx={{ 
                                bgcolor: getPriorityColor(patient.priority),
                                color: 'white',
                                textTransform: 'capitalize',
                              }}
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setAnchorEl(e.currentTarget);
                                setSelectedPatient(patient);
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredPatients.length}
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
      )}
      
      {filteredPatients.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tidak ada pasien ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Coba ubah filter pencarian atau tambah pasien baru
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setDialogs(prev => ({ ...prev, addPatient: true }))}
          >
            Tambah Pasien Baru
          </Button>
        </Box>
      )}
    </Box>
  );

  if (loading && patients.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat data pasien..." />;
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
            Manajemen Pasien
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola data pasien, riwayat medis, dan komunikasi
          </Typography>
        </Paper>
      </motion.div>

      {/* Main Content */}
      <PatientsOverview />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, patientDetail: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>Lihat Detail</ListItemText>
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, medicalHistory: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><History /></ListItemIcon>
          <ListItemText>Riwayat Medis</ListItemText>
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, addRecord: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Add /></ListItemIcon>
          <ListItemText>Tambah Rekam Medis</ListItemText>
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, sendMessage: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Message /></ListItemIcon>
          <ListItemText>Kirim Pesan</ListItemText>
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, scheduleAppointment: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><CalendarToday /></ListItemIcon>
          <ListItemText>Buat Janji Temu</ListItemText>
        </MenuItemComponent>
        
        <Divider />
        
        <MenuItemComponent
          onClick={() => {
            setDialogs(prev => ({ ...prev, editPatient: true }));
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Data</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Add Patient Dialog */}
      <Dialog
        open={dialogs.addPatient}
        onClose={() => setDialogs(prev => ({ ...prev, addPatient: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Tambah Pasien Baru</Typography>
            <IconButton onClick={() => setDialogs(prev => ({ ...prev, addPatient: false }))}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nama Lengkap"
                value={newPatient.name}
                onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nomor Telepon"
                value={newPatient.phone}
                onChange={(e) => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tanggal Lahir"
                type="date"
                value={newPatient.dateOfBirth}
                onChange={(e) => setNewPatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Jenis Kelamin</InputLabel>
                <Select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                  label="Jenis Kelamin"
                >
                  <MenuItem value="male">Laki-laki</MenuItem>
                  <MenuItem value="female">Perempuan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Golongan Darah"
                value={newPatient.bloodType}
                onChange={(e) => setNewPatient(prev => ({ ...prev, bloodType: e.target.value }))}
                placeholder="A+, B+, AB+, O+, A-, B-, AB-, O-"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alamat"
                multiline
                rows={2}
                value={newPatient.address}
                onChange={(e) => setNewPatient(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kontak Darurat"
                value={newPatient.emergencyContact}
                onChange={(e) => setNewPatient(prev => ({ ...prev, emergencyContact: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alergi"
                value={newPatient.allergies}
                onChange={(e) => setNewPatient(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="Contoh: Seafood, Dust, Penicillin"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Obat yang Sedang Dikonsumsi"
                multiline
                rows={2}
                value={newPatient.medications}
                onChange={(e) => setNewPatient(prev => ({ ...prev, medications: e.target.value }))}
                placeholder="Contoh: Lisinopril 10mg, Metformin 500mg"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Riwayat Penyakit"
                multiline
                rows={3}
                value={newPatient.medicalHistory}
                onChange={(e) => setNewPatient(prev => ({ ...prev, medicalHistory: e.target.value }))}
                placeholder="Contoh: Hipertensi, Diabetes Type 2, Asma"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, addPatient: false }))}>
            Batal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddPatient} 
            disabled={loading || !newPatient.name || !newPatient.email || !newPatient.phone}
          >
            Tambah Pasien
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog
        open={dialogs.sendMessage}
        onClose={() => setDialogs(prev => ({ ...prev, sendMessage: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Kirim Pesan ke {selectedPatient?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subjek"
                value={messageData.subject}
                onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Contoh: Hasil Lab, Jadwal Kontrol, dll"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pesan"
                multiline
                rows={6}
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Tulis pesan Anda di sini..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, sendMessage: false }))}>
            Batal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSendMessage} 
            disabled={loading || !messageData.subject || !messageData.message}
            startIcon={<Message />}
          >
            Kirim Pesan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Detail Dialog */}
      <Dialog
        open={dialogs.patientDetail}
        onClose={() => setDialogs(prev => ({ ...prev, patientDetail: false }))}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detail Pasien</Typography>
            <IconButton onClick={() => setDialogs(prev => ({ ...prev, patientDetail: false }))}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {selectedPatient && (
          <DialogContent>
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Informasi Dasar
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {selectedPatient.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedPatient.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {differenceInYears(new Date(), parseISO(selectedPatient.dateOfBirth))} tahun, {selectedPatient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </Typography>
                        {getStatusChip(selectedPatient.status)}
                      </Box>
                    </Box>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText primary={selectedPatient.phone} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText primary={selectedPatient.email} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Cake /></ListItemIcon>
                        <ListItemText primary={format(parseISO(selectedPatient.dateOfBirth), 'dd MMMM yyyy', { locale: id })} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Bloodtype /></ListItemIcon>
                        <ListItemText primary={selectedPatient.bloodType} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Home /></ListItemIcon>
                        <ListItemText primary={selectedPatient.address} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><ContactEmergency /></ListItemIcon>
                        <ListItemText primary={selectedPatient.emergencyContact} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Medical Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Informasi Medis
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Warning /></ListItemIcon>
                        <ListItemText 
                          primary="Alergi"
                          secondary={selectedPatient.allergies || 'Tidak ada'}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><LocalPharmacy /></ListItemIcon>
                        <ListItemText 
                          primary="Obat Saat Ini"
                          secondary={selectedPatient.medications || 'Tidak ada'}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><History /></ListItemIcon>
                        <ListItemText 
                          primary="Riwayat Penyakit"
                          secondary={selectedPatient.medicalHistory || 'Tidak ada'}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><CalendarToday /></ListItemIcon>
                        <ListItemText 
                          primary="Kunjungan Terakhir"
                          secondary={selectedPatient.lastVisit ? format(parseISO(selectedPatient.lastVisit), 'dd MMMM yyyy', { locale: id }) : 'Belum pernah'}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><Assignment /></ListItemIcon>
                        <ListItemText 
                          primary="Total Kunjungan"
                          secondary={`${selectedPatient.totalVisits} kali`}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><MonetizationOn /></ListItemIcon>
                        <ListItemText 
                          primary="Total Pengeluaran"
                          secondary={`Rp ${selectedPatient.totalSpent.toLocaleString()}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Notes */}
              {selectedPatient.notes && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                        Catatan
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPatient.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, patientDetail: false }))}>
            Tutup
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Message />}
            onClick={() => {
              setDialogs(prev => ({ ...prev, patientDetail: false, sendMessage: true }));
            }}
          >
            Kirim Pesan
          </Button>
          <Button 
            variant="contained" 
            startIcon={<CalendarToday />}
            onClick={() => {
              setDialogs(prev => ({ ...prev, patientDetail: false, scheduleAppointment: true }));
            }}
          >
            Buat Janji Temu
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

export default NakesPatients;