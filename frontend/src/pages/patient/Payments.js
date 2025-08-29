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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  Receipt,
  History,
  Add,
  Download,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Pending,
  Error,
  Warning,
  AttachMoney,
  QrCode,
  Smartphone,
  Security,
  ExpandMore,
  FilterList,
  Search,
  DateRange,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  LocalAtm,
  MonetizationOn,
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const Payments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [paymentData, setPaymentData] = useState({
    transactions: [],
    paymentMethods: [],
    bills: [],
    statistics: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [addMethodDialog, setAddMethodDialog] = useState(false);
  const [payBillDialog, setPayBillDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        transactions: [
          {
            id: 'TXN001',
            date: new Date('2024-01-15'),
            type: 'payment',
            description: 'Konsultasi dengan Dr. Sarah Wijaya',
            amount: 150000,
            status: 'completed',
            method: 'Credit Card',
            methodDetails: '**** 1234',
            category: 'consultation',
            doctorName: 'Dr. Sarah Wijaya',
            appointmentId: 'APT001',
          },
          {
            id: 'TXN002',
            date: new Date('2024-01-12'),
            type: 'payment',
            description: 'Pemeriksaan Lab Darah Lengkap',
            amount: 250000,
            status: 'completed',
            method: 'E-Wallet',
            methodDetails: 'GoPay',
            category: 'lab_test',
            doctorName: 'Lab Kimia Farma',
            appointmentId: 'LAB001',
          },
          {
            id: 'TXN003',
            date: new Date('2024-01-10'),
            type: 'refund',
            description: 'Refund - Pembatalan Janji',
            amount: 100000,
            status: 'completed',
            method: 'Credit Card',
            methodDetails: '**** 1234',
            category: 'refund',
            appointmentId: 'APT002',
          },
          {
            id: 'TXN004',
            date: new Date('2024-01-08'),
            type: 'payment',
            description: 'Obat Resep - Paracetamol & OBH',
            amount: 45000,
            status: 'pending',
            method: 'Bank Transfer',
            methodDetails: 'BCA',
            category: 'medication',
            pharmacyName: 'Apotek Kimia Farma',
          },
          {
            id: 'TXN005',
            date: new Date('2024-01-05'),
            type: 'payment',
            description: 'Konsultasi Spesialis Jantung',
            amount: 300000,
            status: 'failed',
            method: 'Credit Card',
            methodDetails: '**** 5678',
            category: 'consultation',
            doctorName: 'Dr. Ahmad Hidayat',
            appointmentId: 'APT003',
          },
        ],
        paymentMethods: [
          {
            id: 1,
            type: 'credit_card',
            brand: 'Visa',
            last4: '1234',
            expiryMonth: 12,
            expiryYear: 2026,
            holderName: 'John Doe',
            isDefault: true,
            isActive: true,
          },
          {
            id: 2,
            type: 'credit_card',
            brand: 'Mastercard',
            last4: '5678',
            expiryMonth: 8,
            expiryYear: 2025,
            holderName: 'John Doe',
            isDefault: false,
            isActive: true,
          },
          {
            id: 3,
            type: 'e_wallet',
            provider: 'GoPay',
            phoneNumber: '+62812****5678',
            isDefault: false,
            isActive: true,
          },
          {
            id: 4,
            type: 'bank_account',
            bankName: 'BCA',
            accountNumber: '****1234',
            accountHolder: 'John Doe',
            isDefault: false,
            isActive: true,
          },
        ],
        bills: [
          {
            id: 'BILL001',
            date: new Date('2024-01-20'),
            dueDate: new Date('2024-01-25'),
            description: 'Konsultasi Follow-up',
            amount: 120000,
            status: 'pending',
            doctorName: 'Dr. Sarah Wijaya',
            appointmentId: 'APT004',
            category: 'consultation',
          },
          {
            id: 'BILL002',
            date: new Date('2024-01-18'),
            dueDate: new Date('2024-01-23'),
            description: 'Pemeriksaan X-Ray',
            amount: 180000,
            status: 'overdue',
            facilityName: 'RS Siloam',
            category: 'imaging',
          },
        ],
        statistics: {
          totalSpent: 1045000,
          monthlySpent: 545000,
          pendingBills: 300000,
          savedAmount: 150000,
          monthlyData: [
            { month: 'Okt', amount: 450000 },
            { month: 'Nov', amount: 320000 },
            { month: 'Des', amount: 275000 },
            { month: 'Jan', amount: 545000 },
          ],
          categoryData: [
            { name: 'Konsultasi', value: 450000, color: '#8884d8' },
            { name: 'Lab Test', value: 250000, color: '#82ca9d' },
            { name: 'Obat', value: 145000, color: '#ffc658' },
            { name: 'Imaging', value: 200000, color: '#ff7300' },
          ],
        },
      };
      
      setPaymentData(mockData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data pembayaran',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'overdue': return 'error';
      case 'refund': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'failed': return <Error />;
      case 'overdue': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'credit_card': return <CreditCard />;
      case 'e_wallet': return <Smartphone />;
      case 'bank_account': return <AccountBalance />;
      default: return <Payment />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddPaymentMethod = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMethod = {
        id: Date.now(),
        ...newPaymentMethod,
        last4: newPaymentMethod.cardNumber.slice(-4),
        brand: 'Visa', // Simulate brand detection
        isActive: true,
      };
      
      setPaymentData(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, newMethod],
      }));
      
      setAddMethodDialog(false);
      setNewPaymentMethod({
        type: 'credit_card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        holderName: '',
        isDefault: false,
      });
      
      setSnackbar({
        open: true,
        message: 'Metode pembayaran berhasil ditambahkan',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal menambahkan metode pembayaran',
        severity: 'error',
      });
    }
  };

  const handlePayBill = async (billId, methodId) => {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update bill status
      setPaymentData(prev => ({
        ...prev,
        bills: prev.bills.map(bill =>
          bill.id === billId ? { ...bill, status: 'completed' } : bill
        ),
      }));
      
      setPayBillDialog(false);
      setSelectedBill(null);
      
      setSnackbar({
        open: true,
        message: 'Pembayaran berhasil diproses',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal memproses pembayaran',
        severity: 'error',
      });
    }
  };

  const StatisticsOverview = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(paymentData.statistics.totalSpent)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Pengeluaran
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(paymentData.statistics.monthlySpent)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Bulan Ini
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(paymentData.statistics.pendingBills)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Tagihan Pending
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(paymentData.statistics.savedAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Hemat Bulan Ini
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  const ChartsSection = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Tren Pengeluaran Bulanan</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentData.statistics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Pengeluaran per Kategori</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData.statistics.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentData.statistics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const TransactionsTab = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Semua Status</MenuItem>
                <MenuItem value="completed">Selesai</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Gagal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Periode</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                label="Periode"
              >
                <MenuItem value="all">Semua Periode</MenuItem>
                <MenuItem value="today">Hari Ini</MenuItem>
                <MenuItem value="week">Minggu Ini</MenuItem>
                <MenuItem value="month">Bulan Ini</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              size="small"
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Deskripsi</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Metode</TableCell>
              <TableCell align="right">Jumlah</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentData.transactions.map((transaction, index) => (
              <motion.tr
                key={transaction.id}
                component={TableRow}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <TableCell>
                  <Typography variant="body2">
                    {format(transaction.date, 'dd MMM yyyy', { locale: id })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(transaction.date, 'HH:mm')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {transaction.description}
                  </Typography>
                  {transaction.doctorName && (
                    <Typography variant="caption" color="text.secondary">
                      {transaction.doctorName}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={transaction.category.replace('_', ' ')}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPaymentMethodIcon(transaction.method.toLowerCase().replace(' ', '_'))}
                    <Box>
                      <Typography variant="body2">{transaction.method}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.methodDetails}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: transaction.type === 'refund' ? 'success.main' : 'text.primary',
                    }}
                  >
                    {transaction.type === 'refund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={transaction.status}
                    color={getStatusColor(transaction.status)}
                    icon={getStatusIcon(transaction.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setDetailDialog(true);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton size="small">
                    <Download />
                  </IconButton>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const PaymentMethodsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Metode Pembayaran</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddMethodDialog(true)}
        >
          Tambah Metode
        </Button>
      </Box>

      <Grid container spacing={3}>
        {paymentData.paymentMethods.map((method, index) => (
          <Grid item xs={12} sm={6} md={4} key={method.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  position: 'relative',
                  background: method.isDefault
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  color: method.isDefault ? 'white' : 'text.primary',
                  border: method.isDefault ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  {method.isDefault && (
                    <Chip
                      label="Default"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                      }}
                    />
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getPaymentMethodIcon(method.type)}
                    <Typography variant="h6">
                      {method.type === 'credit_card' ? method.brand :
                       method.type === 'e_wallet' ? method.provider :
                       method.bankName}
                    </Typography>
                  </Box>
                  
                  {method.type === 'credit_card' && (
                    <Box>
                      <Typography variant="h5" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        **** **** **** {method.last4}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {method.holderName}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </Typography>
                    </Box>
                  )}
                  
                  {method.type === 'e_wallet' && (
                    <Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {method.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                  
                  {method.type === 'bank_account' && (
                    <Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {method.accountNumber}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {method.accountHolder}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button size="small" startIcon={<Edit />}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={<Delete />} color="error">
                      Hapus
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

  const BillsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Tagihan Pending</Typography>
      
      {paymentData.bills.map((bill, index) => (
        <motion.div
          key={bill.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {bill.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bill.doctorName || bill.facilityName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tanggal: {format(bill.date, 'dd MMMM yyyy', { locale: id })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Jatuh Tempo: {format(bill.dueDate, 'dd MMMM yyyy', { locale: id })}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(bill.amount)}
                  </Typography>
                  <Chip
                    label={bill.status === 'overdue' ? 'Terlambat' : 'Pending'}
                    color={getStatusColor(bill.status)}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      setSelectedBill(bill);
                      setPayBillDialog(true);
                    }}
                    sx={{
                      background: bill.status === 'overdue'
                        ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                    }}
                  >
                    Bayar Sekarang
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data pembayaran..." />;
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Pembayaran & Tagihan
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola pembayaran, metode pembayaran, dan tagihan Anda
          </Typography>
        </Paper>
      </motion.div>

      {/* Statistics Overview */}
      <StatisticsOverview />

      {/* Charts */}
      <ChartsSection />

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
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
          <Tab icon={<History />} label="Riwayat Transaksi" />
          <Tab icon={<CreditCard />} label="Metode Pembayaran" />
          <Tab icon={<Receipt />} label="Tagihan" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <TransactionsTab />}
        {activeTab === 1 && <PaymentMethodsTab />}
        {activeTab === 2 && <BillsTab />}
      </AnimatePresence>

      {/* Add Payment Method Dialog */}
      <Dialog open={addMethodDialog} onClose={() => setAddMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Jenis Metode</InputLabel>
            <Select
              value={newPaymentMethod.type}
              onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value })}
              label="Jenis Metode"
            >
              <MenuItem value="credit_card">Kartu Kredit/Debit</MenuItem>
              <MenuItem value="e_wallet">E-Wallet</MenuItem>
              <MenuItem value="bank_account">Rekening Bank</MenuItem>
            </Select>
          </FormControl>
          
          {newPaymentMethod.type === 'credit_card' && (
            <>
              <TextField
                fullWidth
                label="Nomor Kartu"
                value={newPaymentMethod.cardNumber}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cardNumber: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="1234 5678 9012 3456"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Tanggal Kadaluarsa"
                    value={newPaymentMethod.expiryDate}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, expiryDate: e.target.value })}
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={newPaymentMethod.cvv}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cvv: e.target.value })}
                    placeholder="123"
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Nama Pemegang Kartu"
                value={newPaymentMethod.holderName}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, holderName: e.target.value })}
                sx={{ mt: 2 }}
              />
            </>
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={newPaymentMethod.isDefault}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked })}
              />
            }
            label="Jadikan sebagai metode default"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMethodDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddPaymentMethod}>
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={payBillDialog} onClose={() => setPayBillDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bayar Tagihan</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Anda akan membayar tagihan sebesar {formatCurrency(selectedBill.amount)}
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Pilih Metode Pembayaran
              </Typography>
              
              <List>
                {paymentData.paymentMethods.map((method) => (
                  <ListItem
                    key={method.id}
                    button
                    onClick={() => handlePayBill(selectedBill.id, method.id)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getPaymentMethodIcon(method.type)}
                      <Box>
                        <Typography variant="body1">
                          {method.type === 'credit_card' ? `${method.brand} ****${method.last4}` :
                           method.type === 'e_wallet' ? method.provider :
                           `${method.bankName} ${method.accountNumber}`}
                        </Typography>
                        {method.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayBillDialog(false)}>Batal</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detail Transaksi</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">ID Transaksi</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedTransaction.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedTransaction.status}
                    color={getStatusColor(selectedTransaction.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Deskripsi</Typography>
                  <Typography variant="body1">{selectedTransaction.description}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                  <Typography variant="body1">
                    {format(selectedTransaction.date, 'dd MMMM yyyy HH:mm', { locale: id })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(selectedTransaction.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Metode Pembayaran</Typography>
                  <Typography variant="body1">
                    {selectedTransaction.method} ({selectedTransaction.methodDetails})
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Tutup</Button>
          <Button variant="contained" startIcon={<Download />}>
            Unduh Receipt
          </Button>
        </DialogActions>
      </Dialog>

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

export default Payments;