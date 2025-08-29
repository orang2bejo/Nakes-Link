// Payment Components Export
export { default as PaymentIntegration } from './PaymentIntegration';
export { default as PaymentGateway } from './PaymentGateway';
export { default as WalletManager } from './WalletManager';
export { default as MidtransIntegration } from './MidtransIntegration';
export { default as XenditIntegration } from './XenditIntegration';

// Payment utilities and helpers
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const calculateFee = (amount, feeConfig) => {
  if (feeConfig.type === 'percentage') {
    return Math.ceil(amount * (feeConfig.rate / 100));
  }
  return feeConfig.rate;
};

export const validatePaymentAmount = (amount, minAmount = 1000, maxAmount = 50000000) => {
  if (amount < minAmount) {
    return {
      valid: false,
      message: `Minimum pembayaran adalah ${formatCurrency(minAmount)}`
    };
  }
  
  if (amount > maxAmount) {
    return {
      valid: false,
      message: `Maksimum pembayaran adalah ${formatCurrency(maxAmount)}`
    };
  }
  
  return { valid: true };
};

export const getPaymentMethodIcon = (method) => {
  const icons = {
    credit_card: '💳',
    bank_transfer: '🏦',
    virtual_account: '🏧',
    ewallet: '📱',
    qris: '📱',
    convenience_store: '🏪',
    wallet: '👛'
  };
  
  return icons[method] || '💳';
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    success: 'success',
    failed: 'error',
    expired: 'error',
    cancelled: 'default'
  };
  
  return colors[status] || 'default';
};

export const getPaymentStatusText = (status) => {
  const texts = {
    pending: 'Menunggu Pembayaran',
    success: 'Pembayaran Berhasil',
    failed: 'Pembayaran Gagal',
    expired: 'Pembayaran Kedaluwarsa',
    cancelled: 'Pembayaran Dibatalkan'
  };
  
  return texts[status] || 'Status Tidak Diketahui';
};

// Payment gateway configurations
export const PAYMENT_GATEWAYS = {
  MIDTRANS: 'midtrans',
  XENDIT: 'xendit',
  WALLET: 'wallet'
};

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer',
  VIRTUAL_ACCOUNT: 'virtual_account',
  EWALLET: 'ewallet',
  QRIS: 'qris',
  CONVENIENCE_STORE: 'convenience_store',
  WALLET: 'wallet'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Default payment configurations
export const DEFAULT_PAYMENT_CONFIG = {
  enabledGateways: ['midtrans', 'xendit', 'wallet'],
  preferredGateway: 'auto',
  showComparison: true,
  minAmount: 1000,
  maxAmount: 50000000,
  currency: 'IDR',
  locale: 'id-ID'
};

// Payment validation rules
export const VALIDATION_RULES = {
  amount: {
    min: 1000,
    max: 50000000,
    required: true
  },
  customer: {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, pattern: /^\+?[1-9]\d{1,14}$/ }
  },
  order: {
    id: { required: true, minLength: 1 },
    items: { required: true, minItems: 1 }
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Koneksi internet bermasalah. Silakan coba lagi.',
  GATEWAY_UNAVAILABLE: 'Payment gateway sedang tidak tersedia.',
  INSUFFICIENT_BALANCE: 'Saldo wallet tidak mencukupi.',
  INVALID_AMOUNT: 'Jumlah pembayaran tidak valid.',
  PAYMENT_EXPIRED: 'Waktu pembayaran telah habis.',
  PAYMENT_FAILED: 'Pembayaran gagal diproses.',
  VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  PAYMENT_SUCCESS: 'Pembayaran berhasil diproses!',
  WALLET_TOPUP: 'Top-up wallet berhasil!',
  WALLET_WITHDRAWAL: 'Penarikan dana berhasil!',
  PAYMENT_CANCELLED: 'Pembayaran berhasil dibatalkan.'
};