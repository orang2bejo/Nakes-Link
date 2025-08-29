import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  History,
  Receipt,
  CreditCard,
  Bank,
  QrCode,
  Download,
  Visibility,
  VisibilityOff,
  Refresh,
  FilterList,
  Search,
  AttachMoney,
  MonetizationOn,
  Payment,
  AccountBalance
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const NakesWallet = () => {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [topUpDialog, setTopUpDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  // Mock data
  const mockWalletData = {
    balance: 2500000,
    pendingBalance: 150000,
    totalEarnings: 15750000,
    monthlyEarnings: 3250000,
    withdrawnAmount: 13250000,
    lastWithdrawal: '2024-01-15',
    bankAccounts: [
      {
        id: 1,
        bankName: 'Bank BCA',
        accountNumber: '1234567890',
        accountName: 'Dr. Sarah Wijaya',
        isDefault: true
      },
      {
        id: 2,
        bankName: 'Bank Mandiri',
        accountNumber: '0987654321',
        accountName: 'Dr. Sarah Wijaya',
        isDefault: false
      }
    ]
  };

  const mockTransactions = [
    {
      id: 1,
      type: 'earning',
      amount: 150000,
      description: 'Konsultasi Online - Ahmad Rizki',
      date: '2024-01-20T10:30:00',
      status: 'completed',
      appointmentId: 'APT001',
      patientName: 'Ahmad Rizki'
    },
    {
      id: 2,
      type: 'withdrawal',
      amount: 500000,
      description: 'Penarikan ke Bank BCA',
      date: '2024-01-19T14:20:00',
      status: 'completed',
      bankAccount: '1234567890',
      transactionId: 'WD001'
    },
    {
      id: 3,
      type: 'earning',
      amount: 200000,
      description: 'Konsultasi Offline - Siti Nurhaliza',
      date: '2024-01-18T09:15:00',
      status: 'completed',
      appointmentId: 'APT002',
      patientName: 'Siti Nurhaliza'
    },
    {
      id: 4,
      type: 'topup',
      amount: 100000,
      description: 'Top Up via Transfer Bank',
      date: '2024-01-17T16:45:00',
      status: 'completed',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 5,
      type: 'earning',
      amount: 175000,
      description: 'Konsultasi Online - Budi Santoso',
      date: '2024-01-16T11:00:00',
      status: 'pending',
      appointmentId: 'APT003',
      patientName: 'Budi Santoso'
    }
  ];

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWalletData(mockWalletData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleWithdraw = async () => {
    try {
      setProcessing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update wallet balance
      setWalletData(prev => ({
        ...prev,
        balance: prev.balance - parseInt(withdrawAmount),
        withdrawnAmount: prev.withdrawnAmount + parseInt(withdrawAmount)
      }));
      
      // Add transaction
      const newTransaction = {
        id: Date.now(),
        type: 'withdrawal',
        amount: parseInt(withdrawAmount),
        description: `Penarikan ke ${bankAccount}`,
        date: new Date().toISOString(),
        status: 'processing',
        bankAccount: bankAccount
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setWithdrawDialog(false);
      setWithdrawAmount('');
      setBankAccount('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleTopUp = async () => {
    try {
      setProcessing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update wallet balance
      setWalletData(prev => ({
        ...prev,
        balance: prev.balance + parseInt(topUpAmount)
      }));
      
      // Add transaction
      const newTransaction = {
        id: Date.now(),
        type: 'topup',
        amount: parseInt(topUpAmount),
        description: `Top Up via ${paymentMethod}`,
        date: new Date().toISOString(),
        status: 'completed',
        paymentMethod: paymentMethod
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setTopUpDialog(false);
      setTopUpAmount('');
      setPaymentMethod('');
    } catch (error) {
      console.error('Error processing top up:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earning':
        return <TrendingUp color="success" />;
      case 'withdrawal':
        return <TrendingDown color="error" />;
      case 'topup':
        return <Add color="primary" />;
      default:
        return <Receipt />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earning':
        return 'success';
      case 'withdrawal':
        return 'error';
      case 'topup':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterPeriod === 'all') return matchesSearch;
    
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    switch (filterPeriod) {
      case 'today':
        return matchesSearch && transactionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && transactionDate >= weekAgo;
      case 'month':
        return matchesSearch && transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return <LoadingSpinner message="Memuat data wallet..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <AccountBalanceWallet sx={{ mr: 2, verticalAlign: 'middle' }} />
          Wallet Saya
        </Typography>
        
        {/* Wallet Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Saldo Tersedia
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {showBalance ? formatCurrency(walletData.balance) : '••••••••'}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => setShowBalance(!showBalance)}
                        sx={{ color: 'white' }}
                      >
                        {showBalance ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Box>
                  </Box>
                  <AccountBalanceWallet sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Saldo Pending
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(walletData.pendingBalance)}
                    </Typography>
                  </Box>
                  <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Pendapatan Bulan Ini
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(walletData.monthlyEarnings)}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Total Pendapatan
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(walletData.totalEarnings)}
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Remove />}
            onClick={() => setWithdrawDialog(true)}
            disabled={walletData.balance < 50000}
            sx={{ minWidth: 150 }}
          >
            Tarik Dana
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setTopUpDialog(true)}
            sx={{ minWidth: 150 }}
          >
            Top Up
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrCode />}
            sx={{ minWidth: 150 }}
          >
            QR Payment
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ minWidth: 150 }}
          >
            Unduh Laporan
          </Button>
        </Box>

        {/* Tabs */}
        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Riwayat Transaksi" />
            <Tab label="Rekening Bank" />
            <Tab label="Statistik" />
          </Tabs>
          
          {/* Transaction History Tab */}
          {tabValue === 0 && (
            <CardContent>
              {/* Filters */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 250 }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Periode</InputLabel>
                  <Select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    label="Periode"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="today">Hari Ini</MenuItem>
                    <MenuItem value="week">7 Hari Terakhir</MenuItem>
                    <MenuItem value="month">Bulan Ini</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchTransactions}
                >
                  Refresh
                </Button>
              </Box>

              {/* Transactions Table */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Deskripsi</TableCell>
                      <TableCell>Tipe</TableCell>
                      <TableCell align="right">Jumlah</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>
                          {format(new Date(transaction.date), 'dd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTransactionIcon(transaction.type)}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {transaction.description}
                              </Typography>
                              {transaction.patientName && (
                                <Typography variant="caption" color="text.secondary">
                                  Pasien: {transaction.patientName}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type === 'earning' ? 'Pendapatan' : 
                                   transaction.type === 'withdrawal' ? 'Penarikan' : 'Top Up'}
                            color={getTransactionColor(transaction.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: transaction.type === 'earning' || transaction.type === 'topup' ? 
                                     'success.main' : 'error.main'
                            }}
                          >
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status === 'completed' ? 'Selesai' :
                                   transaction.status === 'pending' ? 'Pending' :
                                   transaction.status === 'processing' ? 'Diproses' : 'Gagal'}
                            color={getStatusColor(transaction.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <Receipt />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          )}
          
          {/* Bank Accounts Tab */}
          {tabValue === 1 && (
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Rekening Bank Terdaftar</Typography>
                <Button variant="contained" startIcon={<Add />}>
                  Tambah Rekening
                </Button>
              </Box>
              
              <List>
                {walletData.bankAccounts.map((account) => (
                  <ListItem key={account.id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        <AccountBalance />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{account.bankName}</Typography>
                          {account.isDefault && (
                            <Chip label="Default" color="primary" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {account.accountNumber} - {account.accountName}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small">Edit</Button>
                      <Button size="small" color="error">Hapus</Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          )}
          
          {/* Statistics Tab */}
          {tabValue === 2 && (
            <CardContent>
              <Typography variant="h6" gutterBottom>Statistik Pendapatan</Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Fitur statistik detail akan segera tersedia. Saat ini Anda dapat melihat ringkasan di dashboard utama.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Ringkasan Keuangan</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Total Pendapatan:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(walletData.totalEarnings)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Total Penarikan:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {formatCurrency(walletData.withdrawnAmount)}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: 'bold' }}>Saldo Saat Ini:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {formatCurrency(walletData.balance)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tarik Dana</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Minimum penarikan Rp 50.000. Dana akan ditransfer dalam 1-2 hari kerja.
            </Alert>
            
            <TextField
              fullWidth
              label="Jumlah Penarikan"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Rekening Tujuan</InputLabel>
              <Select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                label="Rekening Tujuan"
              >
                {walletData.bankAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.accountNumber}>
                    {account.bankName} - {account.accountNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="text.secondary">
              Saldo tersedia: {formatCurrency(walletData.balance)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)}>Batal</Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained"
            disabled={!withdrawAmount || !bankAccount || parseInt(withdrawAmount) < 50000 || 
                     parseInt(withdrawAmount) > walletData.balance || processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Tarik Dana'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialog} onClose={() => setTopUpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Top Up Saldo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Minimum top up Rp 10.000. Saldo akan masuk setelah pembayaran dikonfirmasi.
            </Alert>
            
            <TextField
              fullWidth
              label="Jumlah Top Up"
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Metode Pembayaran</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Metode Pembayaran"
              >
                <MenuItem value="Bank Transfer">Transfer Bank</MenuItem>
                <MenuItem value="E-Wallet">E-Wallet</MenuItem>
                <MenuItem value="Credit Card">Kartu Kredit</MenuItem>
                <MenuItem value="Debit Card">Kartu Debit</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialog(false)}>Batal</Button>
          <Button 
            onClick={handleTopUp} 
            variant="contained"
            disabled={!topUpAmount || !paymentMethod || parseInt(topUpAmount) < 10000 || processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Lanjutkan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NakesWallet;