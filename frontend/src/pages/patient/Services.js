import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Paper,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Rating,
  Alert,
  Snackbar,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CardActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Schedule,
  Star,
  StarBorder,
  Favorite,
  FavoriteBorder,
  Share,
  BookmarkBorder,
  Bookmark,
  Phone,
  VideoCall,
  Chat,
  LocalHospital,
  Psychology,
  Healing,
  ChildCare,
  Elderly,
  FitnessCenter,
  Visibility,
  MonetizationOn,
  AccessTime,
  CheckCircle,
  ExpandMore,
  Close,
  Add,
  Remove,
  CalendarToday,
  Person,
  Email,
  WhatsApp,
  Language,
  School,
  WorkspacePremium,
  Verified,
  TrendingUp,
  Group,
  MedicalServices,
  Emergency,
  Home,
  Business,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

const Services = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [doctorDialog, setDoctorDialog] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [bookmarks, setBookmarks] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    specialty: '',
    location: '',
    priceRange: [0, 1000000],
    rating: 0,
    availability: '',
    serviceType: '',
    experience: 0,
  });
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'consultation',
    notes: '',
    patient: {
      name: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSpecialties = [
        {
          id: 'general',
          name: 'Dokter Umum',
          icon: <LocalHospital />,
          description: 'Pelayanan kesehatan umum dan konsultasi dasar',
          color: '#10b981',
          doctorCount: 45,
        },
        {
          id: 'cardiology',
          name: 'Kardiologi',
          icon: <Favorite />,
          description: 'Spesialis jantung dan pembuluh darah',
          color: '#ef4444',
          doctorCount: 12,
        },
        {
          id: 'psychology',
          name: 'Psikologi',
          icon: <Psychology />,
          description: 'Konsultasi kesehatan mental dan psikologi',
          color: '#8b5cf6',
          doctorCount: 18,
        },
        {
          id: 'pediatrics',
          name: 'Anak',
          icon: <ChildCare />,
          description: 'Spesialis kesehatan anak dan bayi',
          color: '#f59e0b',
          doctorCount: 22,
        },
        {
          id: 'dermatology',
          name: 'Kulit & Kelamin',
          icon: <Healing />,
          description: 'Spesialis penyakit kulit dan kelamin',
          color: '#06b6d4',
          doctorCount: 15,
        },
        {
          id: 'orthopedics',
          name: 'Ortopedi',
          icon: <FitnessCenter />,
          description: 'Spesialis tulang dan sendi',
          color: '#84cc16',
          doctorCount: 10,
        },
      ];
      
      const mockDoctors = [
        {
          id: 'dr1',
          name: 'Dr. Sarah Wijaya, Sp.PD',
          specialty: 'Dokter Umum',
          specialtyId: 'general',
          avatar: '/api/placeholder/100/100',
          rating: 4.8,
          reviewCount: 156,
          experience: 8,
          price: 150000,
          location: 'Jakarta Selatan',
          hospital: 'RS Siloam Kebayoran',
          isOnline: true,
          languages: ['Indonesia', 'English'],
          education: 'Universitas Indonesia',
          certifications: ['ACLS', 'BLS'],
          about: 'Dokter berpengalaman dengan fokus pada pelayanan kesehatan preventif dan kuratif. Menangani berbagai keluhan kesehatan umum dengan pendekatan holistik.',
          services: ['Konsultasi Umum', 'Medical Check-up', 'Vaksinasi'],
          schedule: {
            monday: ['09:00', '17:00'],
            tuesday: ['09:00', '17:00'],
            wednesday: ['09:00', '17:00'],
            thursday: ['09:00', '17:00'],
            friday: ['09:00', '17:00'],
            saturday: ['09:00', '14:00'],
            sunday: [],
          },
          nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isFavorite: false,
          isBookmarked: false,
        },
        {
          id: 'dr2',
          name: 'Dr. Ahmad Rizki, Sp.JP',
          specialty: 'Kardiologi',
          specialtyId: 'cardiology',
          avatar: '/api/placeholder/100/100',
          rating: 4.9,
          reviewCount: 203,
          experience: 12,
          price: 350000,
          location: 'Jakarta Pusat',
          hospital: 'RSUPN Dr. Cipto Mangunkusumo',
          isOnline: true,
          languages: ['Indonesia', 'English'],
          education: 'Universitas Gadjah Mada',
          certifications: ['ACLS', 'BLS', 'Interventional Cardiology'],
          about: 'Spesialis jantung dengan keahlian dalam kateterisasi jantung dan intervensi kardiovaskular. Berpengalaman menangani berbagai penyakit jantung kompleks.',
          services: ['Konsultasi Jantung', 'EKG', 'Echocardiography', 'Kateterisasi'],
          schedule: {
            monday: ['08:00', '16:00'],
            tuesday: ['08:00', '16:00'],
            wednesday: ['08:00', '16:00'],
            thursday: ['08:00', '16:00'],
            friday: ['08:00', '16:00'],
            saturday: [],
            sunday: [],
          },
          nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          isFavorite: true,
          isBookmarked: false,
        },
        {
          id: 'dr3',
          name: 'Dr. Maya Sari, M.Psi',
          specialty: 'Psikologi',
          specialtyId: 'psychology',
          avatar: '/api/placeholder/100/100',
          rating: 4.7,
          reviewCount: 89,
          experience: 6,
          price: 200000,
          location: 'Jakarta Barat',
          hospital: 'Klinik Psikologi Harmoni',
          isOnline: true,
          languages: ['Indonesia', 'English'],
          education: 'Universitas Padjadjaran',
          certifications: ['Clinical Psychology', 'CBT Certified'],
          about: 'Psikolog klinis dengan spesialisasi dalam terapi kognitif-behavioral. Berpengalaman menangani kecemasan, depresi, dan masalah hubungan.',
          services: ['Konsultasi Psikologi', 'Terapi CBT', 'Tes Psikologi'],
          schedule: {
            monday: ['10:00', '18:00'],
            tuesday: ['10:00', '18:00'],
            wednesday: ['10:00', '18:00'],
            thursday: ['10:00', '18:00'],
            friday: ['10:00', '18:00'],
            saturday: ['10:00', '15:00'],
            sunday: [],
          },
          nextAvailable: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          isFavorite: false,
          isBookmarked: true,
        },
      ];
      
      const mockServices = [
        {
          id: 'consultation',
          name: 'Konsultasi Online',
          description: 'Konsultasi dengan dokter melalui video call atau chat',
          icon: <VideoCall />,
          price: 'Mulai dari Rp 50.000',
          duration: '30 menit',
          features: ['Video Call HD', 'Chat Real-time', 'Resep Digital', 'Follow-up'],
          image: '/api/placeholder/300/200',
          category: 'telemedicine',
          popular: true,
        },
        {
          id: 'homecare',
          name: 'Layanan Home Care',
          description: 'Perawatan kesehatan di rumah oleh tenaga medis profesional',
          icon: <Home />,
          price: 'Mulai dari Rp 200.000',
          duration: '2-4 jam',
          features: ['Perawat Berpengalaman', 'Peralatan Medis', 'Laporan Kesehatan'],
          image: '/api/placeholder/300/200',
          category: 'homecare',
          popular: false,
        },
        {
          id: 'checkup',
          name: 'Medical Check-up',
          description: 'Pemeriksaan kesehatan menyeluruh dengan paket lengkap',
          icon: <MedicalServices />,
          price: 'Mulai dari Rp 500.000',
          duration: '3-4 jam',
          features: ['Lab Lengkap', 'Radiologi', 'Konsultasi Dokter', 'Laporan Digital'],
          image: '/api/placeholder/300/200',
          category: 'checkup',
          popular: true,
        },
        {
          id: 'emergency',
          name: 'Layanan Darurat',
          description: 'Bantuan medis darurat 24/7 dengan respons cepat',
          icon: <Emergency />,
          price: 'Sesuai kondisi',
          duration: 'Segera',
          features: ['24/7 Available', 'Ambulans', 'Tim Medis Siaga', 'Koordinasi RS'],
          image: '/api/placeholder/300/200',
          category: 'emergency',
          popular: false,
        },
      ];
      
      setSpecialties(mockSpecialties);
      setDoctors(mockDoctors);
      setServices(mockServices);
      
      // Initialize favorites and bookmarks
      setFavorites(new Set(mockDoctors.filter(d => d.isFavorite).map(d => d.id)));
      setBookmarks(new Set(mockDoctors.filter(d => d.isBookmarked).map(d => d.id)));
      
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

  const toggleFavorite = (doctorId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(doctorId)) {
        newFavorites.delete(doctorId);
      } else {
        newFavorites.add(doctorId);
      }
      return newFavorites;
    });
    
    setSnackbar({
      open: true,
      message: favorites.has(doctorId) ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit',
      severity: 'success',
    });
  };

  const toggleBookmark = (doctorId) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(doctorId)) {
        newBookmarks.delete(doctorId);
      } else {
        newBookmarks.add(doctorId);
      }
      return newBookmarks;
    });
    
    setSnackbar({
      open: true,
      message: bookmarks.has(doctorId) ? 'Dihapus dari bookmark' : 'Ditambahkan ke bookmark',
      severity: 'success',
    });
  };

  const handleBooking = async () => {
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBookingDialog(false);
      setBookingStep(0);
      setBookingData({
        date: '',
        time: '',
        type: 'consultation',
        notes: '',
        patient: {
          name: '',
          phone: '',
          email: '',
          age: '',
          gender: '',
        },
      });
      
      setSnackbar({
        open: true,
        message: 'Booking berhasil! Anda akan menerima konfirmasi segera.',
        severity: 'success',
      });
      
      // Navigate to appointments
      setTimeout(() => {
        navigate('/patient/appointments');
      }, 2000);
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal melakukan booking',
        severity: 'error',
      });
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = !filters.specialty || doctor.specialtyId === filters.specialty;
    const matchesLocation = !filters.location || doctor.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesPrice = doctor.price >= filters.priceRange[0] && doctor.price <= filters.priceRange[1];
    const matchesRating = doctor.rating >= filters.rating;
    const matchesExperience = doctor.experience >= filters.experience;
    
    return matchesSearch && matchesSpecialty && matchesLocation && matchesPrice && matchesRating && matchesExperience;
  });

  const SpecialtiesTab = () => (
    <Box>
      <Grid container spacing={3}>
        {specialties.map((specialty, index) => (
          <Grid item xs={12} sm={6} md={4} key={specialty.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
                }}
                onClick={() => {
                  setFilters(prev => ({ ...prev, specialty: specialty.id }));
                  setActiveTab(1);
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: specialty.color,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {specialty.icon}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {specialty.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {specialty.description}
                  </Typography>
                  
                  <Chip
                    label={`${specialty.doctorCount} Dokter`}
                    size="small"
                    sx={{ bgcolor: specialty.color, color: 'white' }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const DoctorsTab = () => (
    <Box>
      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Cari dokter, spesialisasi, atau rumah sakit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterDialog(true)}
          >
            Filter
          </Button>
        </Box>
        
        {/* Active Filters */}
        {(filters.specialty || filters.location || filters.rating > 0) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filters.specialty && (
              <Chip
                label={specialties.find(s => s.id === filters.specialty)?.name}
                onDelete={() => setFilters(prev => ({ ...prev, specialty: '' }))}
                size="small"
              />
            )}
            {filters.location && (
              <Chip
                label={filters.location}
                onDelete={() => setFilters(prev => ({ ...prev, location: '' }))}
                size="small"
              />
            )}
            {filters.rating > 0 && (
              <Chip
                label={`Rating ≥ ${filters.rating}`}
                onDelete={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                size="small"
              />
            )}
          </Box>
        )}
      </Paper>
      
      {/* Doctors Grid */}
      <Grid container spacing={3}>
        {filteredDoctors.map((doctor, index) => (
          <Grid item xs={12} sm={6} md={4} key={doctor.id}>
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
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                {/* Online Status */}
                {doctor.isOnline && (
                  <Chip
                    label="Online"
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                    }}
                  />
                )}
                
                {/* Favorite & Bookmark */}
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(doctor.id);
                    }}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', mr: 0.5 }}
                  >
                    {favorites.has(doctor.id) ? (
                      <Favorite color="error" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(doctor.id);
                    }}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  >
                    {bookmarks.has(doctor.id) ? (
                      <Bookmark color="primary" />
                    ) : (
                      <BookmarkBorder />
                    )}
                  </IconButton>
                </Box>
                
                <CardContent sx={{ flex: 1, p: 3 }}>
                  {/* Doctor Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={doctor.avatar}
                      sx={{ width: 60, height: 60 }}
                    >
                      {doctor.name.charAt(0)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {doctor.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {doctor.specialty}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={doctor.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {doctor.rating} ({doctor.reviewCount})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Details */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {doctor.hospital}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WorkspacePremium sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {doctor.experience} tahun pengalaman
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Tersedia {format(doctor.nextAvailable, 'dd MMM', { locale: id })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Price */}
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                    {formatCurrency(doctor.price)}
                  </Typography>
                  
                  {/* Languages */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {doctor.languages.map((lang) => (
                      <Chip key={lang} label={lang} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setDoctorDialog(true);
                    }}
                  >
                    Lihat Detail
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setBookingDialog(true);
                    }}
                  >
                    Booking
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {filteredDoctors.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tidak ada dokter yang ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coba ubah filter pencarian Anda
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const ServicesTab = () => (
    <Box>
      <Grid container spacing={3}>
        {services.map((service, index) => (
          <Grid item xs={12} sm={6} md={6} key={service.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => {
                  setSelectedService(service);
                  setServiceDialog(true);
                }}
              >
                {service.popular && (
                  <Chip
                    label="Populer"
                    size="small"
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  />
                )}
                
                <CardMedia
                  component="img"
                  height="200"
                  image={service.image}
                  alt={service.name}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {service.icon}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.duration}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>
                  
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                    {service.price}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {service.features.slice(0, 3).map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                    {service.features.length > 3 && (
                      <Chip label={`+${service.features.length - 3} lainnya`} size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat layanan kesehatan..." />;
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
            Layanan Kesehatan
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Temukan dokter terbaik dan layanan kesehatan yang Anda butuhkan
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
          <Tab icon={<MedicalServices />} label="Spesialisasi" />
          <Tab icon={<Person />} label="Dokter" />
          <Tab icon={<Business />} label="Layanan" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <SpecialtiesTab />}
        {activeTab === 1 && <DoctorsTab />}
        {activeTab === 2 && <ServicesTab />}
      </AnimatePresence>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Pencarian</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Spesialisasi</InputLabel>
              <Select
                value={filters.specialty}
                onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                label="Spesialisasi"
              >
                <MenuItem value="">Semua Spesialisasi</MenuItem>
                {specialties.map((specialty) => (
                  <MenuItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Lokasi"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Rentang Harga</Typography>
            <Slider
              value={filters.priceRange}
              onChange={(e, newValue) => setFilters(prev => ({ ...prev, priceRange: newValue }))}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatCurrency(value)}
              min={0}
              max={1000000}
              step={50000}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Rating Minimum</Typography>
            <Rating
              value={filters.rating}
              onChange={(e, newValue) => setFilters(prev => ({ ...prev, rating: newValue || 0 }))}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Pengalaman Minimum (tahun)</Typography>
            <Slider
              value={filters.experience}
              onChange={(e, newValue) => setFilters(prev => ({ ...prev, experience: newValue }))}
              valueLabelDisplay="auto"
              min={0}
              max={20}
              step={1}
              sx={{ mb: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFilters({
              specialty: '',
              location: '',
              priceRange: [0, 1000000],
              rating: 0,
              availability: '',
              serviceType: '',
              experience: 0,
            });
          }}>
            Reset
          </Button>
          <Button variant="contained" onClick={() => setFilterDialog(false)}>
            Terapkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog open={doctorDialog} onClose={() => setDoctorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={selectedDoctor?.avatar} sx={{ width: 60, height: 60 }}>
              {selectedDoctor?.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedDoctor?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDoctor?.specialty}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDoctor && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>Tentang Dokter</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedDoctor.about}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom>Layanan</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {selectedDoctor.services.map((service) => (
                      <Chip key={service} label={service} variant="outlined" />
                    ))}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>Sertifikasi</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedDoctor.certifications.map((cert) => (
                      <Chip key={cert} label={cert} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Informasi</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Rumah Sakit</Typography>
                      <Typography variant="body1">{selectedDoctor.hospital}</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Pendidikan</Typography>
                      <Typography variant="body1">{selectedDoctor.education}</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Pengalaman</Typography>
                      <Typography variant="body1">{selectedDoctor.experience} tahun</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Bahasa</Typography>
                      <Typography variant="body1">{selectedDoctor.languages.join(', ')}</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Tarif Konsultasi</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedDoctor.price)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={selectedDoctor.rating} precision={0.1} readOnly />
                      <Typography variant="body2">
                        {selectedDoctor.rating} ({selectedDoctor.reviewCount} ulasan)
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDoctorDialog(false)}>Tutup</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDoctorDialog(false);
              setBookingDialog(true);
            }}
          >
            Booking Sekarang
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Detail Dialog */}
      <Dialog open={serviceDialog} onClose={() => setServiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedService?.name}</DialogTitle>
        <DialogContent>
          {selectedService && (
            <Box>
              <img
                src={selectedService.image}
                alt={selectedService.name}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
              />
              
              <Typography variant="body1" paragraph>
                {selectedService.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>Fitur Layanan</Typography>
              <List>
                {selectedService.features.map((feature) => (
                  <ListItem key={feature}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Harga</Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                    {selectedService.price}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Durasi</Typography>
                  <Typography variant="h6">{selectedService.duration}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialog(false)}>Tutup</Button>
          <Button variant="contained">
            Pesan Layanan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking Konsultasi</DialogTitle>
        <DialogContent>
          <Stepper activeStep={bookingStep} orientation="vertical">
            <Step>
              <StepLabel>Pilih Jadwal</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tanggal"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Waktu</InputLabel>
                      <Select
                        value={bookingData.time}
                        onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                        label="Waktu"
                      >
                        <MenuItem value="09:00">09:00</MenuItem>
                        <MenuItem value="10:00">10:00</MenuItem>
                        <MenuItem value="11:00">11:00</MenuItem>
                        <MenuItem value="14:00">14:00</MenuItem>
                        <MenuItem value="15:00">15:00</MenuItem>
                        <MenuItem value="16:00">16:00</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  onClick={() => setBookingStep(1)}
                  sx={{ mt: 2 }}
                  disabled={!bookingData.date || !bookingData.time}
                >
                  Lanjutkan
                </Button>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Data Pasien</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nama Lengkap"
                      value={bookingData.patient.name}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        patient: { ...prev.patient, name: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nomor Telepon"
                      value={bookingData.patient.phone}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        patient: { ...prev.patient, phone: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={bookingData.patient.email}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        patient: { ...prev.patient, email: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Usia"
                      type="number"
                      value={bookingData.patient.age}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        patient: { ...prev.patient, age: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <Typography variant="body2" gutterBottom>Jenis Kelamin</Typography>
                      <RadioGroup
                        row
                        value={bookingData.patient.gender}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          patient: { ...prev.patient, gender: e.target.value }
                        }))}
                      >
                        <FormControlLabel value="male" control={<Radio />} label="Laki-laki" />
                        <FormControlLabel value="female" control={<Radio />} label="Perempuan" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Keluhan/Catatan"
                      multiline
                      rows={3}
                      value={bookingData.notes}
                      onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Jelaskan keluhan atau hal yang ingin dikonsultasikan..."
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setBookingStep(0)}>Kembali</Button>
                  <Button
                    variant="contained"
                    onClick={() => setBookingStep(2)}
                    disabled={!bookingData.patient.name || !bookingData.patient.phone}
                  >
                    Lanjutkan
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Konfirmasi</StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>Ringkasan Booking</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Dokter</Typography>
                      <Typography variant="body1">{selectedDoctor?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Spesialisasi</Typography>
                      <Typography variant="body1">{selectedDoctor?.specialty}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Tanggal & Waktu</Typography>
                      <Typography variant="body1">
                        {bookingData.date && format(new Date(bookingData.date), 'dd MMMM yyyy', { locale: id })} - {bookingData.time}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Biaya</Typography>
                      <Typography variant="h6" color="primary">
                        {selectedDoctor && formatCurrency(selectedDoctor.price)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Pasien</Typography>
                      <Typography variant="body1">{bookingData.patient.name}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setBookingStep(1)}>Kembali</Button>
                  <Button variant="contained" onClick={handleBooking}>
                    Konfirmasi Booking
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Batal</Button>
        </DialogActions>
      </Dialog>

      {/* Emergency FAB */}
      <Fab
        color="error"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        }}
        onClick={() => {
          // Navigate to emergency service
          navigate('/patient/emergency');
        }}
      >
        <Emergency />
      </Fab>

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

export default Services;