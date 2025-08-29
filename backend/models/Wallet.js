const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  pending_balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  frozen_balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_earned: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_spent: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_withdrawn: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'IDR'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'frozen', 'closed'),
    defaultValue: 'active'
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: true // Hashed PIN for wallet transactions
  },
  pin_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pin_locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  auto_withdrawal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auto_withdrawal_threshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  withdrawal_account: {
    type: DataTypes.JSONB,
    allowNull: true // {bank_name, account_number, account_name}
  },
  last_transaction_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verification_level: {
    type: DataTypes.ENUM('basic', 'verified', 'premium'),
    defaultValue: 'basic'
  },
  daily_limit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  monthly_limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  daily_spent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  monthly_spent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  last_daily_reset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_monthly_reset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  low_balance_threshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 50000 // IDR
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['verification_level']
    },
    {
      fields: ['last_transaction_at']
    }
  ]
});

// Instance methods
Wallet.prototype.getAvailableBalance = function() {
  return parseFloat(this.balance) - parseFloat(this.frozen_balance);
};

Wallet.prototype.isPinLocked = function() {
  if (!this.pin_locked_until) return false;
  return new Date() < new Date(this.pin_locked_until);
};

Wallet.prototype.canWithdraw = function(amount) {
  if (this.status !== 'active') return false;
  if (this.isPinLocked()) return false;
  if (this.getAvailableBalance() < amount) return false;
  if (amount < parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || 50000)) return false;
  
  // Check daily and monthly limits
  this.resetLimitsIfNeeded();
  
  if (this.daily_limit && (parseFloat(this.daily_spent) + amount) > parseFloat(this.daily_limit)) {
    return false;
  }
  
  if (this.monthly_limit && (parseFloat(this.monthly_spent) + amount) > parseFloat(this.monthly_limit)) {
    return false;
  }
  
  return true;
};

Wallet.prototype.canSpend = function(amount) {
  if (this.status !== 'active') return false;
  if (this.getAvailableBalance() < amount) return false;
  
  // Check daily and monthly limits
  this.resetLimitsIfNeeded();
  
  if (this.daily_limit && (parseFloat(this.daily_spent) + amount) > parseFloat(this.daily_limit)) {
    return false;
  }
  
  if (this.monthly_limit && (parseFloat(this.monthly_spent) + amount) > parseFloat(this.monthly_limit)) {
    return false;
  }
  
  return true;
};

Wallet.prototype.addBalance = function(amount, description = 'Balance added') {
  if (amount <= 0) throw new Error('Amount must be positive');
  
  this.balance = parseFloat(this.balance) + parseFloat(amount);
  this.total_earned = parseFloat(this.total_earned) + parseFloat(amount);
  this.last_transaction_at = new Date();
  
  return this.save();
};

Wallet.prototype.deductBalance = function(amount, description = 'Balance deducted') {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (!this.canSpend(amount)) throw new Error('Insufficient balance or limit exceeded');
  
  this.balance = parseFloat(this.balance) - parseFloat(amount);
  this.total_spent = parseFloat(this.total_spent) + parseFloat(amount);
  this.daily_spent = parseFloat(this.daily_spent) + parseFloat(amount);
  this.monthly_spent = parseFloat(this.monthly_spent) + parseFloat(amount);
  this.last_transaction_at = new Date();
  
  return this.save();
};

Wallet.prototype.freezeBalance = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (this.getAvailableBalance() < amount) throw new Error('Insufficient available balance');
  
  this.frozen_balance = parseFloat(this.frozen_balance) + parseFloat(amount);
  
  return this.save();
};

Wallet.prototype.unfreezeBalance = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (parseFloat(this.frozen_balance) < amount) throw new Error('Insufficient frozen balance');
  
  this.frozen_balance = parseFloat(this.frozen_balance) - parseFloat(amount);
  
  return this.save();
};

Wallet.prototype.transferFrozenToBalance = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (parseFloat(this.frozen_balance) < amount) throw new Error('Insufficient frozen balance');
  
  this.frozen_balance = parseFloat(this.frozen_balance) - parseFloat(amount);
  this.balance = parseFloat(this.balance) + parseFloat(amount);
  
  return this.save();
};

Wallet.prototype.addToPending = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  
  this.pending_balance = parseFloat(this.pending_balance) + parseFloat(amount);
  
  return this.save();
};

Wallet.prototype.transferPendingToBalance = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (parseFloat(this.pending_balance) < amount) throw new Error('Insufficient pending balance');
  
  this.pending_balance = parseFloat(this.pending_balance) - parseFloat(amount);
  this.balance = parseFloat(this.balance) + parseFloat(amount);
  this.total_earned = parseFloat(this.total_earned) + parseFloat(amount);
  this.last_transaction_at = new Date();
  
  return this.save();
};

Wallet.prototype.resetLimitsIfNeeded = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Reset daily limit
  if (!this.last_daily_reset || new Date(this.last_daily_reset) < today) {
    this.daily_spent = 0;
    this.last_daily_reset = today;
  }
  
  // Reset monthly limit
  if (!this.last_monthly_reset || new Date(this.last_monthly_reset) < thisMonth) {
    this.monthly_spent = 0;
    this.last_monthly_reset = thisMonth;
  }
};

Wallet.prototype.incrementPinAttempts = function() {
  this.pin_attempts += 1;
  
  if (this.pin_attempts >= 3) {
    this.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
  
  return this.save();
};

Wallet.prototype.resetPinAttempts = function() {
  this.pin_attempts = 0;
  this.pin_locked_until = null;
  
  return this.save();
};

Wallet.prototype.isLowBalance = function() {
  return parseFloat(this.balance) <= parseFloat(this.low_balance_threshold);
};

// Class methods
Wallet.findByUserId = function(userId) {
  return this.findOne({
    where: { user_id: userId }
  });
};

Wallet.createForUser = function(userId, initialBalance = 0) {
  return this.create({
    user_id: userId,
    balance: initialBalance
  });
};

Wallet.findLowBalanceWallets = function() {
  return this.findAll({
    where: {
      status: 'active',
      notifications_enabled: true,
      balance: {
        [sequelize.Sequelize.Op.lte]: sequelize.col('low_balance_threshold')
      }
    }
  });
};

Wallet.findAutoWithdrawalWallets = function() {
  return this.findAll({
    where: {
      status: 'active',
      auto_withdrawal: true,
      balance: {
        [sequelize.Sequelize.Op.gte]: sequelize.col('auto_withdrawal_threshold')
      }
    }
  });
};

Wallet.getTotalSystemBalance = function() {
  return this.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('balance')), 'total_balance'],
      [sequelize.fn('SUM', sequelize.col('pending_balance')), 'total_pending'],
      [sequelize.fn('SUM', sequelize.col('frozen_balance')), 'total_frozen'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_wallets']
    ],
    where: {
      status: 'active'
    }
  });
};

module.exports = Wallet;