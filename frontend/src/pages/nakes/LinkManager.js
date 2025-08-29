import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  Tooltip,
  Avatar,
  Badge
} from '@mui/material';
import {
  Link as LinkIcon,
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Category,
  Public,
  Lock,
  Share,
  ContentCopy,
  QrCode,
  Analytics,
  Visibility,
  Schedule,
  LocalHospital,
  Psychology,
  FitnessCenter,
  Healing,
  ChildCare,
  Elderly,
  MedicalServices,
  MonitorHeart,
  Vaccines,
  Biotech
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const LinkManager = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [linkDialog, setLinkDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [qrDialog, setQrDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);

  // Form states
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
    isPublic: true,
    expiryDate: '',
    customSlug: ''
  });

  // Mock data
  const mockCategories = [
    { id: 'general', name: 'Umum', icon: <LocalHospital />, color: '#2196F3' },
    { id: 'consultation', name: 'Konsultasi', icon: <Psychology />, color: '#4CAF50' },
    { id: 'checkup', name: 'Medical Check-up', icon: <MonitorHeart />, color: '#FF9800' },
    { id: 'therapy', name: 'Terapi', icon: <Healing />, color: '#9C27B0' },
    { id: 'vaccination', name: 'Vaksinasi', icon: <Vaccines />, color: '#F44336' },
    { id: 'pediatric', name: 'Anak', icon: <ChildCare />, color: '#E91E63' },
    { id: 'geriatric', name: 'Lansia', icon: <Elderly />, color: '#795548' },
    { id: 'emergency', name: 'Darurat', icon: <MedicalServices />, color: '#FF5722' },
    { id: 'fitness', name: 'Kebugaran', icon: <FitnessCenter />, color: '#607D8B' },
    { id: 'lab', name: 'Laboratorium', icon: <Biotech />, color: '#3F51B5' }
  ];

  const mockLinks = [
    {
      id: 1,
      title: 'Konsultasi Online Dr. Sarah',
      url: 'https://nakeslink.com/dr-sarah-consultation',
      shortUrl: 'nkl.ink/dr-sarah',
      description: 'Link untuk konsultasi online dengan Dr. Sarah Wijaya, Sp.PD',
      category: 'consultation',
      isPublic: true,
      isActive: true,
      clicks: 245,
      createdAt: '2024-01-15T10:00:00',
      expiryDate: '2024-12-31T23:59:59',
      customSlug: 'dr-sarah',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 2,
      title: 'Jadwal Praktek Klinik',
      url: 'https://nakeslink.com/schedule-clinic',
      shortUrl: 'nkl.ink/schedule',
      description: 'Jadwal praktek dan ketersediaan slot konsultasi',
      category: 'general',
      isPublic: true,
      isActive: true,
      clicks: 189,
      createdAt: '2024-01-10T14:30:00',
      expiryDate: null,
      customSlug: 'schedule',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 3,
      title: 'Medical Check-up Paket Lengkap',
      url: 'https://nakeslink.com/checkup-complete',
      shortUrl: 'nkl.ink/checkup',
      description: 'Paket medical check-up lengkap dengan berbagai pemeriksaan',
      category: 'checkup',
      isPublic: true,
      isActive: true,
      clicks: 156,
      createdAt: '2024-01-08T09:15:00',
      expiryDate: '2024-06-30T23:59:59',
      customSlug: 'checkup',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 4,
      title: 'Terapi Fisik Rehabilitasi',
      url: 'https://nakeslink.com/physical-therapy',
      shortUrl: 'nkl.ink/therapy',
      description: 'Layanan terapi fisik dan rehabilitasi medis',
      category: 'therapy',
      isPublic: false,
      isActive: true,
      clicks: 78,
      createdAt: '2024-01-05T16:45:00',
      expiryDate: null,
      customSlug: 'therapy',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 5,
      title: 'Vaksinasi COVID-19',
      url: 'https://nakeslink.com/covid-vaccination',
      shortUrl: 'nkl.ink/covid-vax',
      description: 'Pendaftaran vaksinasi COVID-19 dan booster',
      category: 'vaccination',
      isPublic: true,
      isActive: false,
      clicks: 423,
      createdAt: '2023-12-20T11:20:00',
      expiryDate: '2024-03-31T23:59:59',
      customSlug: 'covid-vax',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories(mockCategories);
      setLinks(mockLinks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      const newLink = {
        id: Date.now(),
        ...linkForm,
        shortUrl: `nkl.ink/${linkForm.customSlug || Math.random().toString(36).substr(2, 8)}`,
        clicks: 0,
        createdAt: new Date().toISOString(),
        isActive: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      setLinks(prev => [newLink, ...prev]);
      setLinkDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  const handleUpdateLink = async () => {
    try {
      setLinks(prev => prev.map(link => 
        link.id === editingLink.id ? { ...link, ...linkForm } : link
      ));
      setLinkDialog(false);
      setEditingLink(null);
      resetForm();
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      setLinks(prev => prev.filter(link => link.id !== linkId));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleToggleStatus = async (linkId) => {
    try {
      setLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, isActive: !link.isActive } : link
      ));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error toggling link status:', error);
    }
  };

  const resetForm = () => {
    setLinkForm({
      title: '',
      url: '',
      description: '',
      category: '',
      isPublic: true,
      expiryDate: '',
      customSlug: ''
    });
  };

  const openEditDialog = (link) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      description: link.description,
      category: link.category,
      isPublic: link.isPublic,
      expiryDate: link.expiryDate ? link.expiryDate.split('T')[0] : '',
      customSlug: link.customSlug
    });
    setLinkDialog(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a snackbar notification here
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || { name: 'Unknown', icon: <LinkIcon />, color: '#666' };
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStats = () => {
    const totalLinks = links.length;
    const activeLinks = links.filter(link => link.isActive).length;
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const publicLinks = links.filter(link => link.isPublic).length;
    
    return { totalLinks, activeLinks, totalClicks, publicLinks };
  };

  const stats = getStats();

  if (loading) {
    return <LoadingSpinner message="Memuat data link..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <LinkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Manajemen Link
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Total Link</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalLinks}
                    </Typography>
                  </Box>
                  <LinkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Link Aktif</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.activeLinks}
                    </Typography>
                  </Box>
                  <Visibility sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Total Klik</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalClicks.toLocaleString()}
                    </Typography>
                  </Box>
                  <Analytics sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Link Publik</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.publicLinks}
                    </Typography>
                  </Box>
                  <Public sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setLinkDialog(true)}
          >
            Buat Link Baru
          </Button>
          
          <TextField
            placeholder="Cari link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Kategori"
            >
              <MenuItem value="all">Semua Kategori</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Categories Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Semua Link" />
            <Tab label="Kategori" />
            <Tab label="Analitik" />
          </Tabs>
          
          {/* All Links Tab */}
          {tabValue === 0 && (
            <CardContent>
              <Grid container spacing={2}>
                {filteredLinks.map((link) => {
                  const categoryInfo = getCategoryInfo(link.category);
                  return (
                    <Grid item xs={12} key={link.id}>
                      <Card variant="outlined" sx={{ 
                        opacity: link.isActive ? 1 : 0.6,
                        border: link.isActive ? '1px solid #e0e0e0' : '1px solid #f5f5f5'
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar sx={{ bgcolor: categoryInfo.color, width: 32, height: 32 }}>
                                  {categoryInfo.icon}
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {link.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip 
                                    label={categoryInfo.name} 
                                    size="small" 
                                    sx={{ bgcolor: categoryInfo.color, color: 'white' }}
                                  />
                                  <Chip 
                                    label={link.isPublic ? 'Publik' : 'Privat'} 
                                    size="small" 
                                    color={link.isPublic ? 'success' : 'warning'}
                                    icon={link.isPublic ? <Public /> : <Lock />}
                                  />
                                  <Chip 
                                    label={link.isActive ? 'Aktif' : 'Nonaktif'} 
                                    size="small" 
                                    color={link.isActive ? 'success' : 'error'}
                                  />
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {link.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color="text.secondary">URL Pendek:</Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                                    {link.shortUrl}
                                  </Typography>
                                  <Tooltip title="Salin URL">
                                    <IconButton size="small" onClick={() => copyToClipboard(link.shortUrl)}>
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Analytics fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {link.clicks.toLocaleString()} klik
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Schedule fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {format(new Date(link.createdAt), 'dd MMM yyyy', { locale: id })}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {link.expiryDate && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                  Berakhir pada: {format(new Date(link.expiryDate), 'dd MMM yyyy HH:mm', { locale: id })}
                                </Alert>
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="QR Code">
                                <IconButton 
                                  onClick={() => {
                                    setSelectedLink(link);
                                    setQrDialog(true);
                                  }}
                                >
                                  <QrCode />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Analitik">
                                <IconButton 
                                  onClick={() => {
                                    setSelectedLink(link);
                                    setAnalyticsDialog(true);
                                  }}
                                >
                                  <Analytics />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Bagikan">
                                <IconButton onClick={() => copyToClipboard(link.shortUrl)}>
                                  <Share />
                                </IconButton>
                              </Tooltip>
                              
                              <IconButton 
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedLink(link);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          )}
          
          {/* Categories Tab */}
          {tabValue === 1 && (
            <CardContent>
              <Grid container spacing={3}>
                {categories.map((category) => {
                  const categoryLinks = links.filter(link => link.category === category.id);
                  const categoryClicks = categoryLinks.reduce((sum, link) => sum + link.clicks, 0);
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={category.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: category.color }}>
                              {category.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {category.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {categoryLinks.length} link
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Klik:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {categoryClicks.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            Lihat Link
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          )}
          
          {/* Analytics Tab */}
          {tabValue === 2 && (
            <CardContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Fitur analitik detail akan segera tersedia. Saat ini Anda dapat melihat statistik dasar di dashboard.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Top 5 Link Terpopuler</Typography>
                      <List>
                        {links
                          .sort((a, b) => b.clicks - a.clicks)
                          .slice(0, 5)
                          .map((link, index) => (
                            <ListItem key={link.id} divider={index < 4}>
                              <ListItemText
                                primary={link.title}
                                secondary={`${link.clicks.toLocaleString()} klik`}
                              />
                              <Badge badgeContent={index + 1} color="primary" />
                            </ListItem>
                          ))
                        }
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Create/Edit Link Dialog */}
      <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLink ? 'Edit Link' : 'Buat Link Baru'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul Link"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL Tujuan"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  value={linkForm.description}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={linkForm.category}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, category: e.target.value }))}
                    label="Kategori"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.icon}
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Custom Slug (Opsional)"
                  value={linkForm.customSlug}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, customSlug: e.target.value }))}
                  placeholder="my-custom-link"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">nkl.ink/</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tanggal Berakhir (Opsional)"
                  type="datetime-local"
                  value={linkForm.expiryDate}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Visibilitas</InputLabel>
                  <Select
                    value={linkForm.isPublic}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, isPublic: e.target.value }))}
                    label="Visibilitas"
                  >
                    <MenuItem value={true}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Public />
                        Publik
                      </Box>
                    </MenuItem>
                    <MenuItem value={false}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock />
                        Privat
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(false)}>Batal</Button>
          <Button 
            onClick={editingLink ? handleUpdateLink : handleCreateLink}
            variant="contained"
            disabled={!linkForm.title || !linkForm.url || !linkForm.category}
          >
            {editingLink ? 'Update' : 'Buat Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          openEditDialog(selectedLink);
          setAnchorEl(null);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleToggleStatus(selectedLink?.id)}>
          <ListItemIcon>
            {selectedLink?.isActive ? <Lock /> : <Visibility />}
          </ListItemIcon>
          <ListItemText>
            {selectedLink?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => copyToClipboard(selectedLink?.shortUrl)}>
          <ListItemIcon><ContentCopy /></ListItemIcon>
          <ListItemText>Salin URL</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteLink(selectedLink?.id)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Hapus</ListItemText>
        </MenuItem>
      </Menu>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => setQrDialog(false)} maxWidth="sm">
        <DialogTitle>QR Code - {selectedLink?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <img 
              src={selectedLink?.qrCode} 
              alt="QR Code" 
              style={{ width: 200, height: 200, border: '1px solid #ddd' }}
            />
            <Typography variant="body2" sx={{ mt: 2, fontFamily: 'monospace' }}>
              {selectedLink?.shortUrl}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog(false)}>Tutup</Button>
          <Button variant="contained">Unduh QR Code</Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Analitik - {selectedLink?.title}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Fitur analitik detail sedang dalam pengembangan. Saat ini hanya menampilkan statistik dasar.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {selectedLink?.clicks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Klik
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {selectedLink?.isActive ? 'Aktif' : 'Nonaktif'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status Link
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {selectedLink?.createdAt ? 
                      Math.floor((new Date() - new Date(selectedLink.createdAt)) / (1000 * 60 * 60 * 24)) : 0
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hari Aktif
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialog(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinkManager;