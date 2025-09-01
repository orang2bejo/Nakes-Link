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
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Verified as VerifiedIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';

const NakesVerification = () => {
  const [nakesApplications, setNakesApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalApplications, setTotalApplications] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationData, setVerificationData] = useState({
    status: '',
    reason: '',
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNakesApplications();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const loadNakesApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      };

      const response = await adminAPI.getNakesVerifications(params);
      setNakesApplications(response.data.applications);
      setTotalApplications(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to load Nakes applications:', err);
      setError('Failed to load Nakes applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  const openDetailDialog = (application) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedApplication(null);
  };

  const openVerificationDialog = (application, status) => {
    setSelectedApplication(application);
    setVerificationData({
      status,
      reason: '',
      notes: ''
    });
    setVerificationDialogOpen(true);
  };

  const closeVerificationDialog = () => {
    setVerificationDialogOpen(false);
    setSelectedApplication(null);
    setVerificationData({ status: '', reason: '', notes: '' });
  };

  const handleVerification = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);

      await adminAPI.verifyNakes(selectedApplication._id, {
        status: verificationData.status,
        reason: verificationData.reason,
        notes: verificationData.notes
      });

      await loadNakesApplications();
      closeVerificationDialog();
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <ErrorIcon />;
      case 'pending': return <WarningIcon />;
      case 'under_review': return <VisibilityIcon />;
      default: return null;
    }
  };

  const renderDocumentStatus = (document) => {
    if (!document) {
      return <Chip label="Missing" color="error" size="small" />;
    }
    if (document.verified) {
      return <Chip label="Verified" color="success" size="small" />;
    }
    return <Chip label="Pending" color="warning" size="small" />;
  };

  if (loading && nakesApplications.length === 0) {
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
          Nakes Verification
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadNakesApplications}
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, NIK, or STR number..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => handleStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Profession</TableCell>
                <TableCell>STR Number</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nakesApplications.map((application) => (
                <TableRow key={application._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        {application.user?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {application.user?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.user?.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          NIK: {application.nik}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {application.profession}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {application.specialization}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {application.strNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Exp: {formatDate(application.strExpiry)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                          STR:
                        </Typography>
                        {renderDocumentStatus(application.documents?.str)}
                      </Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                          SIP:
                        </Typography>
                        {renderDocumentStatus(application.documents?.sip)}
                      </Box>
                      <Box display="flex" alignItems="center">
                        <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                          CV:
                        </Typography>
                        {renderDocumentStatus(application.documents?.cv)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(application.status)}
                      label={application.status?.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(application.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => openDetailDialog(application)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {application.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openVerificationDialog(application, 'approved')}
                          >
                            <VerifiedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openVerificationDialog(application, 'rejected')}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalApplications}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={closeDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonIcon sx={{ mr: 1 }} />
            Nakes Application Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              {/* Personal Information */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedApplication.user?.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedApplication.user?.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">
                      {formatPhoneNumber(selectedApplication.user?.phone)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">NIK</Typography>
                    <Typography variant="body1">{selectedApplication.nik}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Professional Information */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Professional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Profession</Typography>
                    <Typography variant="body1">{selectedApplication.profession}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Specialization</Typography>
                    <Typography variant="body1">{selectedApplication.specialization}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">STR Number</Typography>
                    <Typography variant="body1">{selectedApplication.strNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">STR Expiry</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedApplication.strExpiry)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Work Experience</Typography>
                    <Typography variant="body1">
                      {selectedApplication.experience} years
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Documents */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="STR Document"
                      secondary={selectedApplication.documents?.str?.url || 'Not uploaded'}
                    />
                    {renderDocumentStatus(selectedApplication.documents?.str)}
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="SIP Document"
                      secondary={selectedApplication.documents?.sip?.url || 'Not uploaded'}
                    />
                    {renderDocumentStatus(selectedApplication.documents?.sip)}
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="CV Document"
                      secondary={selectedApplication.documents?.cv?.url || 'Not uploaded'}
                    />
                    {renderDocumentStatus(selectedApplication.documents?.cv)}
                  </ListItem>
                </List>
              </Paper>

              {/* Status History */}
              {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Status History
                  </Typography>
                  <List>
                    {selectedApplication.statusHistory.map((history, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Status changed to: ${history.status}`}
                          secondary={`${formatDate(history.date)} - ${history.reason || 'No reason provided'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>Close</Button>
          {selectedApplication?.status === 'pending' && (
            <>
              <Button
                color="error"
                onClick={() => {
                  closeDetailDialog();
                  openVerificationDialog(selectedApplication, 'rejected');
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  closeDetailDialog();
                  openVerificationDialog(selectedApplication, 'approved');
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onClose={closeVerificationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {verificationData.status === 'approved' ? 'Approve Application' : 'Reject Application'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={3}
              value={verificationData.reason}
              onChange={(e) => setVerificationData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder={`Enter reason for ${verificationData.status}...`}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={2}
              value={verificationData.notes}
              onChange={(e) => setVerificationData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or comments..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeVerificationDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleVerification}
            variant="contained"
            color={verificationData.status === 'approved' ? 'success' : 'error'}
            disabled={actionLoading || !verificationData.reason}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NakesVerification;