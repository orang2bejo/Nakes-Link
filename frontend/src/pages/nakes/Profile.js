import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Security,
  Notifications,
  Language,
  Help,
  Info,
  CheckCircle,
  Warning,
  Error,
  School,
  Work,
  Certificate,
  Star,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Business,
  MedicalServices,
  Psychology,
  LocalHospital,
  Healing,
  ExpandMore,
  Add,
  Delete,
  Download,
  Upload,
  Verified,
  Pending,
  Close,
  CloudUpload,
  Description,
  Assignment,
  Timeline,
  TrendingUp,
  Group,
  MonetizationOn,
  Schedule,
  Settings,
  AccountCircle,
  Lock,
  VpnKey,
  Logout,
  DeleteForever,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const NakesProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    
    // Professional Info
    profession: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    workplace: '',
    workAddress: '',
    bio: '',
    languages: [],
    
    // Settings
    notifications: {
      email: true,
      sms: true,
      push: true,
      appointments: true,
      payments: true,
      marketing: false,
    },
    privacy: {
      profileVisible: true,
      showPhone: true,
      showEmail: false,
      showAddress: false,
    },
  });
  
  const [credentials, setCredentials] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [profileStats, setProfileStats] = useState({});
  
  const [dialogs, setDialogs] = useState({
    changePassword: false,
    deleteAccount: false,
    uploadDocument: false,
    addCredential: false,
    addCertification: false,
    addWorkHistory: false,
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [uploadData, setUploadData] = useState({
    type: '',
    file: null,
    description: '',
  });

  const professions = [
    'Dokter Umum',
    'Dokter Spesialis',
    'Perawat',
    'Bidan',
    'Fisioterapis',
    'Psikolog',
    'Ahli Gizi',
    'Apoteker',
    'Radiografer',
    'Analis Kesehatan',
  ];

  const specializations = {
    'Dokter Spesialis': [
      'Kardiologi',
      'Neurologi',
      'Pediatri',
      'Obstetri & Ginekologi',
      'Orthopedi',
      'Dermatologi',
      'Psikiatri',
      'Radiologi',
      'Anestesiologi',
      'Patologi',
    ],
    'Perawat': [
      'Perawat Umum',
      'Perawat ICU',
      'Perawat Anak',
      'Perawat Jiwa',
      'Perawat Komunitas',
    ],
    'Bidan': [
      'Bidan Praktik',
      'Bidan Rumah Sakit',
      'Bidan Komunitas',
    ],
  };

  const languages = [
    'Bahasa Indonesia',
    'English',
    'Mandarin',
    'Arabic',
    'Japanese',
    'Korean',
    'German',
    'French',
    'Spanish',
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfileData = {
        fullName: user?.displayName || 'Dr. Sarah Johnson',
        email: user?.email || 'sarah.johnson@nakeslink.com',
        phone: '+62 812-3456-7890',
        dateOfBirth: '1985-03-15',
        gender: 'female',
        address: 'Jl. Sudirman No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
        profession: 'Dokter Spesialis',
        specialization: 'Kardiologi',
        licenseNumber: 'STR-12345678',
        experience: '8',
        workplace: 'RS Siloam Kebon Jeruk',
        workAddress: 'Jl. Perjuangan No. 8, Jakarta Barat',
        bio: 'Dokter spesialis jantung dengan pengalaman 8 tahun dalam menangani berbagai kasus kardiovaskular. Berpengalaman dalam tindakan kateterisasi jantung dan pemasangan stent.',
        languages: ['Bahasa Indonesia', 'English'],
        notifications: {
          email: true,
          sms: true,
          push: true,
          appointments: true,
          payments: true,
          marketing: false,
        },
        privacy: {
          profileVisible: true,
          showPhone: true,
          showEmail: false,
          showAddress: false,
        },
      };
      
      const mockCredentials = [
        {
          id: 'cred1',
          type: 'STR',
          number: 'STR-12345678',
          issuedBy: 'Konsil Kedokteran Indonesia',
          issuedDate: '2020-01-15',
          expiryDate: '2025-01-15',
          status: 'active',
          document: 'str_certificate.pdf',
        },
        {
          id: 'cred2',
          type: 'SIP',
          number: 'SIP-87654321',
          issuedBy: 'Dinas Kesehatan DKI Jakarta',
          issuedDate: '2021-03-01',
          expiryDate: '2024-03-01',
          status: 'active',
          document: 'sip_certificate.pdf',
        },
      ];
      
      const mockCertifications = [
        {
          id: 'cert1',
          name: 'Advanced Cardiac Life Support (ACLS)',
          issuedBy: 'American Heart Association',
          issuedDate: '2022-06-15',
          expiryDate: '2024-06-15',
          credentialId: 'ACLS-2022-001234',
          document: 'acls_certificate.pdf',
        },
        {
          id: 'cert2',
          name: 'Interventional Cardiology Fellowship',
          issuedBy: 'Indonesian Heart Association',
          issuedDate: '2019-12-20',
          expiryDate: null,
          credentialId: 'IHA-IC-2019-567',
          document: 'fellowship_certificate.pdf',
        },
      ];
      
      const mockWorkHistory = [
        {
          id: 'work1',
          position: 'Dokter Spesialis Jantung',
          institution: 'RS Siloam Kebon Jeruk',
          startDate: '2020-01-01',
          endDate: null,
          current: true,
          description: 'Menangani pasien dengan berbagai kelainan jantung, melakukan tindakan kateterisasi, dan konsultasi jantung.',
        },
        {
          id: 'work2',
          position: 'Residen Kardiologi',
          institution: 'RSUPN Dr. Cipto Mangunkusumo',
          startDate: '2016-01-01',
          endDate: '2019-12-31',
          current: false,
          description: 'Program residensi spesialis jantung dan pembuluh darah selama 4 tahun.',
        },
        {
          id: 'work3',
          position: 'Dokter Umum',
          institution: 'Puskesmas Cempaka Putih',
          startDate: '2014-01-01',
          endDate: '2015-12-31',
          current: false,
          description: 'Pelayanan kesehatan primer dan program kesehatan masyarakat.',
        },
      ];
      
      const mockStats = {
        profileCompletion: 85,
        totalPatients: 1247,
        totalAppointments: 3456,
        averageRating: 4.8,
        totalReviews: 234,
        responseRate: 95,
        joinDate: '2020-01-15',
        lastActive: new Date(),
      };
      
      setProfileData(mockProfileData);
      setCredentials(mockCredentials);
      setCertifications(mockCertifications);
      setWorkHistory(mockWorkHistory);
      setProfileStats(mockStats);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data profil',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await updateProfile(profileData);
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Profil berhasil diperbarui',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal memperbarui profil',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setSnackbar({
          open: true,
          message: 'Konfirmasi password tidak cocok',
          severity: 'error',
        });
        return;
      }
      
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDialogs(prev => ({ ...prev, changePassword: false }));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSnackbar({
        open: true,
        message: 'Password berhasil diubah',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal mengubah password',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logout();
      navigate('/auth/login');
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal menghapus akun',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const ProfileOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Profile Stats */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Statistik Profil
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                    {profileStats.totalPatients?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Pasien
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                    {profileStats.totalAppointments?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Konsultasi
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                      {profileStats.averageRating}
                    </Typography>
                    <Star sx={{ color: 'warning.main', fontSize: 32 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Rating ({profileStats.totalReviews} ulasan)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                    {profileStats.responseRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tingkat Respons
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Profile Completion */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Kelengkapan Profil
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {profileStats.profileCompletion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={profileStats.profileCompletion}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Personal Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Informasi Personal
              </Typography>
              <IconButton onClick={() => setEditMode(!editMode)}>
                <Edit />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <Avatar
                  src={user?.photoURL}
                  sx={{ width: 80, height: 80 }}
                >
                  {profileData.fullName?.charAt(0)}
                </Avatar>
              </Badge>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {profileData.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.profession} - {profileData.specialization}
                </Typography>
                <Chip
                  icon={<Verified />}
                  label="Terverifikasi"
                  size="small"
                  color="success"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nama Lengkap"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nomor Telepon"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tanggal Lahir"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Jenis Kelamin</InputLabel>
                  <Select
                    value={profileData.gender}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                    label="Jenis Kelamin"
                  >
                    <MenuItem value="male">Laki-laki</MenuItem>
                    <MenuItem value="female">Perempuan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alamat"
                  multiline
                  rows={2}
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Kota"
                  value={profileData.city}
                  onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Provinsi"
                  value={profileData.province}
                  onChange={(e) => setProfileData(prev => ({ ...prev, province: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Kode Pos"
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData(prev => ({ ...prev, postalCode: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
            
            {editMode && (
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  Simpan
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => setEditMode(false)}
                >
                  Batal
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Professional Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Informasi Profesional
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Profesi</InputLabel>
                  <Select
                    value={profileData.profession}
                    onChange={(e) => setProfileData(prev => ({ ...prev, profession: e.target.value, specialization: '' }))}
                    label="Profesi"
                  >
                    {professions.map((profession) => (
                      <MenuItem key={profession} value={profession}>
                        {profession}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {specializations[profileData.profession] && (
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Spesialisasi</InputLabel>
                    <Select
                      value={profileData.specialization}
                      onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                      label="Spesialisasi"
                    >
                      {specializations[profileData.profession].map((spec) => (
                        <MenuItem key={spec} value={spec}>
                          {spec}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nomor STR/SIP"
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Certificate />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pengalaman (tahun)"
                  type="number"
                  value={profileData.experience}
                  onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tempat Kerja"
                  value={profileData.workplace}
                  onChange={(e) => setProfileData(prev => ({ ...prev, workplace: e.target.value }))}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alamat Tempat Kerja"
                  multiline
                  rows={2}
                  value={profileData.workAddress}
                  onChange={(e) => setProfileData(prev => ({ ...prev, workAddress: e.target.value }))}
                  disabled={!editMode}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio/Deskripsi"
                  multiline
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!editMode}
                  placeholder="Ceritakan tentang pengalaman dan keahlian Anda..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Bahasa yang Dikuasai</InputLabel>
                  <Select
                    multiple
                    value={profileData.languages}
                    onChange={(e) => setProfileData(prev => ({ ...prev, languages: e.target.value }))}
                    label="Bahasa yang Dikuasai"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {languages.map((language) => (
                      <MenuItem key={language} value={language}>
                        {language}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const CredentialsTab = () => (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Kredensial & Sertifikasi
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setDialogs(prev => ({ ...prev, addCredential: true }))}
            >
              Tambah Kredensial
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogs(prev => ({ ...prev, addCertification: true }))}
            >
              Tambah Sertifikasi
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Credentials */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Kredensial Resmi
              </Typography>
              
              <List>
                {credentials.map((credential, index) => (
                  <React.Fragment key={credential.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Certificate color={credential.status === 'active' ? 'success' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {credential.type} - {credential.number}
                            </Typography>
                            <Chip
                              label={credential.status === 'active' ? 'Aktif' : 'Kadaluarsa'}
                              size="small"
                              color={credential.status === 'active' ? 'success' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Diterbitkan oleh: {credential.issuedBy}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Berlaku: {format(new Date(credential.issuedDate), 'dd MMM yyyy', { locale: id })} - 
                              {format(new Date(credential.expiryDate), 'dd MMM yyyy', { locale: id })}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Unduh Dokumen">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < credentials.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Certifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Sertifikasi Tambahan
              </Typography>
              
              <List>
                {certifications.map((cert, index) => (
                  <React.Fragment key={cert.id}>
                    <ListItem>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {cert.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {cert.issuedBy}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(cert.issuedDate), 'dd MMM yyyy', { locale: id })}
                              {cert.expiryDate && ` - ${format(new Date(cert.expiryDate), 'dd MMM yyyy', { locale: id })}`}
                            </Typography>
                            {cert.credentialId && (
                              <Typography variant="body2" color="text.secondary">
                                ID: {cert.credentialId}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Unduh Sertifikat">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < certifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const WorkHistoryTab = () => (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Riwayat Pekerjaan
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogs(prev => ({ ...prev, addWorkHistory: true }))}
          >
            Tambah Riwayat
          </Button>
        </Box>
      </Paper>
      
      {/* Timeline */}
      <Card>
        <CardContent>
          <Stepper orientation="vertical">
            {workHistory.map((work, index) => (
              <Step key={work.id} active={true}>
                <StepLabel
                  icon={
                    <Avatar
                      sx={{
                        bgcolor: work.current ? 'success.main' : 'grey.400',
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Work sx={{ fontSize: 16 }} />
                    </Avatar>
                  }
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {work.position}
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      {work.institution}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(work.startDate), 'MMM yyyy', { locale: id })} - 
                      {work.current ? 'Sekarang' : format(new Date(work.endDate), 'MMM yyyy', { locale: id })}
                      {work.current && (
                        <Chip label="Saat ini" size="small" color="success" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {work.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<Edit />}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<Delete />}>
                      Hapus
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );

  const SettingsTab = () => (
    <Grid container spacing={3}>
      {/* Notification Settings */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Pengaturan Notifikasi
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Notifikasi Email"
                  secondary="Terima notifikasi melalui email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.notifications.email}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="Notifikasi SMS"
                  secondary="Terima notifikasi melalui SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.notifications.sms}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Push Notification"
                  secondary="Terima notifikasi push di aplikasi"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.notifications.push}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarToday />
                </ListItemIcon>
                <ListItemText
                  primary="Notifikasi Janji Temu"
                  secondary="Pengingat janji temu dan perubahan jadwal"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.notifications.appointments}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, appointments: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <MonetizationOn />
                </ListItemIcon>
                <ListItemText
                  primary="Notifikasi Pembayaran"
                  secondary="Informasi pembayaran dan transaksi"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.notifications.payments}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, payments: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Privacy Settings */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Pengaturan Privasi
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Visibility />
                </ListItemIcon>
                <ListItemText
                  primary="Profil Publik"
                  secondary="Tampilkan profil di pencarian publik"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.privacy.profileVisible}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, profileVisible: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="Tampilkan Nomor Telepon"
                  secondary="Izinkan pasien melihat nomor telepon"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.privacy.showPhone}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showPhone: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Tampilkan Email"
                  secondary="Izinkan pasien melihat alamat email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.privacy.showEmail}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showEmail: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LocationOn />
                </ListItemIcon>
                <ListItemText
                  primary="Tampilkan Alamat"
                  secondary="Izinkan pasien melihat alamat praktik"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profileData.privacy.showAddress}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showAddress: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Security Settings */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Keamanan Akun
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setDialogs(prev => ({ ...prev, changePassword: true }))}
                >
                  Ubah Password
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VpnKey />}
                >
                  Autentikasi 2 Faktor
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Logout />}
                  onClick={logout}
                >
                  Logout Semua Device
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Zona Bahaya
                  </Typography>
                  <Typography variant="body2">
                    Tindakan di bawah ini tidak dapat dibatalkan. Pastikan Anda memahami konsekuensinya.
                  </Typography>
                </Alert>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => setDialogs(prev => ({ ...prev, deleteAccount: true }))}
                >
                  Hapus Akun Permanen
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading && !editMode) {
    return <LoadingSpinner fullScreen message="Memuat profil..." />;
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
            Profil Saya
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola informasi profil dan pengaturan akun Anda
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
          <Tab icon={<AccountCircle />} label="Profil" />
          <Tab icon={<Certificate />} label="Kredensial" />
          <Tab icon={<Work />} label="Riwayat Kerja" />
          <Tab icon={<Settings />} label="Pengaturan" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <ProfileOverviewTab />}
        {activeTab === 1 && <CredentialsTab />}
        {activeTab === 2 && <WorkHistoryTab />}
        {activeTab === 3 && <SettingsTab />}
      </AnimatePresence>

      {/* Change Password Dialog */}
      <Dialog open={dialogs.changePassword} onClose={() => setDialogs(prev => ({ ...prev, changePassword: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>Ubah Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password Saat Ini"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password Baru"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Konfirmasi Password Baru"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, changePassword: false }))}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
            Ubah Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={dialogs.deleteAccount} onClose={() => setDialogs(prev => ({ ...prev, deleteAccount: false }))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Hapus Akun Permanen</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Peringatan!
            </Typography>
            <Typography variant="body2">
              Tindakan ini akan menghapus akun Anda secara permanen beserta semua data yang terkait. 
              Tindakan ini tidak dapat dibatalkan.
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            Untuk melanjutkan, ketik "HAPUS AKUN" di bawah ini:
          </Typography>
          
          <TextField
            fullWidth
            placeholder="HAPUS AKUN"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, deleteAccount: false }))}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={loading}>
            Hapus Akun
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

export default NakesProfile;