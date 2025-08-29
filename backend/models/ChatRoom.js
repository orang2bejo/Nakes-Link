const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true // For group chats
  },
  type: {
    type: DataTypes.ENUM('direct', 'group', 'appointment', 'emergency', 'support'),
    defaultValue: 'direct'
  },
  appointment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true // URL to room avatar
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'closed', 'suspended'),
    defaultValue: 'active'
  },
  is_encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  encryption_key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_message_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Chats',
      key: 'id'
    }
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  message_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  participant_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true // For group chats
  },
  auto_close_after: {
    type: DataTypes.INTEGER,
    allowNull: true // Auto close after X hours of inactivity
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  close_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true // Room-specific settings
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  emergency_level: {
    type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
    defaultValue: 'none'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'chat_rooms',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['appointment_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    },
    {
      fields: ['last_message_at']
    },
    {
      fields: ['last_activity_at']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['emergency_level']
    },
    {
      fields: ['closed_at']
    },
    {
      using: 'gin',
      fields: ['tags']
    }
  ]
});

// Instance methods
ChatRoom.prototype.updateLastMessage = function(messageId, messageAt = null) {
  this.last_message_id = messageId;
  this.last_message_at = messageAt || new Date();
  this.last_activity_at = new Date();
  this.message_count += 1;
  
  return this.save();
};

ChatRoom.prototype.updateParticipantCount = function(count) {
  this.participant_count = count;
  return this.save();
};

ChatRoom.prototype.closeRoom = function(userId, reason = null) {
  this.status = 'closed';
  this.closed_at = new Date();
  this.closed_by = userId;
  this.close_reason = reason;
  
  return this.save();
};

ChatRoom.prototype.archiveRoom = function() {
  this.status = 'archived';
  return this.save();
};

ChatRoom.prototype.reactivateRoom = function() {
  this.status = 'active';
  this.closed_at = null;
  this.closed_by = null;
  this.close_reason = null;
  
  return this.save();
};

ChatRoom.prototype.isActive = function() {
  return this.status === 'active';
};

ChatRoom.prototype.canAcceptNewMessages = function() {
  return ['active'].includes(this.status);
};

ChatRoom.prototype.shouldAutoClose = function() {
  if (!this.auto_close_after || this.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  const lastActivity = new Date(this.last_activity_at || this.createdAt);
  const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);
  
  return hoursDiff >= this.auto_close_after;
};

ChatRoom.prototype.updateActivity = function() {
  this.last_activity_at = new Date();
  return this.save();
};

ChatRoom.prototype.addTag = function(tag) {
  if (!this.tags) {
    this.tags = [];
  }
  
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  
  return this.save();
};

ChatRoom.prototype.removeTag = function(tag) {
  if (!this.tags) {
    return this;
  }
  
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

ChatRoom.prototype.setEmergencyLevel = function(level) {
  this.emergency_level = level;
  
  // Auto-set priority based on emergency level
  switch (level) {
    case 'critical':
      this.priority = 'urgent';
      break;
    case 'high':
      this.priority = 'high';
      break;
    case 'medium':
      this.priority = 'normal';
      break;
    default:
      this.priority = 'normal';
  }
  
  return this.save();
};

// Class methods
ChatRoom.findByParticipant = function(userId, options = {}) {
  const { status = 'active', type = null, limit = 50, offset = 0 } = options;
  
  // This would need a join with ChatRoomParticipants table
  // For now, we'll use a simplified approach
  const whereClause = {
    status: status
  };
  
  if (type) {
    whereClause.type = type;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['last_activity_at', 'DESC']],
    limit,
    offset
  });
};

ChatRoom.findByAppointment = function(appointmentId) {
  return this.findOne({
    where: {
      appointment_id: appointmentId,
      type: 'appointment'
    }
  });
};

ChatRoom.findActiveRooms = function() {
  return this.findAll({
    where: {
      status: 'active'
    },
    order: [['last_activity_at', 'DESC']]
  });
};

ChatRoom.findEmergencyRooms = function() {
  return this.findAll({
    where: {
      type: 'emergency',
      status: 'active',
      emergency_level: {
        [sequelize.Sequelize.Op.in]: ['high', 'critical']
      }
    },
    order: [['emergency_level', 'DESC'], ['createdAt', 'ASC']]
  });
};

ChatRoom.findRoomsForAutoClose = function() {
  return this.findAll({
    where: {
      status: 'active',
      auto_close_after: {
        [sequelize.Sequelize.Op.not]: null
      },
      last_activity_at: {
        [sequelize.Sequelize.Op.lte]: sequelize.literal('NOW() - INTERVAL \'1 hour\' * auto_close_after')
      }
    }
  });
};

ChatRoom.createDirectRoom = function(userId1, userId2, appointmentId = null) {
  const roomData = {
    type: appointmentId ? 'appointment' : 'direct',
    appointment_id: appointmentId,
    created_by: userId1,
    participant_count: 2,
    is_encrypted: true
  };
  
  return this.create(roomData);
};

ChatRoom.createEmergencyRoom = function(userId, emergencyLevel = 'high') {
  const roomData = {
    type: 'emergency',
    created_by: userId,
    emergency_level: emergencyLevel,
    priority: emergencyLevel === 'critical' ? 'urgent' : 'high',
    participant_count: 1,
    is_encrypted: true,
    auto_close_after: 24 // Auto close after 24 hours
  };
  
  return this.create(roomData);
};

ChatRoom.getRoomStats = function(startDate, endDate) {
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'type',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('message_count')), 'avg_messages'],
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date']
    ],
    group: ['type', 'status', sequelize.fn('DATE', sequelize.col('createdAt'))]
  });
};

module.exports = ChatRoom;