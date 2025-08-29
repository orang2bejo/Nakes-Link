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
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Send,
  Download,
  History,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  CreditCard,
  AccountBalance,
  Smartphone,
  QrCode,
  Security,
  Visibility,
  VisibilityOff,
  SwapHoriz,
  LocalAtm,
  MonetizationOn,
  Savings,
  Receipt,
  CheckCircle,
  Pending,
  Error,
  Info,
  Star,
  Gift,
  Loyalty,
  CardGiftcard,
  Redeem,
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
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    rewards: [],
    statistics: {},
  });
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [topUpDialog, setTopUpDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('credit_card');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        balance: 2750000,
        transactions: [
          {
            id: 'WTX001',
            date: new Date('2024-01-15'),
            type: 'payment',
            description: 'Pembayaran Konsultasi Dr. Sarah',
            amount: -150000,
            status: 'completed',
            category: 'healthcare',
            icon: 'payment',
            balanceAfter: 2750000,
          },
          {
            id: 'WTX002',
            date: new Date('2024-01-14'),
            type: 'topup',
            description: 'Top Up via Credit Card',
            amount: 500000,
            status: 'completed',
            category: 'topup',
            icon: 'topup',
            balanceAfter: 2900000,
            method: 'Credit Card ****1234',
          },
          {
            id: 'WTX003',
            date: new Date('2024-01-12'),
            type: 'reward',
            description: 'Cashback Konsultasi',
            amount: 15000,
            status: 'completed',
            category: 'reward',
            icon: 'reward',
            balanceAfter: 2400000,
          },
          {
            id: 'WTX004',
            date: new Date('2024-01-10'),
            type: 'transfer_out',
            description: 'Transfer ke John Doe',
            amount: -100000,
            status: 'completed',
            category: 'transfer',
            icon: 'transfer',
            balanceAfter: 2385000,
            recipient: 'john.doe@email.com',
          },
          {
            id: 'WTX005',
            date: new Date('2024-01-08'),
            type: 'payment',
            description: 'Pembayaran Lab Test',
            amount: -250000,
            status: 'completed',
            category: 'healthcare',
            icon: 'payment',
            balanceAfter: 2485000,
          },
          {
            id: 'WTX006',
            date: new Date('2024-01-05'),
            type: 'withdraw',
            description: 'Penarikan ke Rekening BCA',
            amount: -200000,
            status: 'pending',
            category: 'withdraw',
            icon: 'withdraw',
            balanceAfter: 2735000,
            method: 'BCA ****5678',
          },
        ],
        rewards: [
          {
            id: 'RWD001',
            title: 'Cashback 10%',
            description: 'Dapatkan cashback 10% untuk konsultasi pertama',
            points: 100,
            type: 'cashback',
            status: 'available',
            expiryDate: new Date('2024-02-15'),
            minSpend: 100000,
          },
          {
            id: 'RWD002',
            title: 'Gratis Konsultasi',
            description: 'Konsultasi gratis dengan dokter umum',
            points: 500,
            type: 'free_service',
            status: 'available',
            expiryDate: new Date('2024-03-01'),
            minSpend: 0,
          },
          {
            id: 'RWD003',
            title: 'Diskon Lab Test 20%',
            description: 'Diskon 20% untuk semua jenis lab test',
            points: 200,
            type: 'discount',
            status: 'used',
            usedDate: new Date('2024-01-12'),
            minSpend: 150000,
          },
        ],
        statistics: {
          totalSpent: 1250000,
          totalTopUp: 1500000,
          totalRewards: 65000,
          monthlyData: [
            { month: 'Okt', income: 800000, expense: 450000, balance: 350000 },
            { month: 'Nov', income: 600000, expense: 320000, balance: 630000 },
            { month: 'Des', income: 400000, expense: 275000, balance: 755000 },
            { month: 'Jan', income: 500000, expense: 545000, balance: 710000 },
          ],
          rewardPoints: 800,
          loyaltyLevel: 'Gold',
        },
      };
      
      setWalletData(mockData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memuat data wallet',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment': return <MonetizationOn />;
      case 'topup': return <Add />;
      case 'transfer_out': return <Send />;
      case 'transfer_in': return <Download />;
      case 'withdraw': return <LocalAtm />;
      case 'reward': return <Gift />;
      default: return <SwapHoriz />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'payment': return 'error';
      case 'topup': return 'success';
      case 'transfer_out': return 'warning';
      case 'transfer_in': return 'success';
      case 'withdraw': return 'info';
      case 'reward': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      setSnackbar({
        open: true,
        message: 'Masukkan jumlah top up yang valid',
        severity: 'error',
      });
      return;
    }

    try {
      setActiveStep(1);
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(topUpAmount);
      const newTransaction = {
        id: `WTX${Date.now()}`,
        date: new Date(),
        type: 'topup',
        description: `Top Up via ${topUpMethod}`,
        amount: amount,
        status: 'completed',
        category: 'topup',
        icon: 'topup',
        balanceAfter: walletData.balance + amount,
        method: topUpMethod,
      };
      
      setWalletData(prev => ({
        ...prev,
        balance: prev.balance + amount,
        transactions: [newTransaction, ...prev.transactions],
      }));
      
      setActiveStep(2);
      setTimeout(() => {
        setTopUpDialog(false);
        setTopUpAmount('');
        setActiveStep(0);
        setSnackbar({
          open: true,
          message: `Top up ${formatCurrency(amount)} berhasil`,
          severity: 'success',
        });
      }, 1000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal melakukan top up',
        severity: 'error',
      });
      setActiveStep(0);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTarget) {
      setSnackbar({
        open: true,
        message: 'Lengkapi semua field transfer',
        severity: 'error',
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > walletData.balance) {
      setSnackbar({
        open: true,
        message: 'Saldo tidak mencukupi',
        severity: 'error',
      });
      return;
    }

    try {
      // Simulate transfer processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTransaction = {
        id: `WTX${Date.now()}`,
        date: new Date(),
        type: 'transfer_out',
        description: `Transfer ke ${transferTarget}`,
        amount: -amount,
        status: 'completed',
        category: 'transfer',
        icon: 'transfer',
        balanceAfter: walletData.balance - amount,
        recipient: transferTarget,
      };
      
      setWalletData(prev => ({
        ...prev,
        balance: prev.balance - amount,
        transactions: [newTransaction, ...prev.transactions],
      }));
      
      setTransferDialog(false);
      setTransferAmount('');
      setTransferTarget('');
      
      setSnackbar({
        open: true,
        message: `Transfer ${formatCurrency(amount)} berhasil`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal melakukan transfer',
        severity: 'error',
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      setSnackbar({
        open: true,
        message: 'Masukkan jumlah penarikan',
        severity: 'error',
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > walletData.balance) {
      setSnackbar({
        open: true,
        message: 'Saldo tidak mencukupi',
        severity: 'error',
      });
      return;
    }

    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTransaction = {
        id: `WTX${Date.now()}`,
        date: new Date(),
        type: 'withdraw',
        description: `Penarikan ke ${withdrawMethod}`,
        amount: -amount,
        status: 'pending',
        category: 'withdraw',
        icon: 'withdraw',
        balanceAfter: walletData.balance - amount,
        method: withdrawMethod,
      };
      
      setWalletData(prev => ({
        ...prev,
        balance: prev.balance - amount,
        transactions: [newTransaction, ...prev.transactions],
      }));
      
      setWithdrawDialog(false);
      setWithdrawAmount('');
      
      setSnackbar({
        open: true,
        message: `Penarikan ${formatCurrency(amount)} sedang diproses`,
        severity: 'info',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Gagal melakukan penarikan',
        severity: 'error',
      });
    }
  };

  const WalletOverview = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Main Balance Card */}
      <Grid item xs={12} md={8}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Saldo NakesLink Wallet
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {showBalance ? formatCurrency(walletData.balance) : '••••••••'}
                    </Typography>
                    <IconButton
                      onClick={() => setShowBalance(!showBalance)}
                      sx={{ color: 'white' }}
                    >
                      {showBalance ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Box>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setTopUpDialog(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Top Up
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Send />}
                  onClick={() => setTransferDialog(true)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Transfer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalAtm />}
                  onClick={() => setWithdrawDialog(true)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Tarik
                </Button>
              </Box>
            </CardContent>
            
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
              }}
            />
          </Card>
        </motion.div>
      </Grid>
      
      {/* Rewards & Loyalty */}
      <Grid item xs={12} md={4}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {walletData.statistics.loyaltyLevel} Member
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {walletData.statistics.rewardPoints} Poin Reward
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reward Tersedia
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {walletData.rewards.filter(r => r.status === 'available').length}
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<Redeem />}
                sx={{ mt: 2, bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
                onClick={() => setActiveTab(2)}
              >
                Lihat Reward
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  const StatisticsChart = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Aktivitas Wallet</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={walletData.statistics.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${value / 1000}K`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Area
              type="monotone"
              dataKey="income"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Pemasukan"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Pengeluaran"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const TransactionsTab = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Deskripsi</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Jumlah</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {walletData.transactions.map((transaction, index) => (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${getTransactionColor(transaction.type)}.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      {getTransactionIcon(transaction.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {transaction.description}
                      </Typography>
                      {transaction.method && (
                        <Typography variant="caption" color="text.secondary">
                          {transaction.method}
                        </Typography>
                      )}
                      {transaction.recipient && (
                        <Typography variant="caption" color="text.secondary">
                          ke {transaction.recipient}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={transaction.category}
                    variant="outlined"
                    color={getTransactionColor(transaction.type)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: transaction.amount > 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Saldo: {formatCurrency(transaction.balanceAfter)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={transaction.status}
                    color={getStatusColor(transaction.status)}
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
                    <Receipt />
                  </IconButton>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const RewardsTab = () => (
    <Box>
      <Grid container spacing={3}>
        {walletData.rewards.map((reward, index) => (
          <Grid item xs={12} sm={6} md={4} key={reward.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  background: reward.status === 'available'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  color: reward.status === 'available' ? 'white' : 'text.primary',
                  opacity: reward.status === 'used' ? 0.6 : 1,
                }}
              >
                <CardContent>
                  {reward.status === 'used' && (
                    <Chip
                      label="Terpakai"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.2)',
                        color: 'white',
                      }}
                    />
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: reward.status === 'available' ? 'rgba(255,255,255,0.2)' : 'primary.main',
                      }}
                    >
                      {reward.type === 'cashback' ? <MonetizationOn /> :
                       reward.type === 'free_service' ? <Gift /> :
                       <Loyalty />}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {reward.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    {reward.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {reward.points} Poin
                    </Typography>
                    {reward.minSpend > 0 && (
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Min. {formatCurrency(reward.minSpend)}
                      </Typography>
                    )}
                  </Box>
                  
                  {reward.status === 'available' && (
                    <>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Berlaku hingga: {format(reward.expiryDate, 'dd MMM yyyy', { locale: id })}
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          mt: 2,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        Gunakan
                      </Button>
                    </>
                  )}
                  
                  {reward.status === 'used' && reward.usedDate && (
                    <Typography variant="caption" color="text.secondary">
                      Digunakan: {format(reward.usedDate, 'dd MMM yyyy', { locale: id })}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data wallet..." />;
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
            NakesLink Wallet
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Kelola saldo, transaksi, dan reward Anda dengan mudah
          </Typography>
        </Paper>
      </motion.div>

      {/* Wallet Overview */}
      <WalletOverview />

      {/* Statistics Chart */}
      <StatisticsChart />

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
          <Tab icon={<TrendingUp />} label="Statistik" />
          <Tab icon={<CardGiftcard />} label="Reward & Loyalty" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && <TransactionsTab />}
        {activeTab === 1 && <StatisticsChart />}
        {activeTab === 2 && <RewardsTab />}
      </AnimatePresence>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialog} onClose={() => setTopUpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Masukkan Jumlah</StepLabel>
              <StepContent>
                <TextField
                  fullWidth
                  label="Jumlah Top Up"
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Metode Pembayaran</InputLabel>
                  <Select
                    value={topUpMethod}
                    onChange={(e) => setTopUpMethod(e.target.value)}
                    label="Metode Pembayaran"
                  >
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="e_wallet">E-Wallet</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleTopUp}>
                  Lanjutkan
                </Button>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Memproses Pembayaran</StepLabel>
              <StepContent>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <LoadingSpinner message="Memproses pembayaran..." />
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Selesai</StepLabel>
              <StepContent>
                <Alert severity="success">
                  Top up berhasil! Saldo Anda telah bertambah.
                </Alert>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialog(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Saldo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email/Phone Penerima"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            placeholder="john.doe@email.com atau +628123456789"
          />
          <TextField
            fullWidth
            label="Jumlah Transfer"
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            Saldo tersedia: {formatCurrency(walletData.balance)}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleTransfer}>
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tarik Saldo</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Metode Penarikan</InputLabel>
            <Select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              label="Metode Penarikan"
            >
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="e_wallet">E-Wallet</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Jumlah Penarikan"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          <Alert severity="warning">
            Penarikan akan diproses dalam 1-3 hari kerja. Biaya admin Rp 2.500
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleWithdraw}>
            Tarik Saldo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detail Transaksi</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${getTransactionColor(selectedTransaction.type)}.main` }}>
                      {getTransactionIcon(selectedTransaction.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedTransaction.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTransaction.id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                  <Typography variant="body1">
                    {format(selectedTransaction.date, 'dd MMMM yyyy HH:mm', { locale: id })}
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
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedTransaction.amount > 0 ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Saldo Setelah</Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedTransaction.balanceAfter)}
                  </Typography>
                </Grid>
                {selectedTransaction.method && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Metode</Typography>
                    <Typography variant="body1">{selectedTransaction.method}</Typography>
                  </Grid>
                )}
                {selectedTransaction.recipient && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Penerima</Typography>
                    <Typography variant="body1">{selectedTransaction.recipient}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Tutup</Button>
          <Button variant="contained" startIcon={<Receipt />}>
            Unduh Receipt
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
        onClick={() => setTopUpDialog(true)}
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

export default Wallet;