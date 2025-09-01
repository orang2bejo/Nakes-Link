import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Badge,
  Fab,
  Tooltip,
  Avatar,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/material';
import {
  Emergency as EmergencyIcon,
  Phone,
  LocationOn,
  LocalHospital,
  Warning,
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  Description,
  Refresh,
  Navigation,
  Call,
  Message,
  DirectionsCar,
  MyLocation,
  FilterList,
  NotificationImportant
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { emergencyAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EmergencyResponse = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    radius: 10
  });
  const [responseData, setResponseData] = useState({
    response: '',
    estimatedArrival: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    fetchActiveEmergencies();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchActiveEmergencies();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.warning('Unable to get your location. Some features may be limited.');
        }
      );
    }
  };

  const fetchActiveEmergencies = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
        params.radius = filters.radius;
      }
      
      const response = await emergencyAPI.getActiveEmergencies(params);
      let filteredEmergencies = response.data.emergencies;
      
      // Apply filters
      if (filters.severity) {
        filteredEmergencies = filteredEmergencies.filter(
          emergency => emergency.severity === filters.severity
        );
      }
      
      if (filters.type) {
        filteredEmergencies = filteredEmergencies.filter(
          emergency => emergency.type === filters.type
        );
      }
      
      setEmergencies(filteredEmergencies);
    } catch (error) {
      toast.error('Failed to fetch active emergencies');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyResponse = async () => {
    try {
      if (!responseData.response) {
        toast.error('Please select your response');
        return;
      }
      
      setLoading(true);
      await emergencyAPI.respondToEmergency(selectedEmergency.id, responseData);
      
      toast.success('Response sent successfully');
      setResponseDialogOpen(false);
      setResponseData({ response: '', estimatedArrival: '' });
      fetchActiveEmergencies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send response');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'dispatched': return 'info';
      case 'en_route': return 'primary';
      case 'on_scene': return 'secondary';
      case 'resolved': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority >= 4) return <NotificationImportant color="error" />;
    if (priority >= 3) return <Warning color="warning" />;
    return <EmergencyIcon color="info" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const calculateDistance = (emergency) => {
    if (!userLocation || !emergency.location?.coordinates) return null;
    
    const [lon, lat] = emergency.location.coordinates;
    const R = 6371; // Earth's radius in km
    const dLat = (lat - userLocation.latitude) * Math.PI / 180;
    const dLon = (lon - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const openDirections = (emergency) => {
    if (emergency.location?.coordinates) {
      const [lon, lat] = emergency.location.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      window.open(url, '_blank');
    }
  };

  const callEmergencyContact = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalHospital color="primary" />
          Emergency Response
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle auto-refresh">
            <IconButton
              color={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<MyLocation />}
            onClick={getCurrentLocation}
          >
            Update Location
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  label="Severity"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="accident">Accident</MenuItem>
                  <MenuItem value="fire">Fire</MenuItem>
                  <MenuItem value="crime">Crime</MenuItem>
                  <MenuItem value="natural_disaster">Natural Disaster</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Radius (km)"
                value={filters.radius}
                onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) || 10 }))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Active Emergencies
              {emergencies.length > 0 && (
                <Badge badgeContent={emergencies.length} color="error" sx={{ ml: 2 }} />
              )}
            </Typography>
            <IconButton onClick={fetchActiveEmergencies} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : emergencies.length === 0 ? (
            <Alert severity="info">
              No active emergencies in your area
            </Alert>
          ) : (
            <List>
              {emergencies.map((emergency, index) => {
                const distance = calculateDistance(emergency);
                return (
                  <React.Fragment key={emergency.id}>
                    <ListItem
                      sx={{
                        border: emergency.severity === 'critical' ? '2px solid red' : 'none',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        {getPriorityIcon(emergency.priority)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {emergency.type?.replace('_', ' ').toUpperCase()}
                            </Typography>
                            <Chip
                              label={emergency.status}
                              color={getStatusColor(emergency.status)}
                              size="small"
                            />
                            <Chip
                              label={emergency.severity}
                              color={getSeverityColor(emergency.severity)}
                              size="small"
                            />
                            {distance && (
                              <Chip
                                icon={<LocationOn />}
                                label={`${distance} km`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {emergency.psc119?.ticketId && (
                              <Chip
                                label="PSC 119"
                                color="info"
                                size="small"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {emergency.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                              {formatDate(emergency.createdAt)}
                            </Typography>
                            {emergency.location?.address && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                {emergency.location.address}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setDetailDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setResponseDialogOpen(true);
                          }}
                        >
                          Respond
                        </Button>
                        {emergency.contactNumber && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Call />}
                            onClick={() => callEmergencyContact(emergency.contactNumber)}
                          >
                            Call
                          </Button>
                        )}
                        {emergency.location?.coordinates && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Navigation />}
                            onClick={() => openDirections(emergency)}
                          >
                            Directions
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                    {index < emergencies.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Emergency Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmergency && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Emergency Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedEmergency.status}
                    color={getStatusColor(selectedEmergency.status)}
                  />
                  <Chip
                    label={selectedEmergency.severity}
                    color={getSeverityColor(selectedEmergency.severity)}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Emergency Information
                    </Typography>
                    <Typography><strong>Type:</strong> {selectedEmergency.type?.replace('_', ' ').toUpperCase()}</Typography>
                    <Typography><strong>Priority:</strong> {selectedEmergency.priority}/5</Typography>
                    <Typography><strong>Description:</strong> {selectedEmergency.description}</Typography>
                    <Typography><strong>Created:</strong> {formatDate(selectedEmergency.createdAt)}</Typography>
                    {selectedEmergency.psc119?.ticketId && (
                      <Typography><strong>PSC 119 Ticket:</strong> {selectedEmergency.psc119.ticketId}</Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Patient Information */}
                {selectedEmergency.medicalInfo && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Patient Information
                      </Typography>
                      {selectedEmergency.medicalInfo.patientAge && (
                        <Typography><strong>Age:</strong> {selectedEmergency.medicalInfo.patientAge}</Typography>
                      )}
                      {selectedEmergency.medicalInfo.patientGender && (
                        <Typography><strong>Gender:</strong> {selectedEmergency.medicalInfo.patientGender}</Typography>
                      )}
                      {selectedEmergency.medicalInfo.symptoms && (
                        <Typography><strong>Symptoms:</strong> {selectedEmergency.medicalInfo.symptoms}</Typography>
                      )}
                      {selectedEmergency.medicalInfo.consciousness && (
                        <Typography><strong>Consciousness:</strong> {selectedEmergency.medicalInfo.consciousness}</Typography>
                      )}
                      {selectedEmergency.medicalInfo.breathing && (
                        <Typography><strong>Breathing:</strong> {selectedEmergency.medicalInfo.breathing}</Typography>
                      )}
                      {selectedEmergency.medicalInfo.pulse && (
                        <Typography><strong>Pulse:</strong> {selectedEmergency.medicalInfo.pulse}</Typography>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* Location Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Location Information
                    </Typography>
                    <Typography><strong>Address:</strong> {selectedEmergency.location?.address}</Typography>
                    {selectedEmergency.location?.landmark && (
                      <Typography><strong>Landmark:</strong> {selectedEmergency.location.landmark}</Typography>
                    )}
                    {calculateDistance(selectedEmergency) && (
                      <Typography><strong>Distance:</strong> {calculateDistance(selectedEmergency)} km from your location</Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography><strong>Primary:</strong> {selectedEmergency.contactNumber}</Typography>
                    {selectedEmergency.alternateContact && (
                      <Typography><strong>Alternate:</strong> {selectedEmergency.alternateContact}</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setDetailDialogOpen(false);
                  setResponseDialogOpen(true);
                }}
              >
                Respond to Emergency
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => setResponseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Respond to Emergency
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Your Response</InputLabel>
                <Select
                  value={responseData.response}
                  onChange={(e) => setResponseData(prev => ({ ...prev, response: e.target.value }))}
                  label="Your Response"
                >
                  <MenuItem value="available">Available - En Route</MenuItem>
                  <MenuItem value="unavailable">Not Available</MenuItem>
                  <MenuItem value="en_route">Already En Route</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {responseData.response === 'available' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Estimated Arrival"
                  value={responseData.estimatedArrival}
                  onChange={(e) => setResponseData(prev => ({ ...prev, estimatedArrival: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEmergencyResponse}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Refresh */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={fetchActiveEmergencies}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : <Refresh />}
      </Fab>
    </Box>
  );
};

export default EmergencyResponse;