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
  LinearProgress
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
  Add,
  MyLocation,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { emergencyAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Emergency = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: '',
    severity: 'medium',
    description: '',
    contactNumber: user?.phone || '',
    alternateContact: '',
    location: {
      coordinates: [],
      address: '',
      landmark: ''
    },
    medicalInfo: {
      patientAge: '',
      patientGender: '',
      symptoms: '',
      allergies: '',
      medications: '',
      medicalHistory: '',
      consciousness: '',
      breathing: '',
      pulse: ''
    }
  });

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const response = await emergencyAPI.getUserEmergencies();
      setEmergencies(response.data.emergencies);
    } catch (error) {
      toast.error('Failed to fetch emergency history');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude]
          }
        }));
        
        // Try to get address from coordinates (reverse geocoding)
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          const data = await response.json();
          if (data.results && data.results[0]) {
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: data.results[0].formatted
              }
            }));
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
        
        setGettingLocation(false);
        toast.success('Location obtained successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get current location');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCreateEmergency = async () => {
    try {
      // Validation
      if (!formData.type || !formData.description || !formData.contactNumber) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (!formData.location.coordinates.length) {
        toast.error('Please provide your location');
        return;
      }

      setLoading(true);
      const response = await emergencyAPI.createEmergency(formData);
      
      toast.success('Emergency request created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchEmergencies();
      
      // Show emergency details
      setSelectedEmergency(response.data.emergency);
      setDetailDialogOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create emergency request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      severity: 'medium',
      description: '',
      contactNumber: user?.phone || '',
      alternateContact: '',
      location: {
        coordinates: [],
        address: '',
        landmark: ''
      },
      medicalInfo: {
        patientAge: '',
        patientGender: '',
        symptoms: '',
        allergies: '',
        medications: '',
        medicalHistory: '',
        consciousness: '',
        breathing: '',
        pulse: ''
      }
    });
    setLocation(null);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmergencyIcon color="error" />
          Emergency / SOS
        </Typography>
        <Button
          variant="contained"
          color="error"
          size="large"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ fontWeight: 'bold' }}
        >
          Create Emergency
        </Button>
      </Box>

      {/* Emergency Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Emergency Hotline:</strong> 119 (PSC 119) | <strong>Police:</strong> 110 | <strong>Fire:</strong> 113
          <br />
          Use this system for medical emergencies. For immediate life-threatening situations, call 119 directly.
        </Typography>
      </Alert>

      {/* Emergency History */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Emergency History</Typography>
            <IconButton onClick={fetchEmergencies} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : emergencies.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
              No emergency requests found
            </Typography>
          ) : (
            <List>
              {emergencies.map((emergency, index) => (
                <React.Fragment key={emergency.id}>
                  <ListItem
                    button
                    onClick={() => {
                      setSelectedEmergency(emergency);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <EmergencyIcon color={getSeverityColor(emergency.severity)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {emergency.type.replace('_', ' ').toUpperCase()}
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
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {emergency.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(emergency.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < emergencies.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Emergency Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmergencyIcon color="error" />
            Create Emergency Request
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Emergency Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Emergency Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Emergency Type"
                >
                  <MenuItem value="medical">Medical Emergency</MenuItem>
                  <MenuItem value="accident">Accident</MenuItem>
                  <MenuItem value="fire">Fire</MenuItem>
                  <MenuItem value="crime">Crime</MenuItem>
                  <MenuItem value="natural_disaster">Natural Disaster</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Severity */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the emergency situation in detail..."
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Primary contact number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alternate Contact"
                value={formData.alternateContact}
                onChange={(e) => handleInputChange('alternateContact', e.target.value)}
                placeholder="Alternate contact number"
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={gettingLocation ? <CircularProgress size={20} /> : <MyLocation />}
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
                </Button>
                {location && (
                  <Chip
                    icon={<LocationOn />}
                    label={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                    color="success"
                  />
                )}
              </Box>
              
              <TextField
                fullWidth
                required
                label="Address"
                value={formData.location.address}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                placeholder="Full address of the emergency location"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Landmark"
                value={formData.location.landmark}
                onChange={(e) => handleInputChange('location.landmark', e.target.value)}
                placeholder="Nearby landmark or building"
              />
            </Grid>

            {/* Medical Information (if medical emergency) */}
            {formData.type === 'medical' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Medical Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Patient Age"
                    value={formData.medicalInfo.patientAge}
                    onChange={(e) => handleInputChange('medicalInfo.patientAge', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Patient Gender</InputLabel>
                    <Select
                      value={formData.medicalInfo.patientGender}
                      onChange={(e) => handleInputChange('medicalInfo.patientGender', e.target.value)}
                      label="Patient Gender"
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Symptoms"
                    value={formData.medicalInfo.symptoms}
                    onChange={(e) => handleInputChange('medicalInfo.symptoms', e.target.value)}
                    placeholder="Current symptoms..."
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Consciousness</InputLabel>
                    <Select
                      value={formData.medicalInfo.consciousness}
                      onChange={(e) => handleInputChange('medicalInfo.consciousness', e.target.value)}
                      label="Consciousness"
                    >
                      <MenuItem value="conscious">Conscious</MenuItem>
                      <MenuItem value="semi_conscious">Semi-conscious</MenuItem>
                      <MenuItem value="unconscious">Unconscious</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Breathing</InputLabel>
                    <Select
                      value={formData.medicalInfo.breathing}
                      onChange={(e) => handleInputChange('medicalInfo.breathing', e.target.value)}
                      label="Breathing"
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="difficulty">Difficulty</MenuItem>
                      <MenuItem value="not_breathing">Not Breathing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Pulse</InputLabel>
                    <Select
                      value={formData.medicalInfo.pulse}
                      onChange={(e) => handleInputChange('medicalInfo.pulse', e.target.value)}
                      label="Pulse"
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="weak">Weak</MenuItem>
                      <MenuItem value="strong">Strong</MenuItem>
                      <MenuItem value="irregular">Irregular</MenuItem>
                      <MenuItem value="no_pulse">No Pulse</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCreateEmergency}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <EmergencyIcon />}
          >
            {loading ? 'Creating...' : 'Create Emergency'}
          </Button>
        </DialogActions>
      </Dialog>

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
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Emergency Information
                    </Typography>
                    <Typography><strong>Type:</strong> {selectedEmergency.type?.replace('_', ' ').toUpperCase()}</Typography>
                    <Typography><strong>Description:</strong> {selectedEmergency.description}</Typography>
                    <Typography><strong>Created:</strong> {formatDate(selectedEmergency.createdAt)}</Typography>
                    {selectedEmergency.psc119TicketId && (
                      <Typography><strong>PSC 119 Ticket:</strong> {selectedEmergency.psc119TicketId}</Typography>
                    )}
                  </Paper>
                </Grid>
                
                {selectedEmergency.estimatedArrival && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography>
                        <strong>Estimated Arrival:</strong> {formatDate(selectedEmergency.estimatedArrival)}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Emergency;