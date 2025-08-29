const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wallet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Wallets',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true // Can reference appointment_id, payment_id, etc.
  },
  reference_type: {
    type: DataTypes.ENUM('appointment', 'payment', 'topup', 'withdrawal', 'refund', 'penalty', 'bonus', 'transfer', 'adjustment'),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  balance_before: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  balance_after: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'IDR'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'reversed'),
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('earning', 'spending', 'topup', 'withdrawal', 'transfer', 'fee', 'refund', 'bonus', 'penalty', 'adjustment'),
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true // Source of the transaction (e.g., 'midtrans', 'manual', 'system')
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true // Destination for withdrawals or transfers
  },
  fee_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  net_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false // amount - fee_amount - tax_amount
  },
  external_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true // ID from external payment gateway
  },
  gateway_response: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reversed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reversal_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reversal_transaction_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'WalletTransactions',
      key: 'id'
    }
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true // {lat, lng, city, country}
  },
  device_info: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  receipt_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'wallet_transactions',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['wallet_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_id'],
      unique: true
    },
    {
      fields: ['reference_id']
    },
    {
      fields: ['reference_type']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['category']
    },
    {
      fields: ['external_transaction_id']
    },
    {
      fields: ['processed_at']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['reversal_transaction_id']
    }
  ]
});

// Instance methods
WalletTransaction.prototype.markAsCompleted = function(gatewayResponse = null) {
  this.status = 'completed';
  this.processed_at = new Date();
  if (gatewayResponse) {
    this.gateway_response = gatewayResponse;
  }
  return this.save();
};

WalletTransaction.prototype.markAsFailed = function(reason, gatewayResponse = null) {
  this.status = 'failed';
  this.failed_at = new Date();
  this.failure_reason = reason;
  if (gatewayResponse) {
    this.gateway_response = gatewayResponse;
  }
  return this.save();
};

WalletTransaction.prototype.reverse = function(reason, adminNotes = null) {
  this.status = 'reversed';
  this.reversed_at = new Date();
  this.reversal_reason = reason;
  if (adminNotes) {
    this.admin_notes = adminNotes;
  }
  
  // Create reversal transaction
  const reversalData = {
    wallet_id: this.wallet_id,
    user_id: this.user_id,
    transaction_id: WalletTransaction.generateTransactionId(),
    reference_id: this.id,
    reference_type: 'adjustment',
    type: this.type === 'credit' ? 'debit' : 'credit',
    amount: this.amount,
    balance_before: this.balance_after,
    balance_after: this.balance_before,
    currency: this.currency,
    status: 'completed',
    description: `Reversal of transaction ${this.transaction_id}: ${reason}`,
    category: 'adjustment',
    source: 'system',
    net_amount: this.net_amount,
    processed_at: new Date(),
    reversal_transaction_id: this.id
  };
  
  return Promise.all([
    this.save(),
    WalletTransaction.create(reversalData)
  ]);
};

WalletTransaction.prototype.canBeReversed = function() {
  return this.status === 'completed' && !this.reversed_at;
};

WalletTransaction.prototype.calculateNetAmount = function() {
  this.net_amount = parseFloat(this.amount) - parseFloat(this.fee_amount) - parseFloat(this.tax_amount);
  return this.net_amount;
};

// Class methods
WalletTransaction.findByWallet = function(walletId, options = {}) {
  const { limit = 50, offset = 0, type = null, category = null, status = null, startDate = null, endDate = null } = options;
  
  const whereClause = { wallet_id: walletId };
  
  if (type) {
    whereClause.type = type;
  }
  
  if (category) {
    whereClause.category = category;
  }
  
  if (status) {
    whereClause.status = status;
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

WalletTransaction.findByUser = function(userId, options = {}) {
  const { limit = 50, offset = 0, type = null, category = null, status = null, startDate = null, endDate = null } = options;
  
  const whereClause = { user_id: userId };
  
  if (type) {
    whereClause.type = type;
  }
  
  if (category) {
    whereClause.category = category;
  }
  
  if (status) {
    whereClause.status = status;
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

WalletTransaction.findPendingTransactions = function() {
  return this.findAll({
    where: {
      status: 'pending'
    },
    order: [['createdAt', 'ASC']]
  });
};

WalletTransaction.getTransactionStats = function(startDate, endDate, userId = null) {
  const whereClause = {
    status: 'completed',
    processed_at: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    }
  };
  
  if (userId) {
    whereClause.user_id = userId;
  }
  
  return this.findAll({
    where: whereClause,
    attributes: [
      'type',
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
      [sequelize.fn('SUM', sequelize.col('fee_amount')), 'total_fees'],
      [sequelize.fn('SUM', sequelize.col('net_amount')), 'total_net']
    ],
    group: ['type', 'category']
  });
};

WalletTransaction.findByReference = function(referenceId, referenceType) {
  return this.findAll({
    where: {
      reference_id: referenceId,
      reference_type: referenceType
    },
    order: [['createdAt', 'DESC']]
  });
};

WalletTransaction.generateTransactionId = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `WTX-${timestamp}-${random}`;
};

WalletTransaction.createTransaction = function(data) {
  // Auto-generate transaction ID if not provided
  if (!data.transaction_id) {
    data.transaction_id = this.generateTransactionId();
  }
  
  // Calculate net amount if not provided
  if (!data.net_amount) {
    data.net_amount = parseFloat(data.amount) - parseFloat(data.fee_amount || 0) - parseFloat(data.tax_amount || 0);
  }
  
  return this.create(data);
};

module.exports = WalletTransaction;