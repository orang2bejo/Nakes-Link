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
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { formatDate, formatCurrency, formatPhoneNumber } from '../../utils/formatters';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPayments, setTotalPayments] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    dateRange: ''
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    averageTransactionValue: 0
  });

  useEffect(() => {
    loadPayments();
    loadPaymentStats();
  }, [page, rowsPerPage, searchTerm, filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.dateRange && { dateRange: filters.dateRange })
      };

      const response = await adminAPI.getPayments(params);
      setPayments(response.data.payments);
      setTotalPayments(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    try {
      const response = await adminAPI.getPaymentStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load payment stats:', err);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(0);
  };

  const openDetailDialog = (payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedPayment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      case 'cancelled': return 'default';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'pending': return <PendingIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'refunded': return <TrendingDownIcon />;
      default: return null;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'credit_card': return 'primary';
      case 'bank_transfer': return 'secondary';
      case 'e_wallet': return 'success';
      case 'cash': return 'warning';
      default: return 'default';
    }
  };

  if (loading && payments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Payment Management
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadPayments();
              loadPaymentStats();
            }}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
          >
            Export
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.totalTransactions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.pendingPayments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AccountBalanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(stats.averageTransactionValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Transaction
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by transaction ID, user, or appointment..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={filters.method}
                  label="Method"
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                >
                  <MenuItem value="">All Methods</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="e_wallet">E-Wallet</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {payment.transactionId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                        {payment.user?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {payment.user?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.appointment?.service?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      with {payment.appointment?.nakes?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(payment.amount)}
                    </Typography>
                    {payment.adminFee > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        +{formatCurrency(payment.adminFee)} fee
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.method?.replace('_', ' ').toUpperCase()}
                      color={getMethodColor(payment.method)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(payment.status)}
                      label={payment.status?.toUpperCase()}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(payment.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => openDetailDialog(payment)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalPayments}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={closeDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ReceiptIcon sx={{ mr: 1 }} />
            Payment Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              {/* Transaction Information */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Transaction Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPayment.transactionId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      icon={getStatusIcon(selectedPayment.status)}
                      label={selectedPayment.status?.toUpperCase()}
                      color={getStatusColor(selectedPayment.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(selectedPayment.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Admin Fee</Typography>
                    <Typography variant="body1">
                      {formatCurrency(selectedPayment.adminFee || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                    <Typography variant="body1">
                      {selectedPayment.method?.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedPayment.createdAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* User Information */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedPayment.user?.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedPayment.user?.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">
                      {formatPhoneNumber(selectedPayment.user?.phone)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Service Information */}
              {selectedPayment.appointment && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Service Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Service</Typography>
                      <Typography variant="body1">
                        {selectedPayment.appointment.service?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Healthcare Provider</Typography>
                      <Typography variant="body1">
                        {selectedPayment.appointment.nakes?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Appointment Date</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedPayment.appointment.scheduledAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Duration</Typography>
                      <Typography variant="body1">
                        {selectedPayment.appointment.service?.duration} minutes
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Payment Gateway Information */}
              {selectedPayment.gatewayResponse && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Gateway Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Gateway</Typography>
                      <Typography variant="body1">
                        {selectedPayment.gatewayResponse.gateway}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Reference ID</Typography>
                      <Typography variant="body1">
                        {selectedPayment.gatewayResponse.referenceId}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Status History */}
              {selectedPayment.statusHistory && selectedPayment.statusHistory.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Status History
                  </Typography>
                  <List>
                    {selectedPayment.statusHistory.map((history, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={`Status: ${history.status}`}
                            secondary={`${formatDate(history.timestamp)} - ${history.reason || 'No reason provided'}`}
                          />
                        </ListItem>
                        {index < selectedPayment.statusHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;