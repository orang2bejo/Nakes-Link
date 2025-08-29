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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  Wallet,
  QrCode,
  Security,
  CheckCircle,
  Error,
  Warning,
  Info,
  Receipt,
  History,
  Refresh,
  Download,
  Print,
  Share,
  ExpandMore,
  AccountBalanceWallet,
  MonetizationOn,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Add,
  Remove,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSpinner } from '../common/LoadingSpinner';

const PaymentIntegration = ({ 
  amount, 
  orderId, 
  customerInfo, 
  onPaymentSuccess, 
  onPaymentError,
  onPaymentPending 
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [virtualAccount, setVirtualAccount] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);

  // Payment form states
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: ''
  });

  // Mock payment methods
  const mockPaymentMethods = [
    {
      id: 'wallet',
      name: 'Nakes Wallet',
      type: 'wallet',
      icon: <AccountBalanceWallet />,
      description: 'Bayar menggunakan saldo wallet Anda',
      fee: 0,
      isAvailable: true,
      processingTime: 'Instan'
    },
    {
      id: 'credit_card',
      name: 'Kartu Kredit/Debit',
      type: 'card',
      icon: <CreditCard />,
      description: 'Visa, Mastercard, JCB',
      fee: 2500,
      isAvailable: true,
      processingTime: 'Instan'
    },
    {
      id: 'bank_transfer',
      name: 'Transfer Bank',
      type: 'bank_transfer',
      icon: <AccountBalance />,
      description: 'BCA, Mandiri, BNI, BRI',
      fee: 4000,
      isAvailable: true,
      processingTime: '1-3 menit'
    },
    {
      id: 'gopay',
      name: 'GoPay',
      type: 'ewallet',
      icon: <Wallet />,
      description: 'Bayar dengan GoPay',
      fee: 0,
      isAvailable: true,
      processingTime: 'Instan'
    },
    {
      id: 'ovo',
      name: 'OVO',
      type: 'ewallet',
      icon: <Wallet />,
      description: 'Bayar dengan OVO',
      fee: 0,
      isAvailable: true,
      processingTime: 'Instan'
    },
    {
      id: 'dana',
      name: 'DANA',
      type: 'ewallet',
      icon: <Wallet />,
      description: 'Bayar dengan DANA',
      fee: 0,
      isAvailable: true,
      processingTime: 'Instan'
    },
    {
      id: 'qris',
      name: 'QRIS',
      type: 'qr',
      icon: <QrCode />,
      description: 'Scan QR Code untuk pembayaran',
      fee: 0,
      isAvailable: true,
      processingTime: 'Instan'
    }
  ];

  useEffect(() => {
    fetchPaymentMethods();
    fetchWalletBalance();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPaymentMethods(mockPaymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setWalletBalance(250000); // Mock balance
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setPaymentDialog(true);
    setPaymentStep(0);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      setPaymentStep(1);
      
      const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (selectedMethod === 'wallet') {
        if (walletBalance < amount) {
          throw new Error('Saldo wallet tidak mencukupi');
        }
        // Process wallet payment
        setPaymentStatus('success');
        setTransactionId(`TXN${Date.now()}`);
        setPaymentStep(2);
        
        // Update wallet balance
        setWalletBalance(prev => prev - amount);
        
        if (onPaymentSuccess) {
          onPaymentSuccess({
            transactionId: `TXN${Date.now()}`,
            method: selectedPaymentMethod,
            amount,
            status: 'success'
          });
        }
      } else if (selectedMethod === 'credit_card') {
        // Validate card form
        if (!cardForm.cardNumber || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.cvv) {
          throw new Error('Mohon lengkapi data kartu');
        }
        
        // Process card payment
        setPaymentStatus('success');
        setTransactionId(`TXN${Date.now()}`);
        setPaymentStep(2);
        
        if (onPaymentSuccess) {
          onPaymentSuccess({
            transactionId: `TXN${Date.now()}`,
            method: selectedPaymentMethod,
            amount: amount + selectedPaymentMethod.fee,
            status: 'success'
          });
        }
      } else if (selectedPaymentMethod.type === 'bank_transfer') {
        // Generate virtual account
        setVirtualAccount(`8808${Math.random().toString().substr(2, 10)}`);
        setPaymentExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
        setPaymentStatus('pending');
        setTransactionId(`TXN${Date.now()}`);
        setPaymentStep(2);
        
        if (onPaymentPending) {
          onPaymentPending({
            transactionId: `TXN${Date.now()}`,
            method: selectedPaymentMethod,
            amount: amount + selectedPaymentMethod.fee,
            virtualAccount,
            expiry: paymentExpiry,
            status: 'pending'
          });
        }
      } else if (selectedPaymentMethod.type === 'ewallet' || selectedPaymentMethod.type === 'qr') {
        // Generate QR code or redirect URL
        setQrCodeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        setPaymentExpiry(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
        setPaymentStatus('pending');
        setTransactionId(`TXN${Date.now()}`);
        setPaymentStep(2);
        
        if (onPaymentPending) {
          onPaymentPending({
            transactionId: `TXN${Date.now()}`,
            method: selectedPaymentMethod,
            amount,
            qrCodeUrl,
            expiry: paymentExpiry,
            status: 'pending'
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setPaymentStep(2);
      
      if (onPaymentError) {
        onPaymentError({
          error: error.message,
          method: selectedMethod
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentDialog(false);
    setPaymentStep(0);
    setPaymentStatus(null);
    setTransactionId('');
    setQrCodeUrl('');
    setVirtualAccount('');
    setPaymentExpiry(null);
    setSelectedMethod('');
    setCardForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolderName: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentSteps = () => {
    return [
      'Pilih Metode Pembayaran',
      'Proses Pembayaran',
      'Konfirmasi Pembayaran'
    ];
  };

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);
  const totalAmount = selectedPaymentMethod ? amount + selectedPaymentMethod.fee : amount;

  if (loading && paymentMethods.length === 0) {
    return <LoadingSpinner message="Memuat metode pembayaran..." />;
  }

  return (
    <Box>
      {/* Payment Methods Grid */}
      <Grid container spacing={2}>
        {paymentMethods.map((method) => {
          const isWalletInsufficient = method.id === 'wallet' && walletBalance < amount;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={method.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: method.isAvailable && !isWalletInsufficient ? 'pointer' : 'not-allowed',
                    opacity: method.isAvailable && !isWalletInsufficient ? 1 : 0.6,
                    '&:hover': {
                      boxShadow: method.isAvailable && !isWalletInsufficient ? 2 : 0
                    }
                  }}
                  onClick={() => {
                    if (method.isAvailable && !isWalletInsufficient) {
                      handlePaymentMethodSelect(method.id);
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {method.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {method.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {method.id === 'wallet' && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Saldo:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {showBalance ? formatCurrency(walletBalance) : '••••••••'}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowBalance(!showBalance);
                              }}
                            >
                              {showBalance ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </Box>
                        </Box>
                        {isWalletInsufficient && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            Saldo tidak mencukupi
                          </Alert>
                        )}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Biaya: {method.fee > 0 ? formatCurrency(method.fee) : 'Gratis'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Proses: {method.processingTime}
                        </Typography>
                      </Box>
                      
                      {!method.isAvailable && (
                        <Chip label="Tidak Tersedia" size="small" color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={resetPayment} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={paymentStep === 1}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedPaymentMethod?.icon}
            Pembayaran - {selectedPaymentMethod?.name}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={paymentStep} orientation="vertical">
            {getPaymentSteps().map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {/* Step 0: Payment Method Details */}
                  {index === 0 && (
                    <Box sx={{ py: 2 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                              Detail Pembayaran
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Order ID: {orderId}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Jumlah: {formatCurrency(amount)}
                              </Typography>
                              {selectedPaymentMethod?.fee > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  Biaya Admin: {formatCurrency(selectedPaymentMethod.fee)}
                                </Typography>
                              )}
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Total: {formatCurrency(totalAmount)}
                              </Typography>
                            </Box>
                            
                            {customerInfo && (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Informasi Pelanggan:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {customerInfo.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {customerInfo.email}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {customerInfo.phone}
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          {selectedMethod === 'credit_card' && (
                            <Paper variant="outlined" sx={{ p: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Informasi Kartu
                              </Typography>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Nomor Kartu"
                                    value={cardForm.cardNumber}
                                    onChange={(e) => setCardForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                                    placeholder="1234 5678 9012 3456"
                                    inputProps={{ maxLength: 19 }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Nama Pemegang Kartu"
                                    value={cardForm.cardHolderName}
                                    onChange={(e) => setCardForm(prev => ({ ...prev, cardHolderName: e.target.value }))}
                                  />
                                </Grid>
                                
                                <Grid item xs={4}>
                                  <FormControl fullWidth>
                                    <InputLabel>Bulan</InputLabel>
                                    <Select
                                      value={cardForm.expiryMonth}
                                      onChange={(e) => setCardForm(prev => ({ ...prev, expiryMonth: e.target.value }))}
                                      label="Bulan"
                                    >
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                                          {month.toString().padStart(2, '0')}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                
                                <Grid item xs={4}>
                                  <FormControl fullWidth>
                                    <InputLabel>Tahun</InputLabel>
                                    <Select
                                      value={cardForm.expiryYear}
                                      onChange={(e) => setCardForm(prev => ({ ...prev, expiryYear: e.target.value }))}
                                      label="Tahun"
                                    >
                                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                        <MenuItem key={year} value={year.toString()}>
                                          {year}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                
                                <Grid item xs={4}>
                                  <TextField
                                    fullWidth
                                    label="CVV"
                                    value={cardForm.cvv}
                                    onChange={(e) => setCardForm(prev => ({ ...prev, cvv: e.target.value }))}
                                    inputProps={{ maxLength: 4 }}
                                    type="password"
                                  />
                                </Grid>
                              </Grid>
                              
                              <Alert severity="info" sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Security fontSize="small" />
                                  Data kartu Anda dienkripsi dan aman
                                </Box>
                              </Alert>
                            </Paper>
                          )}
                          
                          {selectedMethod === 'wallet' && (
                            <Paper variant="outlined" sx={{ p: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Pembayaran Wallet
                              </Typography>
                              
                              <Box sx={{ textAlign: 'center', py: 3 }}>
                                <AccountBalanceWallet sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                  Saldo Saat Ini
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                                  {formatCurrency(walletBalance)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Saldo setelah pembayaran: {formatCurrency(walletBalance - amount)}
                                </Typography>
                              </Box>
                            </Paper>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {/* Step 1: Processing */}
                  {index === 1 && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <LoadingSpinner message="Memproses pembayaran..." />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Mohon tunggu, jangan tutup halaman ini
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Step 2: Result */}
                  {index === 2 && (
                    <Box sx={{ py: 2 }}>
                      {paymentStatus === 'success' && (
                        <Box sx={{ textAlign: 'center' }}>
                          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            Pembayaran Berhasil!
                          </Typography>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            Transaction ID: {transactionId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pembayaran Anda telah berhasil diproses
                          </Typography>
                        </Box>
                      )}
                      
                      {paymentStatus === 'pending' && (
                        <Box>
                          <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                              Menunggu Pembayaran
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Transaction ID: {transactionId}
                            </Typography>
                          </Box>
                          
                          {virtualAccount && (
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Virtual Account
                              </Typography>
                              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold', mb: 2 }}>
                                {virtualAccount}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Transfer ke nomor virtual account di atas sejumlah {formatCurrency(totalAmount)}
                              </Typography>
                              {paymentExpiry && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                  Berlaku hingga: {format(paymentExpiry, 'dd MMM yyyy HH:mm', { locale: id })}
                                </Typography>
                              )}
                            </Paper>
                          )}
                          
                          {qrCodeUrl && (
                            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                Scan QR Code
                              </Typography>
                              <img 
                                src={qrCodeUrl} 
                                alt="QR Code" 
                                style={{ width: 200, height: 200, border: '1px solid #ddd' }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Scan QR code dengan aplikasi {selectedPaymentMethod?.name}
                              </Typography>
                              {paymentExpiry && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                  Berlaku hingga: {format(paymentExpiry, 'dd MMM yyyy HH:mm', { locale: id })}
                                </Typography>
                              )}
                            </Paper>
                          )}
                        </Box>
                      )}
                      
                      {paymentStatus === 'error' && (
                        <Box sx={{ textAlign: 'center' }}>
                          <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            Pembayaran Gagal
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        
        <DialogActions>
          {paymentStep === 0 && (
            <>
              <Button onClick={resetPayment}>Batal</Button>
              <Button 
                onClick={processPayment}
                variant="contained"
                disabled={selectedMethod === 'credit_card' && (!cardForm.cardNumber || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.cvv)}
              >
                Bayar {formatCurrency(totalAmount)}
              </Button>
            </>
          )}
          
          {paymentStep === 2 && (
            <>
              {paymentStatus === 'error' && (
                <Button onClick={() => setPaymentStep(0)} color="primary">
                  Coba Lagi
                </Button>
              )}
              <Button onClick={resetPayment} variant="contained">
                {paymentStatus === 'success' ? 'Selesai' : 'Tutup'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentIntegration;