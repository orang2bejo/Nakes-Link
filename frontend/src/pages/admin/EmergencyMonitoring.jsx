import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
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
  Dashboard,
  LocalHospital,
  Warning,
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  LocationOn,
  Phone,
  Refresh,
  FilterList,
  Analytics,
  TrendingUp,
  TrendingDown,
  NotificationImportant,
  Assignment,
  Speed,
  Timer,
  Group,
  Map,
  Assessment,
  History,
  Settings,
  Download
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { emergencyAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EmergencyMonitoring = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [emergencies, setEmergencies] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    type: '',
    dateRange: 'today'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [emergencyTrends, setEmergencyTrends] = useState([]);

  useEffect(() => {
    fetchEmergencies();
    fetchStatistics();
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchEmergencies();
        fetchStatistics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: 100
      };
      
      const response = await emergencyAPI.getAllEmergencies(params);
      setEmergencies(response.data.emergencies);
    } catch (error) {
      toast.error('Failed to fetch emergencies');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await emergencyAPI.getStatistics(filters.dateRange);
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [responseTimeRes, trendsRes] = await Promise.all([
        emergencyAPI.getResponseTimeAnalytics(filters.dateRange),
        emergencyAPI.getEmergencyTrends(filters.dateRange)
      ]);
      
      setResponseTimeData(responseTimeRes.data);
      setEmergencyTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const calculateResponseTime = (emergency) => {
    if (!emergency.timeline || emergency.timeline.length < 2) return 'N/A';
    
    const created = new Date(emergency.createdAt);
    const responded = emergency.timeline.find(t => t.status === 'dispatched');
    
    if (!responded) return 'N/A';
    
    const diff = new Date(responded.timestamp) - created;
    const minutes = Math.floor(diff / 60000);
    
    return `${minutes} min`;
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Type,Severity,Status,Created,Response Time,Location\n" +
      emergencies.map(e => 
        `${e.id},${e.type},${e.severity},${e.status},${e.createdAt},${calculateResponseTime(e)},"${e.location?.address || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `emergency_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const DashboardTab = () => (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Emergencies
                  </Typography>
                  <Typography variant="h4">
                    {statistics.total || 0}
                  </Typography>
                </Box>
                <EmergencyIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Cases
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {statistics.active || 0}
                  </Typography>
                </Box>
                <NotificationImportant color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Resolved Today
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics.resolvedToday || 0}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">
                    {statistics.avgResponseTime || 'N/A'}
                  </Typography>
                </Box>
                <Timer color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Trends (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emergencyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                  <Line type="monotone" dataKey="critical" stroke="#ff0000" name="Critical" />
                  <Line type="monotone" dataKey="resolved" stroke="#00ff00" name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.byType || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(statistics.byType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const EmergencyListTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="dispatched">Dispatched</MenuItem>
                  <MenuItem value="en_route">En Route</MenuItem>
                  <MenuItem value="on_scene">On Scene</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  label="Date Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Emergency Cases
              {emergencies.length > 0 && (
                <Badge badgeContent={emergencies.length} color="primary" sx={{ ml: 2 }} />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportData}
                size="small"
              >
                Export
              </Button>
              <IconButton onClick={fetchEmergencies} disabled={loading}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Response Time</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emergencies.map((emergency) => (
                    <TableRow key={emergency.id}>
                      <TableCell>{emergency.id.slice(-8)}</TableCell>
                      <TableCell>
                        <Chip
                          label={emergency.type?.replace('_', ' ').toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emergency.severity}
                          color={getSeverityColor(emergency.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emergency.status}
                          color={getStatusColor(emergency.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(emergency.createdAt)}</TableCell>
                      <TableCell>{calculateResponseTime(emergency)}</TableCell>
                      <TableCell>
                        <Tooltip title={emergency.location?.address || 'No address'}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {emergency.location?.address || 'Unknown'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setDetailDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const AnalyticsTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Analytics
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeRange" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="avgResponseTime" fill="#8884d8" name="Avg Response Time (min)" />
                  <Bar dataKey="count" fill="#82ca9d" name="Number of Cases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Speed color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Average Response Time"
                    secondary={`${statistics.avgResponseTime || 'N/A'} minutes`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Resolution Rate"
                    secondary={`${statistics.resolutionRate || 0}%`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Group color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Active Responders"
                    secondary={`${statistics.activeResponders || 0} healthcare providers`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  PSC 119 Integration
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={statistics.psc119Health || 0} 
                  color={statistics.psc119Health > 80 ? 'success' : 'warning'}
                />
                <Typography variant="caption">
                  {statistics.psc119Health || 0}% operational
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Response Coverage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={statistics.coverage || 0} 
                  color={statistics.coverage > 70 ? 'success' : 'warning'}
                />
                <Typography variant="caption">
                  {statistics.coverage || 0}% area coverage
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  System Load
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={statistics.systemLoad || 0} 
                  color={statistics.systemLoad < 80 ? 'success' : 'error'}
                />
                <Typography variant="caption">
                  {statistics.systemLoad || 0}% capacity used
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmergencyIcon color="primary" />
          Emergency Monitoring
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
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Dashboard />} label="Dashboard" />
          <Tab icon={<Assignment />} label="Emergency List" />
          <Tab icon={<Analytics />} label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && <DashboardTab />}
      {activeTab === 1 && <EmergencyListTab />}
      {activeTab === 2 && <AnalyticsTab />}

      {/* Emergency Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedEmergency && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Emergency Details - {selectedEmergency.id.slice(-8)}
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
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Emergency Information
                    </Typography>
                    <Typography><strong>Type:</strong> {selectedEmergency.type?.replace('_', ' ').toUpperCase()}</Typography>
                    <Typography><strong>Priority:</strong> {selectedEmergency.priority}/5</Typography>
                    <Typography><strong>Description:</strong> {selectedEmergency.description}</Typography>
                    <Typography><strong>Created:</strong> {formatDate(selectedEmergency.createdAt)}</Typography>
                    <Typography><strong>Response Time:</strong> {calculateResponseTime(selectedEmergency)}</Typography>
                    {selectedEmergency.psc119?.ticketId && (
                      <Typography><strong>PSC 119 Ticket:</strong> {selectedEmergency.psc119.ticketId}</Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Location & Contact */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Location & Contact
                    </Typography>
                    <Typography><strong>Address:</strong> {selectedEmergency.location?.address}</Typography>
                    {selectedEmergency.location?.landmark && (
                      <Typography><strong>Landmark:</strong> {selectedEmergency.location.landmark}</Typography>
                    )}
                    <Typography><strong>Contact:</strong> {selectedEmergency.contactNumber}</Typography>
                    {selectedEmergency.alternateContact && (
                      <Typography><strong>Alternate:</strong> {selectedEmergency.alternateContact}</Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Timeline */}
                {selectedEmergency.timeline && selectedEmergency.timeline.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Timeline
                      </Typography>
                      <Timeline>
                        {selectedEmergency.timeline.map((event, index) => (
                          <TimelineItem key={index}>
                            <TimelineSeparator>
                              <TimelineDot color={getStatusColor(event.status)} />
                              {index < selectedEmergency.timeline.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent>
                              <Typography variant="h6" component="span">
                                {event.status.replace('_', ' ').toUpperCase()}
                              </Typography>
                              <Typography>{formatDate(event.timestamp)}</Typography>
                              {event.notes && (
                                <Typography color="text.secondary">{event.notes}</Typography>
                              )}
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </Paper>
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

export default EmergencyMonitoring;