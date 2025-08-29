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
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Schedule,
  ExpandMore,
  ContentCopy,
  Timer,
  Phone,
  Email
} from '@mui/icons-material';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { format, addMinutes } from 'date-fns';
import { id } from 'date-fns/locale';

const XenditIntegration = ({ 
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
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: customerDetails?.name || '',
    email: customerDetails?.email || '',
    phone: customerDetails?.phone || ''
  });

  // Xendit configuration
  const XENDIT_PUBLIC_KEY = process.env.REACT_APP_XENDIT_PUBLIC_KEY || 'xnd_public_development_your_public_key';
  const XENDIT_ENVIRONMENT = process.env.REACT_APP_XENDIT_ENVIRONMENT || 'test'; // 'test' or 'live'

  // Available payment methods
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Kartu Kredit/Debit',
      description: 'Visa, Mastercard, JCB, AMEX',
      icon: <CreditCard />,
      fee: 2.9,
      feeType: 'percentage',
      processingTime: 'Instan'
    },
    {
      id: 'bca_va',
      name: 'BCA Virtual Account',
      description: 'Transfer melalui ATM/Mobile Banking BCA',
      icon: <AccountBalance />,
      fee: 4000,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'bni_va',
      name: 'BNI Virtual Account',
      description: 'Transfer melalui ATM/Mobile Banking BNI',
      icon: <AccountBalance />,
      fee: 4000,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'bri_va',
      name: 'BRI Virtual Account',
      description: 'Transfer melalui ATM/Mobile Banking BRI',
      icon: <AccountBalance />,
      fee: 4000,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'mandiri_va',
      name: 'Mandiri Virtual Account',
      description: 'Transfer melalui ATM/Mobile Banking Mandiri',
      icon: <AccountBalance />,
      fee: 4000,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'permata_va',
      name: 'Permata Virtual Account',
      description: 'Transfer melalui ATM/Mobile Banking Permata',
      icon: <AccountBalance />,
      fee: 4000,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'ovo',
      name: 'OVO',
      description: 'Bayar dengan OVO',
      icon: <Wallet />,
      fee: 0,
      feeType: 'fixed',
      processingTime: 'Instan'
    },
    {
      id: 'dana',
      name: 'DANA',
      description: 'Bayar dengan DANA',
      icon: <Wallet />,
      fee: 0,
      feeType: 'fixed',
      processingTime: 'Instan'
    },
    {
      id: 'linkaja',
      name: 'LinkAja',
      description: 'Bayar dengan LinkAja',
      icon: <Wallet />,
      fee: 0,
      feeType: 'fixed',
      processingTime: 'Instan'
    },
    {
      id: 'qris',
      name: 'QRIS',
      description: 'Scan QR Code untuk pembayaran',
      icon: <QrCode />,
      fee: 0.7,
      feeType: 'percentage',
      processingTime: 'Instan'
    },
    {
      id: 'alfamart',
      name: 'Alfamart',
      description: 'Bayar di counter Alfamart',
      icon: <QrCode />,
      fee: 2500,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    },
    {
      id: 'indomaret',
      name: 'Indomaret',
      description: 'Bayar di counter Indomaret',
      icon: <QrCode />,
      fee: 2500,
      feeType: 'fixed',
      processingTime: '1-3 menit'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setSelectedMethod('');
      setPaymentData(null);
      setPaymentStatus(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (expiryTime && paymentStatus === 'pending') {
      interval = setInterval(() => {
        const now = new Date();
        const remaining = expiryTime - now;
        
        if (remaining <= 0) {
          setTimeRemaining(null);
          setPaymentStatus('expired');
          clearInterval(interval);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expiryTime, paymentStatus]);

  const calculateFee = (method) => {
    if (method.feeType === 'percentage') {
      return Math.ceil(amount * (method.fee / 100));
    }
    return method.fee;
  };

  const calculateTotal = (method) => {
    return amount + calculateFee(method);
  };

  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setActiveStep(2);

      const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
      const totalAmount = calculateTotal(selectedPaymentMethod);

      // Prepare payment data based on method
      let paymentPayload = {
        external_id: orderId,
        amount: totalAmount,
        currency: 'IDR',
        payment_method: selectedMethod,
        customer: {
          given_names: customerForm.name.split(' ')[0],
          surname: customerForm.name.split(' ').slice(1).join(' ') || '',
          email: customerForm.email,
          mobile_number: customerForm.phone
        },
        description: `Pembayaran untuk order ${orderId}`,
        success_redirect_url: `${window.location.origin}/payment/success`,
        failure_redirect_url: `${window.location.origin}/payment/failed`
      };

      // Add method-specific configurations
      if (selectedMethod.includes('_va')) {
        paymentPayload.expiration_date = addMinutes(new Date(), 60 * 24).toISOString(); // 24 hours
      } else if (['ovo', 'dana', 'linkaja'].includes(selectedMethod)) {
        paymentPayload.expiration_date = addMinutes(new Date(), 15).toISOString(); // 15 minutes
      } else if (['alfamart', 'indomaret'].includes(selectedMethod)) {
        paymentPayload.expiration_date = addMinutes(new Date(), 60 * 24 * 3).toISOString(); // 3 days
      }

      // Call backend API
      const response = await fetch('/api/payment/xendit/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        throw new Error('Gagal membuat pembayaran');
      }

      const result = await response.json();
      setPaymentData(result);
      
      if (result.expiration_date) {
        setExpiryTime(new Date(result.expiration_date));
      }

      // Handle different payment method responses
      if (selectedMethod === 'credit_card') {
        // For credit card, redirect to Xendit's hosted payment page
        if (result.invoice_url) {
          window.open(result.invoice_url, '_blank');
        }
      }

      setPaymentStatus('pending');
      setActiveStep(3);

      // Start polling for payment status
      startStatusPolling(result.id);

    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error.message);
      setActiveStep(3);
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (paymentId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/xendit/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          
          if (status.status === 'PAID') {
            setPaymentStatus('success');
            clearInterval(pollInterval);
            
            if (onSuccess) {
              onSuccess({
                orderId: status.external_id,
                paymentId: status.id,
                amount: status.amount,
                paymentMethod: status.payment_method,
                paidAt: status.paid_at
              });
            }
          } else if (status.status === 'EXPIRED') {
            setPaymentStatus('expired');
            clearInterval(pollInterval);
          } else if (status.status === 'FAILED') {
            setPaymentStatus('error');
            clearInterval(pollInterval);
            
            if (onError) {
              onError({
                orderId: status.external_id,
                error: status.failure_code || 'Payment failed'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 30 * 60 * 1000);
  };

  const retryPayment = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setPaymentData(null);
      setPaymentStatus(null);
      setError(null);
      setActiveStep(1);
    } else {
      setError('Maksimal percobaan tercapai. Silakan coba lagi nanti.');
    }
  };

  const resetPayment = () => {
    setSelectedMethod('');
    setPaymentData(null);
    setPaymentStatus(null);
    setError(null);
    setRetryCount(0);
    setActiveStep(0);
    setExpiryTime(null);
    setTimeRemaining(null);
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

  const formatTimeRemaining = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getPaymentSteps = () => {
    return [
      'Informasi Pelanggan',
      'Pilih Metode Pembayaran',
      'Proses Pembayaran',
      'Konfirmasi Pembayaran'
    ];
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);

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
          Pembayaran Xendit
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
                Subtotal:
              </Typography>
              <Typography variant="body1">
                {formatCurrency(amount)}
              </Typography>
            </Grid>
            {selectedPaymentMethod && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Biaya Admin:
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(calculateFee(selectedPaymentMethod))}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Pembayaran:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(calculateTotal(selectedPaymentMethod))}
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
                {/* Step 0: Customer Information */}
                {index === 0 && (
                  <Box sx={{ py: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nama Lengkap"
                          value={customerForm.name}
                          onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nomor Telepon"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+62812345678"
                          required
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {/* Step 1: Payment Method Selection */}
                {index === 1 && (
                  <Box sx={{ py: 2 }}>
                    <RadioGroup
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                    >
                      {paymentMethods.map((method) => (
                        <Card 
                          key={method.id} 
                          variant="outlined" 
                          sx={{ 
                            mb: 2,
                            border: selectedMethod === method.id ? 2 : 1,
                            borderColor: selectedMethod === method.id ? 'primary.main' : 'divider'
                          }}
                        >
                          <CardContent>
                            <FormControlLabel
                              value={method.id}
                              control={<Radio />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                  {method.icon}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                      {method.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {method.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Biaya: {method.fee === 0 ? 'Gratis' : 
                                          method.feeType === 'percentage' ? `${method.fee}%` : formatCurrency(method.fee)
                                        }
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Proses: {method.processingTime}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                              sx={{ width: '100%', m: 0 }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </RadioGroup>
                  </Box>
                )}
                
                {/* Step 2: Processing */}
                {index === 2 && (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <LoadingSpinner message="Membuat pembayaran..." />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Mohon tunggu, sedang memproses pembayaran Anda
                    </Typography>
                  </Box>
                )}
                
                {/* Step 3: Payment Instructions */}
                {index === 3 && (
                  <Box sx={{ py: 2 }}>
                    {paymentStatus === 'success' && (
                      <Box sx={{ textAlign: 'center' }}>
                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          Pembayaran Berhasil!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Terima kasih, pembayaran Anda telah berhasil diproses
                        </Typography>
                      </Box>
                    )}
                    
                    {paymentStatus === 'pending' && paymentData && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6" sx={{ color: 'warning.main' }}>
                            Menunggu Pembayaran
                          </Typography>
                          {timeRemaining && (
                            <Chip 
                              icon={<Timer />}
                              label={`Sisa waktu: ${formatTimeRemaining(timeRemaining)}`}
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        {/* Virtual Account Instructions */}
                        {selectedMethod.includes('_va') && paymentData.account_number && (
                          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                              Nomor Virtual Account
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {paymentData.account_number}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(paymentData.account_number)}
                              >
                                Salin
                              </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Transfer sejumlah {formatCurrency(paymentData.amount)} ke nomor virtual account di atas
                            </Typography>
                            
                            <Accordion sx={{ mt: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="subtitle2">Cara Transfer</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography variant="body2" component="div">
                                  <strong>Melalui ATM:</strong>
                                  <ol>
                                    <li>Pilih menu Transfer</li>
                                    <li>Pilih ke Rekening {selectedPaymentMethod?.name}</li>
                                    <li>Masukkan nomor virtual account</li>
                                    <li>Masukkan jumlah transfer</li>
                                    <li>Konfirmasi transaksi</li>
                                  </ol>
                                  
                                  <strong>Melalui Mobile Banking:</strong>
                                  <ol>
                                    <li>Login ke aplikasi mobile banking</li>
                                    <li>Pilih menu Transfer</li>
                                    <li>Pilih transfer ke virtual account</li>
                                    <li>Masukkan nomor virtual account</li>
                                    <li>Konfirmasi pembayaran</li>
                                  </ol>
                                </Typography>
                              </AccordionDetails>
                            </Accordion>
                          </Paper>
                        )}
                        
                        {/* E-Wallet Instructions */}
                        {['ovo', 'dana', 'linkaja'].includes(selectedMethod) && (
                          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                              Pembayaran {selectedPaymentMethod?.name}
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                              Silakan buka aplikasi {selectedPaymentMethod?.name} Anda dan selesaikan pembayaran
                            </Alert>
                            <Typography variant="body2" color="text.secondary">
                              Anda akan menerima notifikasi push untuk menyelesaikan pembayaran
                            </Typography>
                          </Paper>
                        )}
                        
                        {/* QRIS Instructions */}
                        {selectedMethod === 'qris' && paymentData.qr_string && (
                          <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                              Scan QR Code
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              {/* QR Code would be generated here */}
                              <Box 
                                sx={{ 
                                  width: 200, 
                                  height: 200, 
                                  border: '1px solid #ddd', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  mx: 'auto',
                                  mb: 2
                                }}
                              >
                                <QrCode sx={{ fontSize: 100, color: 'text.secondary' }} />
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Scan QR code dengan aplikasi e-wallet atau mobile banking Anda
                            </Typography>
                          </Paper>
                        )}
                        
                        {/* Retail Store Instructions */}
                        {['alfamart', 'indomaret'].includes(selectedMethod) && paymentData.payment_code && (
                          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                              Kode Pembayaran {selectedPaymentMethod?.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {paymentData.payment_code}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(paymentData.payment_code)}
                              >
                                Salin
                              </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Tunjukkan kode ini ke kasir {selectedPaymentMethod?.name} untuk melakukan pembayaran
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Jumlah yang harus dibayar: {formatCurrency(paymentData.amount)}
                            </Typography>
                          </Paper>
                        )}
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
                    
                    {paymentStatus === 'expired' && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          Pembayaran Kedaluwarsa
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Waktu pembayaran telah habis. Silakan buat pembayaran baru.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Environment Warning */}
        {XENDIT_ENVIRONMENT === 'test' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Mode Test:</strong> Ini adalah lingkungan testing. Pembayaran tidak akan diproses secara nyata.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {activeStep === 0 && (
          <>
            <Button onClick={handleClose}>Batal</Button>
            <Button 
              onClick={() => setActiveStep(1)}
              variant="contained"
              disabled={!customerForm.name || !customerForm.email || !customerForm.phone}
            >
              Lanjutkan
            </Button>
          </>
        )}
        
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Kembali</Button>
            <Button 
              onClick={createPayment}
              variant="contained"
              disabled={!selectedMethod}
            >
              Bayar {selectedPaymentMethod ? formatCurrency(calculateTotal(selectedPaymentMethod)) : ''}
            </Button>
          </>
        )}
        
        {activeStep === 3 && (
          <>
            {(paymentStatus === 'error' || paymentStatus === 'expired') && retryCount < 3 && (
              <Button onClick={retryPayment} color="primary">
                Coba Lagi
              </Button>
            )}
            <Button onClick={handleClose} variant="contained">
              {paymentStatus === 'success' ? 'Selesai' : 'Tutup'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default XenditIntegration;