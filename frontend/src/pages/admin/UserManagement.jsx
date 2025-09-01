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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    verified: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionData, setActionData] = useState({
    reason: '',
    duration: '',
    verified: false,
    suspended: false
  });

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, searchTerm, filters, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.verified !== '' && { verified: filters.verified })
      };

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setTotalUsers(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
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

  const handleActionMenuOpen = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedUser(null);
  };

  const openDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    setActionData({
      reason: '',
      duration: '',
      verified: selectedUser?.verified || false,
      suspended: selectedUser?.suspended || false
    });
    handleActionMenuClose();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setActionData({ reason: '', duration: '', verified: false, suspended: false });
  };

  const handleUserAction = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      switch (dialogType) {
        case 'verify':
          await adminAPI.verifyUser(selectedUser._id, {
            verified: actionData.verified,
            reason: actionData.reason
          });
          break;
        case 'suspend':
          await adminAPI.suspendUser(selectedUser._id, {
            suspended: actionData.suspended,
            reason: actionData.reason,
            duration: actionData.duration ? parseInt(actionData.duration) : undefined
          });
          break;
        default:
          break;
      }

      await loadUsers();
      closeDialog();
    } catch (err) {
      console.error('User action failed:', err);
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getUserStatusColor = (user) => {
    if (user.suspended) return 'error';
    if (!user.verified) return 'warning';
    if (user.status === 'active') return 'success';
    return 'default';
  };

  const getUserStatusText = (user) => {
    if (user.suspended) return 'Suspended';
    if (!user.verified) return 'Unverified';
    return user.status || 'Active';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'nakes': return 'primary';
      case 'patient': return 'info';
      default: return 'default';
    }
  };

  if (loading && users.length === 0) {
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
          User Management
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="nakes">Nakes</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Verified</InputLabel>
                <Select
                  value={filters.verified}
                  label="Verified"
                  onChange={(e) => handleFilterChange('verified', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Verified</MenuItem>
                  <MenuItem value="false">Unverified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="createdAt">Created Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="lastLogin">Last Login</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {formatPhoneNumber(user.phone)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role?.toUpperCase()}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getUserStatusText(user)}
                      color={getUserStatusColor(user)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.verified ? (
                      <Chip
                        icon={<VerifiedIcon />}
                        label="Verified"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="Unverified"
                        color="warning"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
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
          count={totalUsers}
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

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => openDialog('verify')}>
          <VerifiedIcon sx={{ mr: 1 }} />
          {selectedUser?.verified ? 'Unverify' : 'Verify'} User
        </MenuItem>
        <MenuItem onClick={() => openDialog('suspend')}>
          <BlockIcon sx={{ mr: 1 }} />
          {selectedUser?.suspended ? 'Unsuspend' : 'Suspend'} User
        </MenuItem>
        <MenuItem onClick={() => navigate(`/admin/users/${selectedUser?._id}`)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
      </Menu>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'verify' && (selectedUser?.verified ? 'Unverify User' : 'Verify User')}
          {dialogType === 'suspend' && (selectedUser?.suspended ? 'Unsuspend User' : 'Suspend User')}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'verify' && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={actionData.verified}
                    onChange={(e) => setActionData(prev => ({ ...prev, verified: e.target.checked }))}
                  />
                }
                label="Verified Status"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason (Optional)"
                multiline
                rows={3}
                value={actionData.reason}
                onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for verification status change..."
              />
            </Box>
          )}

          {dialogType === 'suspend' && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={actionData.suspended}
                    onChange={(e) => setActionData(prev => ({ ...prev, suspended: e.target.checked }))}
                  />
                }
                label="Suspended Status"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={actionData.reason}
                onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for suspension..."
                required
                sx={{ mb: 2 }}
              />
              {actionData.suspended && (
                <TextField
                  fullWidth
                  label="Duration (Days)"
                  type="number"
                  value={actionData.duration}
                  onChange={(e) => setActionData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Leave empty for indefinite suspension"
                  helperText="Optional: Number of days for temporary suspension"
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUserAction}
            variant="contained"
            disabled={actionLoading || (dialogType === 'suspend' && actionData.suspended && !actionData.reason)}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;