const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM(
      'appointment_booked',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_rescheduled',
      'appointment_reminder',
      'appointment_completed',
      'payment_received',
      'payment_failed',
      'payment_refunded',
      'chat_message',
      'emergency_request',
      'emergency_response',
      'review_received',
      'profile_updated',
      'verification_approved',
      'verification_rejected',
      'wallet_credited',
      'wallet_debited',
      'withdrawal_processed',
      'system_maintenance',
      'security_alert',
      'promotional',
      'reminder',
      'other'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  short_message: {
    type: DataTypes.STRING(255),
    allowNull: true // For push notifications
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true // Additional data related to the notification
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  category: {
    type: DataTypes.ENUM('appointment', 'payment', 'chat', 'emergency', 'system', 'marketing', 'security'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  channels: {
    type: DataTypes.ARRAY(DataTypes.ENUM('in_app', 'push', 'email', 'sms', 'whatsapp')),
    defaultValue: ['in_app']
  },
  delivery_status: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      in_app: { status: 'pending', sent_at: null, delivered_at: null, error: null },
      push: { status: 'pending', sent_at: null, delivered_at: null, error: null },
      email: { status: 'pending', sent_at: null, delivered_at: null, error: null },
      sms: { status: 'pending', sent_at: null, delivered_at: null, error: null },
      whatsapp: { status: 'pending', sent_at: null, delivered_at: null, error: null }
    }
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clicked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dismissed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true // For scheduled notifications
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true // When notification expires
  },
  action_url: {
    type: DataTypes.STRING,
    allowNull: true // Deep link or URL to open when clicked
  },
  action_data: {
    type: DataTypes.JSONB,
    allowNull: true // Data for the action
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true // Image for rich notifications
  },
  icon_url: {
    type: DataTypes.STRING,
    allowNull: true // Icon for notifications
  },
  sound: {
    type: DataTypes.STRING,
    allowNull: true // Custom sound for push notifications
  },
  badge_count: {
    type: DataTypes.INTEGER,
    allowNull: true // Badge count for app icon
  },
  group_key: {
    type: DataTypes.STRING,
    allowNull: true // For grouping related notifications
  },
  collapse_key: {
    type: DataTypes.STRING,
    allowNull: true // For collapsing similar notifications
  },
  related_id: {
    type: DataTypes.UUID,
    allowNull: true // ID of related entity (appointment, payment, etc.)
  },
  related_type: {
    type: DataTypes.STRING,
    allowNull: true // Type of related entity
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  template_id: {
    type: DataTypes.STRING,
    allowNull: true // Template used for this notification
  },
  template_data: {
    type: DataTypes.JSONB,
    allowNull: true // Data for template rendering
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_retries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  last_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['read_at']
    },
    {
      fields: ['group_key']
    },
    {
      fields: ['collapse_key']
    },
    {
      fields: ['related_id', 'related_type']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['createdAt']
    },
    {
      using: 'gin',
      fields: ['channels']
    },
    {
      using: 'gin',
      fields: ['data']
    }
  ]
});

// Instance methods
Notification.prototype.markAsRead = function() {
  this.status = 'read';
  this.read_at = new Date();
  
  return this.save();
};

Notification.prototype.markAsClicked = function() {
  this.clicked_at = new Date();
  
  if (this.status === 'delivered') {
    this.status = 'read';
    this.read_at = new Date();
  }
  
  return this.save();
};

Notification.prototype.dismiss = function() {
  this.dismissed_at = new Date();
  return this.save();
};

Notification.prototype.markAsSent = function(channel = null) {
  this.status = 'sent';
  
  if (channel && this.delivery_status[channel]) {
    this.delivery_status[channel].status = 'sent';
    this.delivery_status[channel].sent_at = new Date();
  }
  
  return this.save();
};

Notification.prototype.markAsDelivered = function(channel = null) {
  this.status = 'delivered';
  
  if (channel && this.delivery_status[channel]) {
    this.delivery_status[channel].status = 'delivered';
    this.delivery_status[channel].delivered_at = new Date();
  }
  
  return this.save();
};

Notification.prototype.markAsFailed = function(error, channel = null) {
  this.status = 'failed';
  this.error_message = error;
  this.last_retry_at = new Date();
  
  if (channel && this.delivery_status[channel]) {
    this.delivery_status[channel].status = 'failed';
    this.delivery_status[channel].error = error;
  }
  
  return this.save();
};

Notification.prototype.incrementRetry = function() {
  this.retry_count += 1;
  this.last_retry_at = new Date();
  
  return this.save();
};

Notification.prototype.canRetry = function() {
  return this.retry_count < this.max_retries && 
         this.status === 'failed' &&
         (!this.expires_at || new Date() < new Date(this.expires_at));
};

Notification.prototype.isExpired = function() {
  return this.expires_at && new Date() > new Date(this.expires_at);
};

Notification.prototype.shouldSend = function() {
  if (this.isExpired()) {
    return false;
  }
  
  if (this.scheduled_at && new Date() < new Date(this.scheduled_at)) {
    return false;
  }
  
  return ['pending', 'failed'].includes(this.status) && this.canRetry();
};

Notification.prototype.isRead = function() {
  return this.status === 'read' || this.read_at !== null;
};

Notification.prototype.getDeliveryStatus = function(channel) {
  return this.delivery_status[channel] || { status: 'pending' };
};

Notification.prototype.updateDeliveryStatus = function(channel, status, error = null) {
  if (!this.delivery_status[channel]) {
    this.delivery_status[channel] = { status: 'pending', sent_at: null, delivered_at: null, error: null };
  }
  
  this.delivery_status[channel].status = status;
  
  if (status === 'sent') {
    this.delivery_status[channel].sent_at = new Date();
  } else if (status === 'delivered') {
    this.delivery_status[channel].delivered_at = new Date();
  } else if (status === 'failed') {
    this.delivery_status[channel].error = error;
  }
  
  return this.save();
};

// Class methods
Notification.findByUser = function(userId, options = {}) {
  const { 
    status = null, 
    category = null, 
    unreadOnly = false, 
    limit = 50, 
    offset = 0 
  } = options;
  
  const whereClause = {
    user_id: userId
  };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (category) {
    whereClause.category = category;
  }
  
  if (unreadOnly) {
    whereClause.read_at = null;
  }
  
  // Exclude expired notifications
  whereClause[sequelize.Sequelize.Op.or] = [
    { expires_at: null },
    { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
  ];
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.findUnread = function(userId) {
  return this.findByUser(userId, { unreadOnly: true });
};

Notification.getUnreadCount = function(userId, category = null) {
  const whereClause = {
    user_id: userId,
    read_at: null,
    [sequelize.Sequelize.Op.or]: [
      { expires_at: null },
      { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
    ]
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  return this.count({ where: whereClause });
};

Notification.findScheduled = function() {
  return this.findAll({
    where: {
      status: 'pending',
      scheduled_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      [sequelize.Sequelize.Op.or]: [
        { expires_at: null },
        { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    },
    order: [['scheduled_at', 'ASC']]
  });
};

Notification.findPendingRetries = function() {
  return this.findAll({
    where: {
      status: 'failed',
      retry_count: {
        [sequelize.Sequelize.Op.lt]: sequelize.col('max_retries')
      },
      [sequelize.Sequelize.Op.or]: [
        { expires_at: null },
        { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    }
  });
};

Notification.findExpired = function() {
  return this.findAll({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      status: {
        [sequelize.Sequelize.Op.in]: ['pending', 'sent', 'delivered']
      }
    }
  });
};

Notification.createNotification = function(data) {
  const notificationData = {
    ...data,
    scheduled_at: data.scheduled_at || new Date()
  };
  
  return this.create(notificationData);
};

Notification.createBulkNotifications = function(notifications) {
  const notificationsData = notifications.map(notification => ({
    ...notification,
    scheduled_at: notification.scheduled_at || new Date()
  }));
  
  return this.bulkCreate(notificationsData);
};

Notification.markAllAsRead = function(userId, category = null) {
  const whereClause = {
    user_id: userId,
    read_at: null
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  return this.update(
    {
      status: 'read',
      read_at: new Date()
    },
    {
      where: whereClause
    }
  );
};

Notification.cleanupExpired = function() {
  return this.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      }
    }
  });
};

Notification.getNotificationStats = function(userId, startDate, endDate) {
  return this.findAll({
    where: {
      user_id: userId,
      createdAt: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'category',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date']
    ],
    group: ['category', 'status', sequelize.fn('DATE', sequelize.col('createdAt'))]
  });
};

module.exports = Notification;