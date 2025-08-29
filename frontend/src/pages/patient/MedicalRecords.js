import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Avatar,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
} from '@mui/material';
import {
  HealthAndSafety,
  Description,
  LocalHospital,
  Biotech,
  Medication,
  Vaccines,
  MonitorHeart,
  Download,
  Upload,
  Visibility,
  Add,
  ExpandMore,
  CalendarToday,
  Person,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  Share,
  Print,
  Search,
  FilterList,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const MedicalRecords = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [medicalData, setMedicalData] = useState({
    records: [],
    labResults: [],
    prescriptions: [],
    vaccinations: [],
    vitals: [],
    documents: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchMedicalData();
  }, []);

  const fetchMedicalData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        records: [
          {
            id: 1,
            date: new Date('2024-01-15'),
            doctorName: 'Dr. Sarah Wijaya',
            specialty: 'Dokter Umum',
            diagnosis: 'Flu dan Batuk',
            symptoms: ['Demam', 'Batuk', 'Pilek'],
            treatment: 'Istirahat, minum obat sesuai resep',
            notes: 'Pasien mengalami gejala flu ringan, dianjurkan istirahat total',
            followUp: '2024-01-22',
            status: 'completed',
          },
          {
            id: 2,
            date: new Date('2024-01-10'),
            doctorName: 'Dr. Ahmad Hidayat',
            specialty: 'Spesialis Jantung',
            diagnosis: 'Pemeriksaan Rutin Jantung',
            symptoms: ['Nyeri dada ringan'],
            treatment: 'EKG normal, lanjutkan gaya hidup sehat',
            notes: 'Hasil EKG menunjukkan kondisi jantung normal',
            followUp: '2024-04-10',
            status: 'completed',
          },
        ],
        labResults: [
          {
            id: 1,
            date: new Date('2024-01-12'),
            testName: 'Darah Lengkap',
            results: {
              'Hemoglobin': { value: 14.2, unit: 'g/dL', normal: '12-16', status: 'normal' },
              'Leukosit': { value: 7500, unit: '/μL', normal: '4000-10000', status: 'normal' },
              'Trombosit': { value: 280000, unit: '/μL', normal: '150000-400000', status: 'normal' },
            },
            doctorName: 'Dr. Sarah Wijaya',
            status: 'completed',
          },
          {
            id: 2,
            date: new Date('2024-01-08'),
            testName: 'Kolesterol',
            results: {
              'Kolesterol Total': { value: 195, unit: 'mg/dL', normal: '<200', status: 'normal' },
              'LDL': { value: 120, unit: 'mg/dL', normal: '<130', status: 'normal' },
              'HDL': { value: 55, unit: 'mg/dL', normal: '>40', status: 'normal' },
            },
            doctorName: 'Dr. Ahmad Hidayat',
            status: 'completed',
          },
        ],
        prescriptions: [
          {
            id: 1,
            date: new Date('2024-01-15'),
            doctorName: 'Dr. Sarah Wijaya',
            medications: [
              {
                name: 'Paracetamol 500mg',
                dosage: '3x1 tablet',
                duration: '5 hari',
                instructions: 'Diminum setelah makan',
              },
              {
                name: 'OBH Combi',
                dosage: '3x1 sendok makan',
                duration: '7 hari',
                instructions: 'Diminum setelah makan',
              },
            ],
            diagnosis: 'Flu dan Batuk',
            status: 'active',
          },
        ],
        vaccinations: [
          {
            id: 1,
            date: new Date('2023-12-01'),
            vaccine: 'Influenza',
            batch: 'FLU2023-001',
            location: 'Puskesmas Kebon Jeruk',
            nextDue: new Date('2024-12-01'),
            status: 'completed',
          },
          {
            id: 2,
            date: new Date('2023-06-15'),
            vaccine: 'COVID-19 Booster',
            batch: 'COV2023-456',
            location: 'RS Siloam',
            nextDue: null,
            status: 'completed',
          },
        ],
        vitals: [
          { date: '2024-01-15', weight: 68, height: 170, bmi: 23.5, bloodPressure: '120/80', heartRate: 72, temperature: 36.5 },
          { date: '2024-01-10', weight: 68.5, height: 170, bmi: 23.7, bloodPressure: '118/78', heartRate: 70, temperature: 36.8 },
          { date: '2024-01-05', weight: 69, height: 170, bmi: 23.9, bloodPressure: '122/82', heartRate: 74, temperature: 36.6 },
          { date: '2023-12-30', weight: 69.2, height: 170, bmi: 24.0, bloodPressure: '125/85', heartRate: 76, temperature: 36.4 },
        ],
        documents: [
          {
            id: 1,
            name: 'Hasil EKG - 10 Jan 2024',
            type: 'pdf',
            size: '2.5 MB',
            uploadDate: new Date('2024-01-10'),
            category: 'Lab Results',
          },
          {
            id: 2,
            name: 'X-Ray Dada - 15 Des 2023',
            type: 'jpg',
            size: '1.8 MB',
            uploadDate: new Date('2023-12-15'),
            category: 'Imaging',
          },
        ],
      };
      
      setMedicalData(mockData);
    } catch (error) {
      console.error('Error fetching medical data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data rekam medis',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'success';
      case 'high': return 'warning';
      case 'low': return 'info';
      case 'critical': return 'error';
      case 'active': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return <CheckCircle />;
      case 'high': return <Warning />;
      case 'low': return <Info />;
      case 'critical': return <Warning />;
      default: return <Info />;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) return;
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument = {
        id: Date.now(),
        name: uploadFile.name,
        type: uploadFile.type.split('/')[1],
        size: `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date(),
        category: 'Other',
      };
      
      setMedicalData(prev => ({
        ...prev,
        documents: [newDocument, ...prev.documents],
      }));
      
      setUploadDialog(false);
      setUploadFile(null);
      setSnackbar({
        open: true,
        message: 'Dokumen berhasil diunggah',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal mengunggah dokumen',
        severity: 'error',
      });
    }
  };

  const VitalsChart = () => {
    const chartData = medicalData.vitals.map(vital => ({
      date: format(new Date(vital.date), 'dd/MM'),
      weight: vital.weight,
      bmi: vital.bmi,
      systolic: parseInt(vital.bloodPressure.split('/')[0]),
      diastolic: parseInt(vital.bloodPressure.split('/')[1]),
      heartRate: vital.heartRate,
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Berat Badan & BMI</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Berat (kg)" />
                  <Line type="monotone" dataKey="bmi" stroke="#82ca9d" name="BMI" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tekanan Darah</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#ff7300" name="Sistolik" />
                  <Line type="monotone" dataKey="diastolic" stroke="#387908" name="Diastolik" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const RecordsTab = () => (
    <Box>
      <Timeline>
        {medicalData.records.map((record, index) => (
          <TimelineItem key={record.id}>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <LocalHospital />
              </TimelineDot>
              {index < medicalData.records.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {record.diagnosis}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(record.date, 'dd MMMM yyyy', { locale: id })} • {record.doctorName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.specialty}
                        </Typography>
                      </Box>
                      <Chip
                        label={record.status === 'completed' ? 'Selesai' : 'Aktif'}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Gejala:</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {record.symptoms.map((symptom, idx) => (
                          <Chip key={idx} label={symptom} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>Pengobatan:</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {record.treatment}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>Catatan:</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {record.notes}
                    </Typography>
                    
                    {record.followUp && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Kontrol berikutnya: {format(new Date(record.followUp), 'dd MMMM yyyy', { locale: id })}
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => {
                          setSelectedRecord(record);
                          setDetailDialog(true);
                        }}
                      >
                        Detail
                      </Button>
                      <Button size="small" startIcon={<Download />}>
                        Unduh
                      </Button>
                      <Button size="small" startIcon={<Share />}>
                        Bagikan
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );

  const LabResultsTab = () => (
    <Box>
      {medicalData.labResults.map((lab, index) => (
        <motion.div
          key={lab.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {lab.testName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(lab.date, 'dd MMMM yyyy', { locale: id })} • {lab.doctorName}
                  </Typography>
                </Box>
                <Chip
                  label="Selesai"
                  color="success"
                  icon={<CheckCircle />}
                />
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parameter</TableCell>
                      <TableCell align="right">Hasil</TableCell>
                      <TableCell align="right">Satuan</TableCell>
                      <TableCell align="right">Normal</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(lab.results).map(([param, data]) => (
                      <TableRow key={param}>
                        <TableCell>{param}</TableCell>
                        <TableCell align="right">{data.value}</TableCell>
                        <TableCell align="right">{data.unit}</TableCell>
                        <TableCell align="right">{data.normal}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={data.status === 'normal' ? 'Normal' : data.status}
                            color={getStatusColor(data.status)}
                            icon={getStatusIcon(data.status)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" startIcon={<Download />}>
                  Unduh PDF
                </Button>
                <Button size="small" startIcon={<Share />}>
                  Bagikan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  );

  const PrescriptionsTab = () => (
    <Box>
      {medicalData.prescriptions.map((prescription, index) => (
        <motion.div
          key={prescription.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Resep - {prescription.diagnosis}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(prescription.date, 'dd MMMM yyyy', { locale: id })} • {prescription.doctorName}
                  </Typography>
                </Box>
                <Chip
                  label={prescription.status === 'active' ? 'Aktif' : 'Selesai'}
                  color={getStatusColor(prescription.status)}
                />
              </Box>
              
              <List>
                {prescription.medications.map((med, idx) => (
                  <ListItem key={idx} divider={idx < prescription.medications.length - 1}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Medication color="primary" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {med.name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Dosis:</strong> {med.dosage}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Durasi:</strong> {med.duration}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Petunjuk:</strong> {med.instructions}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" startIcon={<Download />}>
                  Unduh Resep
                </Button>
                <Button size="small" startIcon={<LocalHospital />}>
                  Beli Obat
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  );

  const VaccinationsTab = () => (
    <Box>
      {medicalData.vaccinations.map((vaccination, index) => (
        <motion.div
          key={vaccination.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Vaccines />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {vaccination.vaccine}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(vaccination.date, 'dd MMMM yyyy', { locale: id })} • {vaccination.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Batch: {vaccination.batch}
                  </Typography>
                  {vaccination.nextDue && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Vaksinasi berikutnya: {format(vaccination.nextDue, 'dd MMMM yyyy', { locale: id })}
                    </Alert>
                  )}
                </Box>
                <Chip
                  label="Selesai"
                  color="success"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  );

  const DocumentsTab = () => (
    <Box>
      <Grid container spacing={2}>
        {medicalData.documents.map((doc, index) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Description sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    {doc.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doc.category} • {doc.size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(doc.uploadDate, 'dd MMM yyyy', { locale: id })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button size="small" startIcon={<Visibility />} fullWidth>
                      Lihat
                    </Button>
                    <Button size="small" startIcon={<Download />} fullWidth>
                      Unduh
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat rekam medis..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Rekam Medis
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Kelola dan pantau riwayat kesehatan Anda
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setUploadDialog(true)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  mr: 1,
                }}
              >
                Upload Dokumen
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setShareDialog(true)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Bagikan
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Vitals Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <VitalsChart />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper sx={{ mt: 4, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<HealthAndSafety />} label="Riwayat Medis" />
            <Tab icon={<Biotech />} label="Hasil Lab" />
            <Tab icon={<Medication />} label="Resep" />
            <Tab icon={<Vaccines />} label="Vaksinasi" />
            <Tab icon={<MonitorHeart />} label="Vital Signs" />
            <Tab icon={<Description />} label="Dokumen" />
          </Tabs>
        </Paper>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 0 && <RecordsTab />}
          {activeTab === 1 && <LabResultsTab />}
          {activeTab === 2 && <PrescriptionsTab />}
          {activeTab === 3 && <VaccinationsTab />}
          {activeTab === 4 && <VitalsChart />}
          {activeTab === 5 && <DocumentsTab />}
        </AnimatePresence>
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Dokumen Medis</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
              type="file"
              id="file-upload"
              hidden
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                sx={{ mb: 2 }}
              >
                Pilih File
              </Button>
            </label>
            {uploadFile && (
              <Typography variant="body2" color="text.secondary">
                File terpilih: {uploadFile.name}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="Kategori"
            select
            defaultValue="Other"
            sx={{ mb: 2 }}
          >
            <MenuItem value="Lab Results">Hasil Lab</MenuItem>
            <MenuItem value="Imaging">Imaging</MenuItem>
            <MenuItem value="Prescription">Resep</MenuItem>
            <MenuItem value="Other">Lainnya</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Deskripsi (opsional)"
            multiline
            rows={3}
            placeholder="Tambahkan deskripsi dokumen..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleUploadDocument}
            disabled={!uploadFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #10b981, #059669)',
        }}
        onClick={() => setUploadDialog(true)}
      >
        <Add />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalRecords;