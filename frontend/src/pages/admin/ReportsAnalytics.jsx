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
  Tooltip
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate, formatNumber } from '../../utils/helpers';

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Date filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [period, setPeriod] = useState('30d');
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topNakes, setTopNakes] = useState([]);
  const [geographicData, setGeographicData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const periodOptions = [
    { value: '7d', label: '7 Hari Terakhir' },
    { value: '30d', label: '30 Hari Terakhir' },
    { value: '90d', label: '3 Bulan Terakhir' },
    { value: '1y', label: '1 Tahun Terakhir' },
    { value: 'custom', label: 'Kustom' }
  ];

  const reportTypes = [
    { value: 'revenue', label: 'Laporan Pendapatan' },
    { value: 'users', label: 'Laporan Pengguna' },
    { value: 'services', label: 'Laporan Layanan' },
    { value: 'appointments', label: 'Laporan Janji Temu' },
    { value: 'nakes', label: 'Laporan Nakes' },
    { value: 'comprehensive', label: 'Laporan Komprehensif' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period
      };

      // Fetch all analytics data
      const [overview, revenue, userGrowth, services, appointments] = await Promise.all([
        adminAPI.getAnalytics({ ...params, type: 'overview' }),
        adminAPI.getRevenueReports(params),
        adminAPI.getUserReports(params),
        adminAPI.getServiceReports(params),
        adminAPI.getAnalytics({ ...params, type: 'appointments' })
      ]);

      setOverviewData(overview.data);
      setRevenueData(revenue.data.chartData || []);
      setUserGrowthData(userGrowth.data.chartData || []);
      setServiceData(services.data.chartData || []);
      setAppointmentData(appointments.data.chartData || []);
      setTopServices(services.data.topServices || []);
      setTopNakes(services.data.topNakes || []);
      setGeographicData(userGrowth.data.geographic || []);
    } catch (err) {
      setError('Gagal memuat data analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      const now = new Date();
      let start = new Date();
      
      switch (newPeriod) {
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      setStartDate(start);
      setEndDate(now);
    }
  };

  const handleExport = async (reportType) => {
    try {
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: 'xlsx'
      };

      const response = await adminAPI.exportReport(reportType, params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Gagal mengunduh laporan');
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
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
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {change >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !overviewData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Laporan & Analytics
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
                <FormControl fullWidth>
                  <InputLabel>Periode</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    label="Periode"
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {period === 'custom' && (
                <>
                  <Grid item xs={12} md={2}>
                    <DatePicker
                      label="Tanggal Mulai"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <DatePicker
                      label="Tanggal Akhir"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Export Laporan</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => handleExport(e.target.value)}
                    label="Export Laporan"
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAnalyticsData}
                  disabled={loading}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        {overviewData && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Pendapatan"
                value={formatCurrency(overviewData.totalRevenue)}
                change={overviewData.revenueGrowth}
                icon={<AssessmentIcon fontSize="large" />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Pengguna"
                value={formatNumber(overviewData.totalUsers)}
                change={overviewData.userGrowth}
                icon={<PieChartIcon fontSize="large" />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Janji Temu"
                value={formatNumber(overviewData.totalAppointments)}
                change={overviewData.appointmentGrowth}
                icon={<BarChartIcon fontSize="large" />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Nakes Aktif"
                value={formatNumber(overviewData.activeNakes)}
                change={overviewData.nakesGrowth}
                icon={<TimelineIcon fontSize="large" />}
                color="warning"
              />
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Revenue Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tren Pendapatan
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* User Growth Chart */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pertumbuhan Pengguna
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Service Categories */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kategori Layanan Populer
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Appointment Status */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Janji Temu
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={appointmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Services */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Layanan Terpopuler
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Layanan</TableCell>
                        <TableCell align="right">Booking</TableCell>
                        <TableCell align="right">Pendapatan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topServices.slice(0, 5).map((service, index) => (
                        <TableRow key={service._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {service.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {service.category}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{service.bookingCount}</TableCell>
                          <TableCell align="right">{formatCurrency(service.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Nakes */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nakes Terbaik
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nakes</TableCell>
                        <TableCell align="right">Rating</TableCell>
                        <TableCell align="right">Pasien</TableCell>
                        <TableCell align="right">Pendapatan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topNakes.slice(0, 5).map((nakes, index) => (
                        <TableRow key={nakes._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {nakes.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {nakes.specialization}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${nakes.rating}/5`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{nakes.patientCount}</TableCell>
                          <TableCell align="right">{formatCurrency(nakes.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Geographic Distribution */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribusi Geografis Pengguna
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Provinsi</TableCell>
                        <TableCell align="right">Pengguna</TableCell>
                        <TableCell align="right">Nakes</TableCell>
                        <TableCell align="right">Janji Temu</TableCell>
                        <TableCell align="right">Pendapatan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {geographicData.map((location) => (
                        <TableRow key={location.province}>
                          <TableCell>{location.province}</TableCell>
                          <TableCell align="right">{formatNumber(location.userCount)}</TableCell>
                          <TableCell align="right">{formatNumber(location.nakesCount)}</TableCell>
                          <TableCell align="right">{formatNumber(location.appointmentCount)}</TableCell>
                          <TableCell align="right">{formatCurrency(location.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsAnalytics;