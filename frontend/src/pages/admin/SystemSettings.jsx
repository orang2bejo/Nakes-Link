import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Payment as PaymentIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { formatDate, formatFileSize } from '../../utils/helpers';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({});
  const [systemHealth, setSystemHealth] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Umum', icon: <SettingsIcon /> },
    { id: 'security', label: 'Keamanan', icon: <SecurityIcon /> },
    { id: 'notifications', label: 'Notifikasi', icon: <EmailIcon /> },
    { id: 'payments', label: 'Pembayaran', icon: <PaymentIcon /> },
    { id: 'system', label: 'Sistem', icon: <StorageIcon /> }
  ];

  useEffect(() => {
    fetchSettings();
    fetchSystemHealth();
    fetchBackups();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Gagal memuat pengaturan sistem');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setSystemHealth(response.data);
    } catch (err) {
      console.error('Error fetching system health:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await adminAPI.getBackups();
      setBackups(response.data);
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await adminAPI.updateSettings(settings);
      setSuccess('Pengaturan berhasil disimpan');
      setError('');
    } catch (err) {
      setError('Gagal menyimpan pengaturan');
      setSuccess('');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      await adminAPI.backupDatabase();
      setSuccess('Backup berhasil dibuat');
      fetchBackups();
    } catch (err) {
      setError('Gagal membuat backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      await adminAPI.restoreBackup(selectedBackup._id);
      setSuccess('Backup berhasil dipulihkan');
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    } catch (err) {
      setError('Gagal memulihkan backup');
    }
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'warning':
        return { color: 'warning', icon: <WarningIcon /> };
      case 'error':
        return { color: 'error', icon: <ErrorIcon /> };
      default:
        return { color: 'default', icon: <CheckCircleIcon /> };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pengaturan Sistem
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Sistem
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      CPU Usage
                    </Typography>
                    <Typography variant="h6">
                      {systemHealth.cpu?.usage}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MemoryIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Memory Usage
                    </Typography>
                    <Typography variant="h6">
                      {systemHealth.memory?.usage}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Disk Usage
                    </Typography>
                    <Typography variant="h6">
                      {systemHealth.disk?.usage}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getHealthStatus(systemHealth.overall?.status).icon}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Overall Status
                    </Typography>
                    <Chip
                      label={systemHealth.overall?.status}
                      color={getHealthStatus(systemHealth.overall?.status).color}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Settings Tabs */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kategori Pengaturan
              </Typography>
              <List>
                {tabs.map((tab) => (
                  <ListItem
                    key={tab.id}
                    button
                    selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <ListItemIcon>{tab.icon}</ListItemIcon>
                    <ListItemText primary={tab.label} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              {/* General Settings */}
              {activeTab === 'general' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pengaturan Umum
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nama Aplikasi"
                        value={settings.general?.appName || ''}
                        onChange={(e) => handleSettingChange('general', 'appName', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tagline"
                        value={settings.general?.tagline || ''}
                        onChange={(e) => handleSettingChange('general', 'tagline', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Deskripsi"
                        value={settings.general?.description || ''}
                        onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
                        margin="normal"
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Kontak"
                        value={settings.general?.contactEmail || ''}
                        onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nomor Telepon"
                        value={settings.general?.contactPhone || ''}
                        onChange={(e) => handleSettingChange('general', 'contactPhone', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.general?.maintenanceMode || false}
                            onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                          />
                        }
                        label="Mode Maintenance"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pengaturan Keamanan
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Maksimal Login Gagal"
                        type="number"
                        value={settings.security?.maxLoginAttempts || 5}
                        onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Durasi Blokir (menit)"
                        type="number"
                        value={settings.security?.lockoutDuration || 30}
                        onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Durasi Sesi (jam)"
                        type="number"
                        value={settings.security?.sessionDuration || 24}
                        onChange={(e) => handleSettingChange('security', 'sessionDuration', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Tingkat Keamanan Password</InputLabel>
                        <Select
                          value={settings.security?.passwordStrength || 'medium'}
                          onChange={(e) => handleSettingChange('security', 'passwordStrength', e.target.value)}
                          label="Tingkat Keamanan Password"
                        >
                          <MenuItem value="low">Rendah</MenuItem>
                          <MenuItem value="medium">Sedang</MenuItem>
                          <MenuItem value="high">Tinggi</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security?.twoFactorAuth || false}
                            onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                          />
                        }
                        label="Aktifkan Two-Factor Authentication"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security?.ipWhitelist || false}
                            onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.checked)}
                          />
                        }
                        label="Aktifkan IP Whitelist untuk Admin"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pengaturan Notifikasi
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Email Settings
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Host"
                        value={settings.notifications?.email?.host || ''}
                        onChange={(e) => handleSettingChange('notifications', 'email', { ...settings.notifications?.email, host: e.target.value })}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Port"
                        type="number"
                        value={settings.notifications?.email?.port || 587}
                        onChange={(e) => handleSettingChange('notifications', 'email', { ...settings.notifications?.email, port: parseInt(e.target.value) })}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Username"
                        value={settings.notifications?.email?.username || ''}
                        onChange={(e) => handleSettingChange('notifications', 'email', { ...settings.notifications?.email, username: e.target.value })}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="From Email"
                        value={settings.notifications?.email?.from || ''}
                        onChange={(e) => handleSettingChange('notifications', 'email', { ...settings.notifications?.email, from: e.target.value })}
                        margin="normal"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        SMS Settings
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>SMS Provider</InputLabel>
                        <Select
                          value={settings.notifications?.sms?.provider || 'twilio'}
                          onChange={(e) => handleSettingChange('notifications', 'sms', { ...settings.notifications?.sms, provider: e.target.value })}
                          label="SMS Provider"
                        >
                          <MenuItem value="twilio">Twilio</MenuItem>
                          <MenuItem value="nexmo">Nexmo</MenuItem>
                          <MenuItem value="local">Local Provider</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Key"
                        type="password"
                        value={settings.notifications?.sms?.apiKey || ''}
                        onChange={(e) => handleSettingChange('notifications', 'sms', { ...settings.notifications?.sms, apiKey: e.target.value })}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Payment Settings */}
              {activeTab === 'payments' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pengaturan Pembayaran
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Biaya Admin (%)"
                        type="number"
                        value={settings.payments?.adminFee || 5}
                        onChange={(e) => handleSettingChange('payments', 'adminFee', parseFloat(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Minimum Withdrawal"
                        type="number"
                        value={settings.payments?.minWithdrawal || 50000}
                        onChange={(e) => handleSettingChange('payments', 'minWithdrawal', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.payments?.autoWithdrawal || false}
                            onChange={(e) => handleSettingChange('payments', 'autoWithdrawal', e.target.checked)}
                          />
                        }
                        label="Auto Withdrawal untuk Nakes"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Payment Gateways
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.payments?.gateways?.midtrans || false}
                            onChange={(e) => handleSettingChange('payments', 'gateways', { ...settings.payments?.gateways, midtrans: e.target.checked })}
                          />
                        }
                        label="Midtrans"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.payments?.gateways?.xendit || false}
                            onChange={(e) => handleSettingChange('payments', 'gateways', { ...settings.payments?.gateways, xendit: e.target.checked })}
                          />
                        }
                        label="Xendit"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* System Settings */}
              {activeTab === 'system' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pengaturan Sistem
                  </Typography>
                  
                  {/* Backup Management */}
                  <Box mb={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Manajemen Backup
                    </Typography>
                    <Stack direction="row" spacing={2} mb={2}>
                      <Button
                        variant="contained"
                        startIcon={<BackupIcon />}
                        onClick={handleCreateBackup}
                        disabled={backupLoading}
                      >
                        {backupLoading ? <CircularProgress size={20} /> : 'Buat Backup'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchBackups}
                      >
                        Refresh
                      </Button>
                    </Stack>
                    
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Tanggal</TableCell>
                            <TableCell>Ukuran</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Aksi</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backups.map((backup) => (
                            <TableRow key={backup._id}>
                              <TableCell>{formatDate(backup.createdAt)}</TableCell>
                              <TableCell>{formatFileSize(backup.size)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={backup.status}
                                  color={backup.status === 'completed' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Download">
                                    <IconButton size="small">
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Restore">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedBackup(backup);
                                        setRestoreDialogOpen(true);
                                      }}
                                    >
                                      <RestoreIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error">
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* System Configuration */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Max File Upload Size (MB)"
                        type="number"
                        value={settings.system?.maxFileSize || 10}
                        onChange={(e) => handleSettingChange('system', 'maxFileSize', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Session Timeout (menit)"
                        type="number"
                        value={settings.system?.sessionTimeout || 30}
                        onChange={(e) => handleSettingChange('system', 'sessionTimeout', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.system?.enableLogging || true}
                            onChange={(e) => handleSettingChange('system', 'enableLogging', e.target.checked)}
                          />
                        }
                        label="Aktifkan System Logging"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.system?.enableCaching || true}
                            onChange={(e) => handleSettingChange('system', 'enableCaching', e.target.checked)}
                          />
                        }
                        label="Aktifkan Caching"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Save Button */}
              <Box mt={4}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSettings}
                  disabled={saving}
                  size="large"
                >
                  {saving ? <CircularProgress size={20} /> : 'Simpan Pengaturan'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Restore Backup Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Konfirmasi Restore Backup
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Proses restore akan mengganti semua data saat ini dengan data dari backup. 
            Pastikan Anda telah membuat backup terbaru sebelum melanjutkan.
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Backup yang akan dipulihkan:
              </Typography>
              <Typography variant="body2">
                Tanggal: {formatDate(selectedBackup.createdAt)}
              </Typography>
              <Typography variant="body2">
                Ukuran: {formatFileSize(selectedBackup.size)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Batal</Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            color="warning"
          >
            Restore Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;