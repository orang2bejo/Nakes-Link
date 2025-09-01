import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Shield as ShieldIcon,
  VpnLock as VpnLockIcon,
  PersonOff as PersonOffIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';

const SecurityMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [securityStats, setSecurityStats] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [threatData, setThreatData] = useState([]);
  
  // Filters
  const [logType, setLogType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialogs
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [blockIPOpen, setBlockIPOpen] = useState(false);
  const [ipToBlock, setIPToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('24h');

  const severityColors = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  };

  const logTypeOptions = [
    { value: 'all', label: 'Semua Log' },
    { value: 'authentication', label: 'Autentikasi' },
    { value: 'authorization', label: 'Otorisasi' },
    { value: 'data_access', label: 'Akses Data' },
    { value: 'api_abuse', label: 'Penyalahgunaan API' },
    { value: 'suspicious_activity', label: 'Aktivitas Mencurigakan' },
    { value: 'security_violation', label: 'Pelanggaran Keamanan' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: '1 Jam Terakhir' },
    { value: '24h', label: '24 Jam Terakhir' },
    { value: '7d', label: '7 Hari Terakhir' },
    { value: '30d', label: '30 Hari Terakhir' }
  ];

  useEffect(() => {
    fetchSecurityData();
  }, [logType, severity, timeRange, page]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const params = {
        type: logType !== 'all' ? logType : undefined,
        severity: severity !== 'all' ? severity : undefined,
        timeRange,
        page,
        limit: 20
      };

      const [stats, logs, audit, threats] = await Promise.all([
        adminAPI.getSecurityStats(),
        adminAPI.getSecurityLogs(params),
        adminAPI.getAuditLogs({ ...params, limit: 10 }),
        adminAPI.getAnalytics({ type: 'security', timeRange })
      ]);

      setSecurityStats(stats.data);
      setSecurityLogs(logs.data.logs);
      setTotalPages(logs.data.totalPages);
      setAuditLogs(audit.data.logs);
      setThreatData(threats.data.chartData || []);
      setBlockedIPs(stats.data.blockedIPs || []);
      setSuspiciousActivities(stats.data.suspiciousActivities || []);
    } catch (err) {
      setError('Gagal memuat data keamanan');
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleBlockIP = async () => {
    if (!ipToBlock.trim() || !blockReason.trim()) return;

    try {
      await adminAPI.blockIP(ipToBlock, {
        reason: blockReason,
        duration: blockDuration,
        adminId: 'current-admin-id' // Should come from auth context
      });
      
      setBlockIPOpen(false);
      setIPToBlock('');
      setBlockReason('');
      setBlockDuration('24h');
      fetchSecurityData();
    } catch (err) {
      setError('Gagal memblokir IP address');
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      await adminAPI.unblockIP(ip);
      fetchSecurityData();
    } catch (err) {
      setError('Gagal membuka blokir IP address');
    }
  };

  const handleExportLogs = async () => {
    try {
      const params = {
        type: logType !== 'all' ? logType : undefined,
        severity: severity !== 'all' ? severity : undefined,
        timeRange,
        format: 'csv'
      };

      const response = await adminAPI.exportReport('security-logs', params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security_logs_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Gagal mengunduh log keamanan');
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'primary', severity }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {severity && (
              <Chip
                label={severity}
                color={severityColors[severity]}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !securityStats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monitoring Keamanan
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Security Overview */}
      {securityStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Ancaman Terdeteksi"
              value={formatNumber(securityStats.threatsDetected)}
              icon={<WarningIcon fontSize="large" />}
              color="error"
              severity={securityStats.threatLevel}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Login Gagal"
              value={formatNumber(securityStats.failedLogins)}
              icon={<ErrorIcon fontSize="large" />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="IP Diblokir"
              value={formatNumber(securityStats.blockedIPs?.length || 0)}
              icon={<BlockIcon fontSize="large" />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sesi Aktif"
              value={formatNumber(securityStats.activeSessions)}
              icon={<CheckCircleIcon fontSize="large" />}
              color="success"
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Jenis Log</InputLabel>
                <Select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  label="Jenis Log"
                >
                  {logTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tingkat Bahaya</InputLabel>
                <Select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  label="Tingkat Bahaya"
                >
                  <MenuItem value="all">Semua</MenuItem>
                  <MenuItem value="low">Rendah</MenuItem>
                  <MenuItem value="medium">Sedang</MenuItem>
                  <MenuItem value="high">Tinggi</MenuItem>
                  <MenuItem value="critical">Kritis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Rentang Waktu</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Rentang Waktu"
                >
                  {timeRangeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSecurityData}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportLogs}
                >
                  Export Log
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BlockIcon />}
                  onClick={() => setBlockIPOpen(true)}
                  color="error"
                >
                  Blokir IP
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Threat Timeline Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline Ancaman Keamanan
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={threatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="threats"
                    stroke="#ff4444"
                    fill="#ff4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Blocked IPs */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                IP Address Diblokir
              </Typography>
              <List dense>
                {blockedIPs.slice(0, 5).map((ip, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleUnblockIP(ip.address)}
                      >
                        <CheckCircleIcon color="success" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <BlockIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={ip.address}
                      secondary={`${ip.reason} - ${formatDate(ip.blockedAt)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log Keamanan
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Waktu</TableCell>
                      <TableCell>Jenis</TableCell>
                      <TableCell>Tingkat Bahaya</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Pesan</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.severity}
                            color={severityColors[log.severity]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{log.userId || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {log.message}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(log)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log Audit Terbaru
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Waktu</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>Aksi</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.adminName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={log.status === 'success' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detail Log Keamanan
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Informasi Dasar
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">ID: {selectedLog._id}</Typography>
                  <Typography variant="body2">Waktu: {formatDate(selectedLog.timestamp)}</Typography>
                  <Typography variant="body2">Jenis: {selectedLog.type}</Typography>
                  <Typography variant="body2">Tingkat Bahaya: 
                    <Chip
                      label={selectedLog.severity}
                      color={severityColors[selectedLog.severity]}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Informasi Teknis
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">IP Address: {selectedLog.ipAddress}</Typography>
                  <Typography variant="body2">User Agent: {selectedLog.userAgent}</Typography>
                  <Typography variant="body2">User ID: {selectedLog.userId || 'Anonymous'}</Typography>
                  <Typography variant="body2">Session ID: {selectedLog.sessionId}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Pesan
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    {selectedLog.message}
                  </Typography>
                </Paper>
              </Grid>

              {selectedLog.details && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detail Tambahan
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Block IP Dialog */}
      <Dialog
        open={blockIPOpen}
        onClose={() => setBlockIPOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Blokir IP Address
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="IP Address"
            value={ipToBlock}
            onChange={(e) => setIPToBlock(e.target.value)}
            margin="normal"
            placeholder="192.168.1.1"
          />
          
          <TextField
            fullWidth
            label="Alasan"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Durasi Blokir</InputLabel>
            <Select
              value={blockDuration}
              onChange={(e) => setBlockDuration(e.target.value)}
              label="Durasi Blokir"
            >
              <MenuItem value="1h">1 Jam</MenuItem>
              <MenuItem value="24h">24 Jam</MenuItem>
              <MenuItem value="7d">7 Hari</MenuItem>
              <MenuItem value="30d">30 Hari</MenuItem>
              <MenuItem value="permanent">Permanen</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockIPOpen(false)}>Batal</Button>
          <Button
            onClick={handleBlockIP}
            variant="contained"
            color="error"
            disabled={!ipToBlock.trim() || !blockReason.trim()}
          >
            Blokir IP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityMonitoring;