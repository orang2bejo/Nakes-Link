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
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Payment,
  CheckCircle,
  Error,
  Warning,
  Info,
  Security,
  CreditCard,
  AccountBalance,
  Wallet,
  QrCode,
  Schedule
} from '@mui/icons-material';
import { LoadingSpinner } from '../common/LoadingSpinner';

const MidtransIntegration = ({ 
  orderId,
  amount,
  customerDetails,
  itemDetails,
  onSuccess,
  onPending,
  onError,
  onClose,
  isOpen = false
}) => {
  const [loading, setLoading] = useState(false);
  const [snapToken, setSnapToken] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  // Midtrans configuration
  const MIDTRANS_CLIENT_KEY = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-your-client-key';
  const MIDTRANS_ENVIRONMENT = process.env.REACT_APP_MIDTRANS_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'
  const MIDTRANS_SCRIPT_URL = MIDTRANS_ENVIRONMENT === 'production' 
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  useEffect(() => {
    if (isOpen) {
      loadMidtransScript();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isSnapLoaded && !snapToken) {
      initializePayment();
    }
  }, [isOpen, isSnapLoaded, snapToken]);

  const loadMidtransScript = () => {
    // Check if Midtrans script is already loaded
    if (window.snap) {
      setIsSnapLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${MIDTRANS_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.onload = () => setIsSnapLoaded(true);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = MIDTRANS_SCRIPT_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      setIsSnapLoaded(true);
    };
    script.onerror = () => {
      setError('Gagal memuat Midtrans SDK');
    };
    document.head.appendChild(script);
  };

  const initializePayment = async () => {
    try {
      setLoading(true);
      setActiveStep(0);
      setError(null);

      // Prepare transaction data
      const transactionData = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: customerDetails,
        item_details: itemDetails || [{
          id: 'item-1',
          price: amount,
          quantity: 1,
          name: 'Layanan Kesehatan'
        }],
        credit_card: {
          secure: true
        },
        callbacks: {
          finish: 'https://your-website.com/payment/finish',
          error: 'https://your-website.com/payment/error',
          pending: 'https://your-website.com/payment/pending'
        }
      };

      // Call backend to get snap token
      const response = await fetch('/api/payment/midtrans/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error('Gagal membuat transaksi');
      }

      const result = await response.json();
      setSnapToken(result.token);
      setTransactionId(result.transaction_id);
      setActiveStep(1);

    } catch (error) {
      console.error('Error initializing payment:', error);
      setError(error.message);
      setActiveStep(3);
    } finally {
      setLoading(false);
    }
  };

  const openSnapPayment = () => {
    if (!window.snap || !snapToken) {
      setError('Midtrans SDK belum siap');
      return;
    }

    setActiveStep(2);

    window.snap.pay(snapToken, {
      onSuccess: function(result) {
        console.log('Payment success:', result);
        setPaymentStatus('success');
        setPaymentMethod(result.payment_type);
        setActiveStep(3);
        
        if (onSuccess) {
          onSuccess({
            orderId: result.order_id,
            transactionId: result.transaction_id,
            paymentType: result.payment_type,
            grossAmount: result.gross_amount,
            transactionTime: result.transaction_time,
            transactionStatus: result.transaction_status,
            fraudStatus: result.fraud_status
          });
        }
      },
      onPending: function(result) {
        console.log('Payment pending:', result);
        setPaymentStatus('pending');
        setPaymentMethod(result.payment_type);
        setActiveStep(3);
        
        if (onPending) {
          onPending({
            orderId: result.order_id,
            transactionId: result.transaction_id,
            paymentType: result.payment_type,
            grossAmount: result.gross_amount,
            transactionTime: result.transaction_time,
            transactionStatus: result.transaction_status
          });
        }
      },
      onError: function(result) {
        console.log('Payment error:', result);
        setPaymentStatus('error');
        setError(result.status_message || 'Pembayaran gagal');
        setActiveStep(3);
        
        if (onError) {
          onError({
            orderId: result.order_id,
            statusCode: result.status_code,
            statusMessage: result.status_message
          });
        }
      },
      onClose: function() {
        console.log('Payment popup closed');
        // Don't change step if payment was successful or pending
        if (paymentStatus !== 'success' && paymentStatus !== 'pending') {
          setActiveStep(1);
        }
      }
    });
  };

  const retryPayment = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setSnapToken(null);
      setPaymentStatus(null);
      setError(null);
      initializePayment();
    } else {
      setError('Maksimal percobaan tercapai. Silakan coba lagi nanti.');
    }
  };

  const resetPayment = () => {
    setSnapToken(null);
    setPaymentStatus(null);
    setTransactionId('');
    setPaymentMethod('');
    setActiveStep(0);
    setError(null);
    setRetryCount(0);
  };

  const handleClose = () => {
    resetPayment();
    if (onClose) {
      onClose();
    }
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
      'Inisialisasi Pembayaran',
      'Pilih Metode Pembayaran',
      'Proses Pembayaran',
      'Konfirmasi Pembayaran'
    ];
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard />;
      case 'bank_transfer':
        return <AccountBalance />;
      case 'echannel':
        return <AccountBalance />;
      case 'gopay':
      case 'shopeepay':
      case 'qris':
        return <Wallet />;
      case 'cstore':
        return <QrCode />;
      default:
        return <Payment />;
    }
  };

  const getPaymentMethodName = (method) => {
    const methodNames = {
      'credit_card': 'Kartu Kredit/Debit',
      'bank_transfer': 'Transfer Bank',
      'echannel': 'Mandiri Bill',
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'qris': 'QRIS',
      'cstore': 'Convenience Store',
      'bca_va': 'BCA Virtual Account',
      'bni_va': 'BNI Virtual Account',
      'bri_va': 'BRI Virtual Account',
      'permata_va': 'Permata Virtual Account'
    };
    return methodNames[method] || method;
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={activeStep === 2}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment />
          Pembayaran Midtrans
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Transaction Summary */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detail Transaksi
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Order ID:
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {orderId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Pembayaran:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {formatCurrency(amount)}
              </Typography>
            </Grid>
            {customerDetails && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nama:
                  </Typography>
                  <Typography variant="body1">
                    {customerDetails.first_name} {customerDetails.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body1">
                    {customerDetails.email}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* Payment Steps */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {getPaymentSteps().map((label, index) => (
            <Step key={label}>
              <StepLabel 
                error={index === activeStep && error}
                icon={index === activeStep && loading ? <CircularProgress size={24} /> : undefined}
              >
                {label}
              </StepLabel>
              <StepContent>
                {/* Step 0: Initialization */}
                {index === 0 && (
                  <Box sx={{ py: 2 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">
                          Menginisialisasi pembayaran...
                        </Typography>
                      </Box>
                    ) : error ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    ) : (
                      <Alert severity="info">
                        Menyiapkan pembayaran untuk order {orderId}
                      </Alert>
                    )}
                  </Box>
                )}
                
                {/* Step 1: Payment Method Selection */}
                {index === 1 && (
                  <Box sx={{ py: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security fontSize="small" />
                        Pembayaran diproses dengan aman melalui Midtrans
                      </Box>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Klik tombol "Bayar Sekarang" untuk memilih metode pembayaran
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CreditCard fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Kartu Kredit/Debit" secondary="Visa, Mastercard, JCB" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccountBalance fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Transfer Bank" secondary="BCA, Mandiri, BNI, BRI, Permata" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Wallet fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="E-Wallet" secondary="GoPay, ShopeePay, QRIS" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <QrCode fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Convenience Store" secondary="Indomaret, Alfamart" />
                      </ListItem>
                    </List>
                  </Box>
                )}
                
                {/* Step 2: Processing */}
                {index === 2 && (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <LoadingSpinner message="Memproses pembayaran..." />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Jangan tutup halaman ini sampai pembayaran selesai
                    </Typography>
                  </Box>
                )}
                
                {/* Step 3: Result */}
                {index === 3 && (
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
                        {paymentMethod && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
                            {getPaymentMethodIcon(paymentMethod)}
                            <Typography variant="body2">
                              Dibayar dengan {getPaymentMethodName(paymentMethod)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {paymentStatus === 'pending' && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          Menunggu Pembayaran
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          Transaction ID: {transactionId}
                        </Typography>
                        {paymentMethod && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
                            {getPaymentMethodIcon(paymentMethod)}
                            <Typography variant="body2">
                              Metode: {getPaymentMethodName(paymentMethod)}
                            </Typography>
                          </Box>
                        )}
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Silakan selesaikan pembayaran sesuai instruksi yang diberikan
                        </Alert>
                      </Box>
                    )}
                    
                    {(paymentStatus === 'error' || error) && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          Pembayaran Gagal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {error || 'Terjadi kesalahan saat memproses pembayaran'}
                        </Typography>
                        {retryCount < 3 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Percobaan ke-{retryCount + 1} dari 3
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Environment Warning */}
        {MIDTRANS_ENVIRONMENT === 'sandbox' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Mode Sandbox:</strong> Ini adalah lingkungan testing. Gunakan data kartu test untuk pembayaran.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {activeStep === 1 && snapToken && (
          <>
            <Button onClick={handleClose}>Batal</Button>
            <Button 
              onClick={openSnapPayment}
              variant="contained"
              startIcon={<Payment />}
            >
              Bayar Sekarang
            </Button>
          </>
        )}
        
        {activeStep === 3 && (
          <>
            {(paymentStatus === 'error' || error) && retryCount < 3 && (
              <Button onClick={retryPayment} color="primary">
                Coba Lagi
              </Button>
            )}
            <Button onClick={handleClose} variant="contained">
              {paymentStatus === 'success' ? 'Selesai' : 'Tutup'}
            </Button>
          </>
        )}
        
        {(activeStep === 0 && error) && (
          <>
            <Button onClick={handleClose}>Batal</Button>
            <Button onClick={retryPayment} variant="contained">
              Coba Lagi
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MidtransIntegration;