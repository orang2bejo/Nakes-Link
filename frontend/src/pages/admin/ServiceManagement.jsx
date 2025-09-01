import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Pagination,
  CircularProgress,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);

  const statusColors = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    rejected: 'error',
    suspended: 'error'
  };

  const categoryOptions = [
    'Konsultasi Umum',
    'Konsultasi Spesialis',
    'Pemeriksaan Kesehatan',
    'Terapi',
    'Konseling',
    'Lainnya'
  ];

  useEffect(() => {
    fetchServices();
  }, [page, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sortBy,
        sortOrder
      };

      const response = await adminAPI.getServices(params);
      setServices(response.data.services);
      setTotalPages(response.data.totalPages);
      setTotalServices(response.data.total);
    } catch (err) {
      setError('Gagal memuat data layanan');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (service) => {
    try {
      const response = await adminAPI.getServiceDetails(service._id);
      setSelectedService(response.data);
      setDetailsOpen(true);
    } catch (err) {
      setError('Gagal memuat detail layanan');
    }
  };

  const handleAction = (service, type) => {
    setSelectedService(service);
    setActionType(type);
    setActionReason('');
    setActionNotes('');
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedService || !actionType) return;

    try {
      setActionLoading(true);
      const data = {
        reason: actionReason,
        notes: actionNotes,
        adminId: 'current-admin-id' // Should come from auth context
      };

      switch (actionType) {
        case 'approve':
          await adminAPI.approveService(selectedService._id, data);
          break;
        case 'reject':
          await adminAPI.rejectService(selectedService._id, data);
          break;
        case 'suspend':
          await adminAPI.updateServiceStatus(selectedService._id, { status: 'suspended', ...data });
          break;
        case 'activate':
          await adminAPI.updateServiceStatus(selectedService._id, { status: 'active', ...data });
          break;
        default:
          throw new Error('Invalid action type');
      }

      setActionDialogOpen(false);
      fetchServices();
      setError('');
    } catch (err) {
      setError(`Gagal ${actionType === 'approve' ? 'menyetujui' : actionType === 'reject' ? 'menolak' : 'mengubah status'} layanan`);
    } finally {
      setActionLoading(false);
    }
  };

  const getActionButtonText = () => {
    switch (actionType) {
      case 'approve': return 'Setujui';
      case 'reject': return 'Tolak';
      case 'suspend': return 'Suspend';
      case 'activate': return 'Aktifkan';
      default: return 'Konfirmasi';
    }
  };

  const getActionDialogTitle = () => {
    switch (actionType) {
      case 'approve': return 'Setujui Layanan';
      case 'reject': return 'Tolak Layanan';
      case 'suspend': return 'Suspend Layanan';
      case 'activate': return 'Aktifkan Layanan';
      default: return 'Konfirmasi Aksi';
    }
  };

  if (loading && services.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manajemen Layanan
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Cari layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">Semua Status</MenuItem>
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Tidak Aktif</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Ditolak</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Kategori"
                >
                  <MenuItem value="all">Semua Kategori</MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Urutkan</InputLabel>
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  label="Urutkan"
                >
                  <MenuItem value="createdAt-desc">Terbaru</MenuItem>
                  <MenuItem value="createdAt-asc">Terlama</MenuItem>
                  <MenuItem value="name-asc">Nama A-Z</MenuItem>
                  <MenuItem value="name-desc">Nama Z-A</MenuItem>
                  <MenuItem value="price-desc">Harga Tertinggi</MenuItem>
                  <MenuItem value="price-asc">Harga Terendah</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchServices}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {/* Export functionality */}}
                >
                  Export
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Daftar Layanan ({totalServices})
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Layanan</TableCell>
                  <TableCell>Nakes</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Harga</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tanggal Dibuat</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {service.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {service.description?.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                          src={service.nakes?.profilePicture}
                          sx={{ width: 32, height: 32 }}
                        >
                          {service.nakes?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {service.nakes?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.nakes?.specialization}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell>
                      <Chip
                        label={service.status}
                        color={statusColors[service.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(service.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Lihat Detail">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(service)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {service.status === 'pending' && (
                          <>
                            <Tooltip title="Setujui">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAction(service, 'approve')}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tolak">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleAction(service, 'reject')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {service.status === 'active' && (
                          <Tooltip title="Suspend">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleAction(service, 'suspend')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(service.status === 'suspended' || service.status === 'inactive') && (
                          <Tooltip title="Aktifkan">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleAction(service, 'activate')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
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

      {/* Service Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detail Layanan
        </DialogTitle>
        <DialogContent>
          {selectedService && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedService.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedService.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Informasi Layanan
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">Kategori: {selectedService.category}</Typography>
                  <Typography variant="body2">Harga: {formatCurrency(selectedService.price)}</Typography>
                  <Typography variant="body2">Durasi: {selectedService.duration} menit</Typography>
                  <Typography variant="body2">Status: 
                    <Chip
                      label={selectedService.status}
                      color={statusColors[selectedService.status]}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Informasi Nakes
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">Nama: {selectedService.nakes?.name}</Typography>
                  <Typography variant="body2">Spesialisasi: {selectedService.nakes?.specialization}</Typography>
                  <Typography variant="body2">STR: {selectedService.nakes?.strNumber}</Typography>
                  <Typography variant="body2">Rating: {selectedService.nakes?.rating}/5</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Riwayat Status
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">Dibuat: {formatDate(selectedService.createdAt)}</Typography>
                  <Typography variant="body2">Diperbarui: {formatDate(selectedService.updatedAt)}</Typography>
                  {selectedService.approvedAt && (
                    <Typography variant="body2">Disetujui: {formatDate(selectedService.approvedAt)}</Typography>
                  )}
                  {selectedService.rejectedAt && (
                    <Typography variant="body2">Ditolak: {formatDate(selectedService.rejectedAt)}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {getActionDialogTitle()}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Apakah Anda yakin ingin {actionType === 'approve' ? 'menyetujui' : actionType === 'reject' ? 'menolak' : actionType === 'suspend' ? 'mensuspend' : 'mengaktifkan'} layanan "{selectedService?.name}"?
          </Typography>
          
          <TextField
            fullWidth
            label="Alasan"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            margin="normal"
            required={actionType === 'reject' || actionType === 'suspend'}
            multiline
            rows={2}
          />
          
          <TextField
            fullWidth
            label="Catatan (Opsional)"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Batal</Button>
          <Button
            onClick={executeAction}
            variant="contained"
            color={actionType === 'reject' || actionType === 'suspend' ? 'error' : 'primary'}
            disabled={actionLoading || ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim())}
          >
            {actionLoading ? <CircularProgress size={20} /> : getActionButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceManagement;