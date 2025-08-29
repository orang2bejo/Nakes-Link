const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  appointment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  external_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true // ID from payment gateway
  },
  payment_type: {
    type: DataTypes.ENUM('appointment', 'wallet_topup', 'subscription', 'penalty', 'refund', 'withdrawal'),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'qris', 'virtual_account', 'cash'),
    allowNull: false
  },
  payment_provider: {
    type: DataTypes.STRING,
    allowNull: true // midtrans, xendit, etc.
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  payment_gateway_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  net_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false // amount - platform_fee - payment_gateway_fee
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'IDR'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired'),
    defaultValue: 'pending'
  },
  payment_url: {
    type: DataTypes.TEXT,
    allowNull: true // URL for payment page
  },
  payment_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  va_number: {
    type: DataTypes.STRING,
    allowNull: true // Virtual Account number
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true // QR code for QRIS payments
  },
  payment_instructions: {
    type: DataTypes.JSONB,
    allowNull: true // Instructions for completing payment
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expired_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gateway_response: {
    type: DataTypes.JSONB,
    allowNull: true // Raw response from payment gateway
  },
  webhook_data: {
    type: DataTypes.JSONB,
    allowNull: true // Webhook data from payment gateway
  },
  receipt_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customer_details: {
    type: DataTypes.JSONB,
    allowNull: true // Customer information for payment gateway
  },
  billing_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: true // Items being paid for
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  discount_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  installment_term: {
    type: DataTypes.INTEGER,
    allowNull: true // Number of installments
  },
  installment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true // Amount per installment
  },
  auto_retry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_retry: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  next_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['appointment_id']
    },
    {
      fields: ['transaction_id'],
      unique: true
    },
    {
      fields: ['external_transaction_id']
    },
    {
      fields: ['payment_type']
    },
    {
      fields: ['payment_method']
    },
    {
      fields: ['status']
    },
    {
      fields: ['paid_at']
    },
    {
      fields: ['expired_at']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
Payment.prototype.isExpired = function() {
  if (!this.expired_at) return false;
  return new Date() > new Date(this.expired_at);
};

Payment.prototype.canBeRetried = function() {
  return this.status === 'failed' && 
         this.auto_retry && 
         this.retry_count < this.max_retry;
};

Payment.prototype.calculateNetAmount = function() {
  this.net_amount = parseFloat(this.amount) - parseFloat(this.platform_fee) - parseFloat(this.payment_gateway_fee);
  return this.net_amount;
};

Payment.prototype.markAsPaid = function(gatewayResponse = null) {
  this.status = 'completed';
  this.paid_at = new Date();
  if (gatewayResponse) {
    this.gateway_response = gatewayResponse;
  }
  return this.save();
};

Payment.prototype.markAsFailed = function(reason, gatewayResponse = null) {
  this.status = 'failed';
  this.failure_reason = reason;
  if (gatewayResponse) {
    this.gateway_response = gatewayResponse;
  }
  
  // Schedule retry if applicable
  if (this.canBeRetried()) {
    this.retry_count += 1;
    this.next_retry_at = new Date(Date.now() + (this.retry_count * 30 * 60 * 1000)); // Exponential backoff
  }
  
  return this.save();
};

Payment.prototype.processRefund = function(amount = null, reason = null) {
  const refundAmount = amount || this.amount;
  
  this.status = 'refunded';
  this.refunded_at = new Date();
  this.refund_amount = refundAmount;
  this.refund_reason = reason;
  
  return this.save();
};

Payment.prototype.generateInvoiceNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  this.invoice_number = `INV-${year}${month}${day}-${random}`;
  return this.invoice_number;
};

// Class methods
Payment.findByUser = function(userId, options = {}) {
  const { limit = 50, offset = 0, status = null, paymentType = null, startDate = null, endDate = null } = options;
  
  const whereClause = { user_id: userId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (paymentType) {
    whereClause.payment_type = paymentType;
  }
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Payment.findPendingPayments = function() {
  return this.findAll({
    where: {
      status: 'pending',
      expired_at: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    },
    order: [['createdAt', 'ASC']]
  });
};

Payment.findExpiredPayments = function() {
  return this.findAll({
    where: {
      status: 'pending',
      expired_at: {
        [sequelize.Sequelize.Op.lt]: new Date()
      }
    }
  });
};

Payment.findRetryablePayments = function() {
  return this.findAll({
    where: {
      status: 'failed',
      auto_retry: true,
      retry_count: {
        [sequelize.Sequelize.Op.lt]: sequelize.col('max_retry')
      },
      next_retry_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      }
    }
  });
};

Payment.getPaymentStats = function(startDate, endDate, userId = null) {
  const whereClause = {
    status: 'completed',
    paid_at: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    }
  };
  
  if (userId) {
    whereClause.user_id = userId;
  }
  
  return this.findAll({
    where: whereClause,
    attributes: [
      'payment_type',
      'payment_method',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
      [sequelize.fn('SUM', sequelize.col('platform_fee')), 'total_platform_fee']
    ],
    group: ['payment_type', 'payment_method']
  });
};

Payment.generateTransactionId = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

module.exports = Payment;