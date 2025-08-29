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
  Tabs,
  Tab,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Payment,
  Wallet,
  CreditCard,
  AccountBalance,
  QrCode,
  Security,
  Speed,
  Info,
  Settings,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import MidtransIntegration from './MidtransIntegration';
import XenditIntegration from './XenditIntegration';
import WalletManager from './WalletManager';
import { LoadingSpinner } from '../common/LoadingSpinner';

const PaymentGateway = ({ 
  orderId,
  amount,
  customerDetails,
  itemDetails,
  onSuccess,
  onPending,
  onError,
  onClose,
  isOpen = false,
  preferredGateway = 'auto', // 'auto', 'midtrans', 'xendit', 'wallet'
  enabledGateways = ['midtrans', 'xendit', 'wallet'],
  showComparison = true
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState({
    midtrans: 'available',
    xendit: 'available',
    wallet: 'available'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Gateway configurations
  const gatewayConfigs = {
    midtrans: {
      name: 'Midtrans',
      description: 'Payment gateway terpercaya dengan berbagai metode pembayaran',
      icon: <CreditCard />,
      color: 'primary',
      features: [
        'Kartu Kredit/Debit',
        'Bank Transfer',
        'E-Wallet (GoPay, OVO, DANA)',
        'Virtual Account',
        'Convenience Store',
        'Installment'
      ],
      fees: {
        credit_card: { rate: 2.9, type: 'percentage' },
        bank_transfer: { rate: 4000, type: 'fixed' },
        ewallet: { rate: 0, type: 'fixed' },
        va: { rate: 4000, type: 'fixed' }
      },
      processingTime: '1-3 menit',
      reliability: 99.9,
      security: 'PCI DSS Level 1'
    },
    xendit: {
      name: 'Xendit',
      description: 'Platform pembayaran modern dengan API yang fleksibel',
      icon: <AccountBalance />,
      color: 'secondary',
      features: [
        'Virtual Account (Semua Bank)',
        'E-Wallet (OVO, DANA, LinkAja)',
        'QRIS',
        'Retail Outlets',
        'Credit Card',
        'Direct Debit'
      ],
      fees: {
        credit_card: { rate: 2.9, type: 'percentage' },
        bank_transfer: { rate: 4000, type: 'fixed' },
        ewallet: { rate: 0, type: 'fixed' },
        va: { rate: 4000, type: 'fixed' },
        qris: { rate: 0.7, type: 'percentage' }
      },
      processingTime: '1-5 menit',
      reliability: 99.8,
      security: 'ISO 27001'
    },
    wallet: {
      name: 'Nakes Wallet',
      description: 'Gunakan saldo wallet Anda untuk pembayaran instan',
      icon: <Wallet />,
      color: 'success',
      features: [
        'Pembayaran Instan',
        'Tanpa Biaya Admin',
        'Riwayat Transaksi',
        'Top-up Mudah',
        'Cashback Program',
        'Loyalty Points'
      ],
      fees: {
        wallet: { rate: 0, type: 'fixed' }
      },
      processingTime: 'Instan',
      reliability: 99.9,
      security: 'End-to-End Encryption'
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkGatewayStatus();
      fetchWalletBalance();
      determineDefaultGateway();
    }
  }, [isOpen]);

  const checkGatewayStatus = async () => {
    try {
      setLoading(true);
      
      // Check each gateway status
      const statusChecks = await Promise.allSettled([
        fetch('/api/payment/midtrans/status'),
        fetch('/api/payment/xendit/status'),
        fetch('/api/wallet/status')
      ]);

      const newStatus = { ...gatewayStatus };
      
      statusChecks.forEach((result, index) => {
        const gateway = ['midtrans', 'xendit', 'wallet'][index];
        if (result.status === 'fulfilled' && result.value.ok) {
          newStatus[gateway] = 'available';
        } else {
          newStatus[gateway] = 'unavailable';
        }
      });

      setGatewayStatus(newStatus);
    } catch (error) {
      console.error('Error checking gateway status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const determineDefaultGateway = () => {
    if (preferredGateway === 'auto') {
      // Auto-select based on amount and wallet balance
      if (walletBalance >= amount && enabledGateways.includes('wallet')) {
        setSelectedGateway('wallet');
        setSelectedTab(enabledGateways.indexOf('wallet'));
      } else if (enabledGateways.includes('midtrans')) {
        setSelectedGateway('midtrans');
        setSelectedTab(enabledGateways.indexOf('midtrans'));
      } else if (enabledGateways.includes('xendit')) {
        setSelectedGateway('xendit');
        setSelectedTab(enabledGateways.indexOf('xendit'));
      }
    } else if (enabledGateways.includes(preferredGateway)) {
      setSelectedGateway(preferredGateway);
      setSelectedTab(enabledGateways.indexOf(preferredGateway));
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setSelectedGateway(enabledGateways[newValue]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateFee = (gateway, method = 'default') => {
    const config = gatewayConfigs[gateway];
    if (!config || !config.fees) return 0;
    
    const feeConfig = config.fees[method] || config.fees.credit_card || { rate: 0, type: 'fixed' };
    
    if (feeConfig.type === 'percentage') {
      return Math.ceil(amount * (feeConfig.rate / 100));
    }
    return feeConfig.rate;
  };

  const getRecommendedGateway = () => {
    // Recommend based on amount, wallet balance, and fees
    if (walletBalance >= amount && enabledGateways.includes('wallet')) {
      return 'wallet';
    }
    
    if (amount < 100000) {
      return enabledGateways.includes('xendit') ? 'xendit' : 'midtrans';
    }
    
    return enabledGateways.includes('midtrans') ? 'midtrans' : 'xendit';
  };

  const getGatewayRecommendation = (gateway) => {
    const recommended = getRecommendedGateway();
    if (gateway === recommended) {
      return {
        type: 'success',
        message: 'Direkomendasikan untuk transaksi ini'
      };
    }
    
    if (gateway === 'wallet' && walletBalance < amount) {
      return {
        type: 'warning',
        message: `Saldo tidak mencukupi (${formatCurrency(walletBalance)})`
      };
    }
    
    return null;
  };

  const handlePaymentSuccess = (data) => {
    if (onSuccess) {
      onSuccess({
        ...data,
        gateway: selectedGateway
      });
    }
  };

  const handlePaymentError = (error) => {
    if (onError) {
      onError({
        ...error,
        gateway: selectedGateway
      });
    }
  };

  const handleClose = () => {
    setSelectedTab(0);
    setSelectedGateway('');
    if (onClose) {
      onClose();
    }
  };

  const renderGatewayComparison = () => {
    if (!showComparison) return null;

    return (
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Perbandingan Payment Gateway
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
                size="small"
              />
            }
            label="Detail"
          />
        </Box>
        
        <Grid container spacing={2}>
          {enabledGateways.map((gateway) => {
            const config = gatewayConfigs[gateway];
            const recommendation = getGatewayRecommendation(gateway);
            const isAvailable = gatewayStatus[gateway] === 'available';
            
            return (
              <Grid item xs={12} md={4} key={gateway}>
                <Card 
                  variant="outlined"
                  sx={{
                    height: '100%',
                    border: selectedGateway === gateway ? 2 : 1,
                    borderColor: selectedGateway === gateway ? `${config.color}.main` : 'divider',
                    opacity: isAvailable ? 1 : 0.6
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {config.icon}
                      <Box>
                        <Typography variant="h6">
                          {config.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {config.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {recommendation && (
                      <Alert 
                        severity={recommendation.type} 
                        sx={{ mb: 2, py: 0 }}
                        variant="outlined"
                      >
                        <Typography variant="body2">
                          {recommendation.message}
                        </Typography>
                      </Alert>
                    )}
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Waktu Proses: {config.processingTime}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Biaya: {gateway === 'wallet' ? 'Gratis' : 'Mulai dari Rp 0'}
                      </Typography>
                    </Box>
                    
                    {showAdvanced && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Metode Pembayaran:
                        </Typography>
                        <List dense>
                          {config.features.slice(0, 3).map((feature, index) => (
                            <ListItem key={index} sx={{ py: 0, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 20 }}>
                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2">
                                    {feature}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Keamanan: {config.security}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Uptime: {config.reliability}%
                          </Typography>
                        </Box>
                      </>
                    )}
                    
                    {!isAvailable && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Gateway tidak tersedia
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  const renderPaymentInterface = () => {
    if (!selectedGateway) return null;

    const commonProps = {
      orderId,
      amount,
      customerDetails,
      itemDetails,
      onSuccess: handlePaymentSuccess,
      onPending,
      onError: handlePaymentError,
      onClose: handleClose,
      isOpen: true
    };

    switch (selectedGateway) {
      case 'midtrans':
        return <MidtransIntegration {...commonProps} />;
      case 'xendit':
        return <XenditIntegration {...commonProps} />;
      case 'wallet':
        return (
          <WalletManager 
            {...commonProps}
            mode="payment"
            paymentAmount={amount}
          />
        );
      default:
        return null;
    }
  };

  if (selectedGateway && gatewayStatus[selectedGateway] === 'available') {
    return renderPaymentInterface();
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment />
          Pilih Metode Pembayaran
          <Tooltip title="Pilih gateway pembayaran yang sesuai dengan kebutuhan Anda">
            <IconButton size="small">
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LoadingSpinner message="Memeriksa status payment gateway..." />
          </Box>
        )}
        
        {!loading && (
          <>
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
                {walletBalance > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Saldo Wallet:
                      </Typography>
                      <Typography variant="body1" sx={{ color: walletBalance >= amount ? 'success.main' : 'warning.main' }}>
                        {formatCurrency(walletBalance)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip 
                        label={walletBalance >= amount ? 'Saldo Mencukupi' : 'Perlu Top-up'}
                        color={walletBalance >= amount ? 'success' : 'warning'}
                        size="small"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Gateway Comparison */}
            {renderGatewayComparison()}

            {/* Gateway Selection Tabs */}
            <Paper variant="outlined" sx={{ mb: 3 }}>
              <Tabs 
                value={selectedTab} 
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {enabledGateways.map((gateway) => {
                  const config = gatewayConfigs[gateway];
                  const isAvailable = gatewayStatus[gateway] === 'available';
                  const recommendation = getRecommendedGateway() === gateway;
                  
                  return (
                    <Tab 
                      key={gateway}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {config.icon}
                          <Box>
                            <Typography variant="body2">
                              {config.name}
                            </Typography>
                            {recommendation && (
                              <Chip 
                                label="Direkomendasikan" 
                                size="small" 
                                color="success" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 16 }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                      disabled={!isAvailable}
                    />
                  );
                })}
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                {enabledGateways.map((gateway, index) => {
                  if (selectedTab !== index) return null;
                  
                  const config = gatewayConfigs[gateway];
                  const isAvailable = gatewayStatus[gateway] === 'available';
                  
                  return (
                    <Box key={gateway}>
                      <Typography variant="h6" gutterBottom>
                        {config.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {config.description}
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Metode Pembayaran:
                          </Typography>
                          <List dense>
                            {config.features.map((feature, idx) => (
                              <ListItem key={idx} sx={{ py: 0, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Typography variant="body2">
                                      {feature}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Informasi:
                          </Typography>
                          <List dense>
                            <ListItem sx={{ py: 0, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <Speed sx={{ fontSize: 18, color: 'info.main' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2">
                                    Waktu Proses: {config.processingTime}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <Security sx={{ fontSize: 18, color: 'success.main' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2">
                                    Keamanan: {config.security}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <CheckCircle sx={{ fontSize: 18, color: 'primary.main' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2">
                                    Uptime: {config.reliability}%
                                  </Typography>
                                }
                              />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>
                      
                      {!isAvailable && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Gateway {config.name} sedang tidak tersedia. Silakan pilih gateway lain atau coba lagi nanti.
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Batal
        </Button>
        <Button 
          onClick={() => setSelectedGateway(enabledGateways[selectedTab])}
          variant="contained"
          disabled={!enabledGateways[selectedTab] || gatewayStatus[enabledGateways[selectedTab]] !== 'available'}
        >
          Lanjutkan dengan {gatewayConfigs[enabledGateways[selectedTab]]?.name}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentGateway;