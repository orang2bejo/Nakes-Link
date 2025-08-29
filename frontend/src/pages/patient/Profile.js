import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Security,
  Notifications,
  Language,
  Visibility,
  Delete,
  Shield,
  Key,
  History,
  Download,
  Upload,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Profile = () => {
  const { user, updateProfile, loading } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodType: '',
    allergies: '',
    medicalConditions: '',
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    marketingEmails: false,
    dataSharing: false,
    twoFactorAuth: false,
    language: 'id',
    timezone: 'Asia/Jakarta',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        postalCode: user.postalCode || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        bloodType: user.bloodType || '',
        allergies: user.allergies || '',
        medicalConditions: user.medicalConditions || '',
      });
      
      setSettings({
        emailNotifications: user.settings?.emailNotifications ?? true,
        smsNotifications: user.settings?.smsNotifications ?? false,
        appointmentReminders: user.settings?.appointmentReminders ?? true,
        marketingEmails: user.settings?.marketingEmails ?? false,
        dataSharing: user.settings?.dataSharing ?? false,
        twoFactorAuth: user.settings?.twoFactorAuth ?? false,
        language: user.settings?.language || 'id',
        timezone: user.settings?.timezone || 'Asia/Jakarta',
      });
    }
  }, [user]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSettingChange = (setting) => (event) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        settings,
      };
      
      if (avatarFile) {
        // Handle avatar upload
        updateData.avatar = avatarFile;
      }
      
      await updateProfile(updateData);
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSnackbar({
        open: true,
        message: 'Profil berhasil diperbarui',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal memperbarui profil: ' + error.message,
        severity: 'error',
      });
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // Reset form data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        postalCode: user.postalCode || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        bloodType: user.bloodType || '',
        allergies: user.allergies || '',
        medicalConditions: user.medicalConditions || '',
      });
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      profile: formData,
      settings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nakeslink-profile-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: 'Data profil berhasil diekspor',
      severity: 'success',
    });
  };

  if (loading) {
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
            <Grid item>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatarPreview || user?.photoURL}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '4px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
                {editMode && (
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCamera fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </IconButton>
                )}
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Member sejak ${format(new Date(user?.createdAt || Date.now()), 'MMMM yyyy', { locale: id })}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                {user?.emailVerified && (
                  <Chip
                    icon={<Shield />}
                    label="Email Terverifikasi"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={editMode ? <Save /> : <Edit />}
                onClick={editMode ? handleSave : () => setEditMode(true)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  mr: 1,
                }}
                disabled={loading}
              >
                {editMode ? 'Simpan' : 'Edit Profil'}
              </Button>
              {editMode && (
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Batal
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={4}>
        {/* Personal Information */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Informasi Pribadi
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nama Depan"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nama Belakang"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nomor Telepon"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tanggal Lahir"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange('dateOfBirth')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editMode} variant={editMode ? 'outlined' : 'filled'}>
                      <InputLabel>Jenis Kelamin</InputLabel>
                      <Select
                        value={formData.gender}
                        onChange={handleInputChange('gender')}
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
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Kota"
                      value={formData.city}
                      onChange={handleInputChange('city')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Provinsi"
                      value={formData.province}
                      onChange={handleInputChange('province')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Kode Pos"
                      value={formData.postalCode}
                      onChange={handleInputChange('postalCode')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Informasi Medis
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kontak Darurat"
                      value={formData.emergencyContact}
                      onChange={handleInputChange('emergencyContact')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Telepon Darurat"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange('emergencyPhone')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editMode} variant={editMode ? 'outlined' : 'filled'}>
                      <InputLabel>Golongan Darah</InputLabel>
                      <Select
                        value={formData.bloodType}
                        onChange={handleInputChange('bloodType')}
                        label="Golongan Darah"
                      >
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="AB">AB</MenuItem>
                        <MenuItem value="O">O</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Alergi"
                      multiline
                      rows={2}
                      value={formData.allergies}
                      onChange={handleInputChange('allergies')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                      placeholder="Sebutkan alergi yang Anda miliki (jika ada)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Kondisi Medis"
                      multiline
                      rows={2}
                      value={formData.medicalConditions}
                      onChange={handleInputChange('medicalConditions')}
                      disabled={!editMode}
                      variant={editMode ? 'outlined' : 'filled'}
                      placeholder="Sebutkan kondisi medis yang sedang dialami (jika ada)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Settings & Security */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Notification Settings */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notifikasi
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email Notifikasi"
                      secondary="Terima notifikasi via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={handleSettingChange('emailNotifications')}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="SMS Notifikasi"
                      secondary="Terima notifikasi via SMS"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.smsNotifications}
                        onChange={handleSettingChange('smsNotifications')}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Pengingat Janji"
                      secondary="Pengingat janji temu"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.appointmentReminders}
                        onChange={handleSettingChange('appointmentReminders')}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Keamanan
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Key />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ubah Password"
                      secondary="Terakhir diubah 30 hari lalu"
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => setPasswordDialog(true)}>
                        <Edit />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Keamanan tambahan untuk akun"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={handleSettingChange('twoFactorAuth')}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Manajemen Data
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Download />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ekspor Data"
                      secondary="Unduh data profil Anda"
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={handleExportData}>
                        <Download />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Delete color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Hapus Akun"
                      secondary="Hapus akun secara permanen"
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        color="error"
                        onClick={() => setDeleteDialog(true)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Hapus Akun</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
          </Alert>
          <Typography>
            Apakah Anda yakin ingin menghapus akun Anda? Ketik "HAPUS" untuk mengkonfirmasi.
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            placeholder="Ketik HAPUS"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Batal</Button>
          <Button color="error" variant="contained">
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

export default Profile;