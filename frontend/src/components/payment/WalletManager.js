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
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  Tooltip,
  Avatar,
  Badge,
  LinearProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Receipt,
  History,
  Refresh,
  Download,
  Print,
  Share,
  ExpandMore,
  Visibility,
  VisibilityOff,
  MonetizationOn,
  CreditCard,
  AccountBalance,
  Security,
  Notifications,
  Settings,
  Info,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  FilterList,
  Search,
  MoreVert,
  Send,
  GetApp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSpinner } from '../common/LoadingSpinner';
import PaymentIntegration from './PaymentIntegration';

const WalletManager = ({ userType = 'nakes' }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [topUpDialog, setTopUpDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [addBankDialog, setAddBankDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [walletSettings, setWalletSettings] = useState({
    notifications: true,
    autoTopUp: false,
    autoTopUpAmount: 100000,
    autoTopUpThreshold: 50000
  });

  // Bank account form
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    accountType: 'checking'
  });

  // Mock data
  const mockTransactions = [
    {
      id: 'TXN001',
      type: 'top_up',
      amount: 500000,
      description: 'Top Up via Transfer Bank',
      date: new Date('2024-01-15T10:30:00'),
      status: 'completed',
      reference: 'BCA Transfer',
      fee: 4000
    },
    {
      id: 'TXN002',
      type: 'payment',
      amount: -75000,
      description: 'Pembayaran Konsultasi - Dr. Sarah',
      date: new Date('2024-01-14T14:20:00'),
      status: 'completed',
      reference: 'ORDER-001',
      fee: 0
    },
    {
      id: 'TXN003',
      type: 'withdrawal',
      amount: -200000,
      description: 'Penarikan ke Rekening BCA',
      date: new Date('2024-01-13T09:15:00'),
      status: 'completed',
      reference: 'WD-001',
      fee: 2500
    },
    {
      id: 'TXN004',
      type: 'refund',
      amount: 50000,
      description: 'Refund Pembatalan Janji',
      date: new Date('2024-01-12T16:45:00'),
      status: 'completed',
      reference: 'REF-001',
      fee: 0
    },
    {
      id: 'TXN005',
      type: 'transfer_in',
      amount: 100000,
      description: 'Transfer dari Dr. Ahmad',
      date: new Date('2024-01-11T11:30:00'),
      status: 'completed',
      reference: 'TRF-001',
      fee: 0
    }
  ];

  const mockBankAccounts = [
    {
      id: 'BA001',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '1234567890',
      accountHolderName: 'John Doe',
      accountType: 'checking',
      isDefault: true,
      isVerified: true
    },
    {
      id: 'BA002',
      bankName: 'Bank Mandiri',
      accountNumber: '0987654321',
      accountHolderName: 'John Doe',
      accountType: 'savings',
      isDefault: false,
      isVerified: true
    }
  ];

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType, filterDate]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWalletBalance(750000);
      setTransactions(mockTransactions);
      setBankAccounts(mockBankAccounts);
      setSelectedBankAccount(mockBankAccounts.find(acc => acc.isDefault)?.id || '');
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Filter by date
    if (filterDate !== 'all') {
      const now = new Date();
      const filterDate7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const filterDate30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      switch (filterDate) {
        case '7days':
          filtered = filtered.filter(transaction => transaction.date >= filterDate7Days);
          break;
        case '30days':
          filtered = filtered.filter(transaction => transaction.date >= filterDate30Days);
          break;
        case 'today':
          filtered = filtered.filter(transaction => 
            transaction.date.toDateString() === now.toDateString()
          );
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date - a.date);

    setFilteredTransactions(filtered);
  };

  const handleTopUp = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(topUpAmount);
      setWalletBalance(prev => prev + amount);
      
      // Add transaction record
      const newTransaction = {
        id: `TXN${Date.now()}`,
        type: 'top_up',
        amount: amount,
        description: `Top Up via ${bankAccounts.find(acc => acc.id === selectedBankAccount)?.bankName}`,
        date: new Date(),
        status: 'completed',
        reference: `TU-${Date.now()}`,
        fee: 4000
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setTopUpDialog(false);
      setTopUpAmount('');
    } catch (error) {
      console.error('Error processing top up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(withdrawAmount);
      const fee = 2500;
      
      if (walletBalance < amount + fee) {
        throw new Error('Saldo tidak mencukupi');
      }
      
      setWalletBalance(prev => prev - amount - fee);
      
      // Add transaction record
      const newTransaction = {
        id: `TXN${Date.now()}`,
        type: 'withdrawal',
        amount: -amount,
        description: `Penarikan ke ${bankAccounts.find(acc => acc.id === selectedBankAccount)?.bankName}`,
        date: new Date(),
        status: 'completed',
        reference: `WD-${Date.now()}`,
        fee: fee
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setWithdrawDialog(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(transferAmount);
      
      if (walletBalance < amount) {
        throw new Error('Saldo tidak mencukupi');
      }
      
      setWalletBalance(prev => prev - amount);
      
      // Add transaction record
      const newTransaction = {
        id: `TXN${Date.now()}`,
        type: 'transfer_out',
        amount: -amount,
        description: `Transfer ke ${transferTarget}`,
        date: new Date(),
        status: 'completed',
        reference: `TRF-${Date.now()}`,
        fee: 0
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setTransferDialog(false);
      setTransferAmount('');
      setTransferTarget('');
    } catch (error) {
      console.error('Error processing transfer:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBankAccount = {
        id: `BA${Date.now()}`,
        ...bankForm,
        isDefault: bankAccounts.length === 0,
        isVerified: false
      };
      
      setBankAccounts(prev => [...prev, newBankAccount]);
      setAddBankDialog(false);
      setBankForm({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        accountType: 'checking'
      });
    } catch (error) {
      console.error('Error adding bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'top_up':
        return <Add sx={{ color: 'success.main' }} />;
      case 'payment':
        return <MonetizationOn sx={{ color: 'error.main' }} />;
      case 'withdrawal':
        return <Remove sx={{ color: 'error.main' }} />;
      case 'refund':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'transfer_in':
        return <GetApp sx={{ color: 'success.main' }} />;
      case 'transfer_out':
        return <Send sx={{ color: 'error.main' }} />;
      default:
        return <SwapHoriz />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'top_up':
      case 'refund':
      case 'transfer_in':
        return 'success.main';
      case 'payment':
      case 'withdrawal':
      case 'transfer_out':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  if (loading && transactions.length === 0) {
    return <LoadingSpinner message="Memuat data wallet..." />;
  }

  return (
    <Box>
      {/* Wallet Balance Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Saldo Wallet</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                sx={{ color: 'white' }}
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <VisibilityOff /> : <Visibility />}
              </IconButton>
              <IconButton size="small" sx={{ color: 'white' }} onClick={fetchWalletData}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            {showBalance ? formatCurrency(walletBalance) : '••••••••'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Button 
                fullWidth 
                variant="contained" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                startIcon={<Add />}
                onClick={() => setTopUpDialog(true)}
              >
                Top Up
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button 
                fullWidth 
                variant="contained" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                startIcon={<Remove />}
                onClick={() => setWithdrawDialog(true)}
              >
                Tarik
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button 
                fullWidth 
                variant="contained" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                startIcon={<Send />}
                onClick={() => setTransferDialog(true)}
              >
                Transfer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Riwayat Transaksi" />
          <Tab label="Rekening Bank" />
          <Tab label="Pengaturan" />
        </Tabs>
      </Paper>

      {/* Transaction History Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            {/* Filters */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Jenis Transaksi</InputLabel>
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      label="Jenis Transaksi"
                    >
                      <MenuItem value="all">Semua</MenuItem>
                      <MenuItem value="top_up">Top Up</MenuItem>
                      <MenuItem value="payment">Pembayaran</MenuItem>
                      <MenuItem value="withdrawal">Penarikan</MenuItem>
                      <MenuItem value="refund">Refund</MenuItem>
                      <MenuItem value="transfer_in">Transfer Masuk</MenuItem>
                      <MenuItem value="transfer_out">Transfer Keluar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Periode</InputLabel>
                    <Select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      label="Periode"
                    >
                      <MenuItem value="all">Semua</MenuItem>
                      <MenuItem value="today">Hari Ini</MenuItem>
                      <MenuItem value="7days">7 Hari Terakhir</MenuItem>
                      <MenuItem value="30days">30 Hari Terakhir</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                  >
                    Export
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Transaction Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Deskripsi</TableCell>
                    <TableCell>Referensi</TableCell>
                    <TableCell align="right">Jumlah</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTransactionIcon(transaction.type)}
                            <Box>
                              <Typography variant="body2">
                                {format(transaction.date, 'dd MMM yyyy', { locale: id })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(transaction.date, 'HH:mm', { locale: id })}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.description}
                          </Typography>
                          {transaction.fee > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Biaya admin: {formatCurrency(transaction.fee)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {transaction.reference}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: getTransactionColor(transaction.type)
                            }}
                          >
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={transaction.status === 'completed' ? 'Selesai' : 'Pending'}
                            color={transaction.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small">
                            <Receipt />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredTransactions.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Baris per halaman:"
            />
          </CardContent>
        </Card>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Rekening Bank</Typography>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => setAddBankDialog(true)}
              >
                Tambah Rekening
              </Button>
            </Box>

            <Grid container spacing={2}>
              {bankAccounts.map((account) => (
                <Grid item xs={12} md={6} key={account.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <AccountBalance />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{account.bankName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {account.accountType === 'checking' ? 'Giro' : 'Tabungan'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {account.isDefault && (
                            <Chip label="Default" size="small" color="primary" />
                          )}
                          {account.isVerified ? (
                            <Chip label="Terverifikasi" size="small" color="success" />
                          ) : (
                            <Chip label="Belum Verifikasi" size="small" color="warning" />
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        {account.accountNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {account.accountHolderName}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Pengaturan Wallet</Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="Notifikasi Transaksi"
                  secondary="Terima notifikasi untuk setiap transaksi"
                />
                <ListItemSecondaryAction>
                  <Switch 
                    checked={walletSettings.notifications}
                    onChange={(e) => setWalletSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <MonetizationOn />
                </ListItemIcon>
                <ListItemText 
                  primary="Auto Top Up"
                  secondary="Otomatis top up ketika saldo di bawah batas minimum"
                />
                <ListItemSecondaryAction>
                  <Switch 
                    checked={walletSettings.autoTopUp}
                    onChange={(e) => setWalletSettings(prev => ({ ...prev, autoTopUp: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              {walletSettings.autoTopUp && (
                <>
                  <ListItem sx={{ pl: 4 }}>
                    <ListItemText 
                      primary="Batas Minimum"
                      secondary={
                        <TextField
                          size="small"
                          type="number"
                          value={walletSettings.autoTopUpThreshold}
                          onChange={(e) => setWalletSettings(prev => ({ ...prev, autoTopUpThreshold: parseInt(e.target.value) }))}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                          }}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem sx={{ pl: 4 }}>
                    <ListItemText 
                      primary="Jumlah Top Up"
                      secondary={
                        <TextField
                          size="small"
                          type="number"
                          value={walletSettings.autoTopUpAmount}
                          onChange={(e) => setWalletSettings(prev => ({ ...prev, autoTopUpAmount: parseInt(e.target.value) }))}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                          }}
                        />
                      }
                    />
                  </ListItem>
                </>
              )}
              
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText 
                  primary="Keamanan"
                  secondary="Pengaturan keamanan wallet"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Kelola
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* Top Up Dialog */}
      <Dialog open={topUpDialog} onClose={() => setTopUpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Jumlah Top Up"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rekening Sumber</InputLabel>
                <Select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(e.target.value)}
                  label="Rekening Sumber"
                >
                  {bankAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {topUpAmount && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Jumlah: {formatCurrency(parseFloat(topUpAmount) || 0)}<br/>
                    Biaya Admin: {formatCurrency(4000)}<br/>
                    <strong>Total: {formatCurrency((parseFloat(topUpAmount) || 0) + 4000)}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialog(false)}>Batal</Button>
          <Button 
            onClick={handleTopUp} 
            variant="contained"
            disabled={!topUpAmount || !selectedBankAccount || loading}
          >
            {loading ? 'Memproses...' : 'Top Up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tarik Dana</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Saldo tersedia: {formatCurrency(walletBalance)}
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Jumlah Penarikan"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rekening Tujuan</InputLabel>
                <Select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(e.target.value)}
                  label="Rekening Tujuan"
                >
                  {bankAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {withdrawAmount && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    Jumlah Penarikan: {formatCurrency(parseFloat(withdrawAmount) || 0)}<br/>
                    Biaya Admin: {formatCurrency(2500)}<br/>
                    <strong>Total Dipotong: {formatCurrency((parseFloat(withdrawAmount) || 0) + 2500)}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)}>Batal</Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained"
            disabled={!withdrawAmount || !selectedBankAccount || loading}
          >
            {loading ? 'Memproses...' : 'Tarik Dana'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Dana</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Saldo tersedia: {formatCurrency(walletBalance)}
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email/ID Penerima"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                placeholder="email@example.com atau ID123456"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Jumlah Transfer"
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                }}
              />
            </Grid>
            
            {transferAmount && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Jumlah Transfer: {formatCurrency(parseFloat(transferAmount) || 0)}<br/>
                    Biaya Admin: Gratis<br/>
                    <strong>Total: {formatCurrency(parseFloat(transferAmount) || 0)}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog(false)}>Batal</Button>
          <Button 
            onClick={handleTransfer} 
            variant="contained"
            disabled={!transferAmount || !transferTarget || loading}
          >
            {loading ? 'Memproses...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={addBankDialog} onClose={() => setAddBankDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Rekening Bank</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bank</InputLabel>
                <Select
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                  label="Bank"
                >
                  <MenuItem value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</MenuItem>
                  <MenuItem value="Bank Mandiri">Bank Mandiri</MenuItem>
                  <MenuItem value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</MenuItem>
                  <MenuItem value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</MenuItem>
                  <MenuItem value="Bank CIMB Niaga">Bank CIMB Niaga</MenuItem>
                  <MenuItem value="Bank Danamon">Bank Danamon</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nomor Rekening"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Pemegang Rekening"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Jenis Rekening</InputLabel>
                <Select
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountType: e.target.value }))}
                  label="Jenis Rekening"
                >
                  <MenuItem value="checking">Giro</MenuItem>
                  <MenuItem value="savings">Tabungan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBankDialog(false)}>Batal</Button>
          <Button 
            onClick={handleAddBankAccount} 
            variant="contained"
            disabled={!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolderName || loading}
          >
            {loading ? 'Menyimpan...' : 'Tambah Rekening'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WalletManager;