const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  room_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ChatRooms',
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'location', 'prescription', 'appointment', 'system'),
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true // [{type, url, filename, size, thumbnail}]
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true // Additional data based on message type
  },
  reply_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Chats',
      key: 'id'
    }
  },
  forwarded_from: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Chats',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed', 'deleted'),
    defaultValue: 'sent'
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pinned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pinned_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  is_important: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  delivery_status: {
    type: DataTypes.JSONB,
    allowNull: true // {user_id: {delivered_at, read_at}}
  },
  reactions: {
    type: DataTypes.JSONB,
    allowNull: true // {emoji: [user_ids]}
  },
  mentions: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true // Array of mentioned user IDs
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true // For scheduled messages
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true // For disappearing messages
  },
  encryption_key: {
    type: DataTypes.STRING,
    allowNull: true // For end-to-end encryption
  },
  is_encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  thread_id: {
    type: DataTypes.UUID,
    allowNull: true // For threaded conversations
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  auto_delete_after: {
    type: DataTypes.INTEGER,
    allowNull: true // Auto delete after X hours
  },
  deleted_for: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true // Users who deleted this message
  },
  search_vector: {
    type: DataTypes.TSVECTOR,
    allowNull: true // For full-text search
  }
}, {
  tableName: 'chats',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['message_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['reply_to']
    },
    {
      fields: ['thread_id']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['is_pinned']
    },
    {
      fields: ['priority']
    },
    {
      using: 'gin',
      fields: ['search_vector']
    },
    {
      using: 'gin',
      fields: ['mentions']
    }
  ]
});

// Instance methods
Chat.prototype.markAsRead = function(userId) {
  if (!this.delivery_status) {
    this.delivery_status = {};
  }
  
  if (!this.delivery_status[userId]) {
    this.delivery_status[userId] = {};
  }
  
  this.delivery_status[userId].read_at = new Date();
  
  // Update status if all participants have read
  // This would need room participant info
  this.status = 'read';
  
  return this.save();
};

Chat.prototype.markAsDelivered = function(userId) {
  if (!this.delivery_status) {
    this.delivery_status = {};
  }
  
  if (!this.delivery_status[userId]) {
    this.delivery_status[userId] = {};
  }
  
  this.delivery_status[userId].delivered_at = new Date();
  this.status = 'delivered';
  
  return this.save();
};

Chat.prototype.addReaction = function(userId, emoji) {
  if (!this.reactions) {
    this.reactions = {};
  }
  
  if (!this.reactions[emoji]) {
    this.reactions[emoji] = [];
  }
  
  if (!this.reactions[emoji].includes(userId)) {
    this.reactions[emoji].push(userId);
  }
  
  return this.save();
};

Chat.prototype.removeReaction = function(userId, emoji) {
  if (!this.reactions || !this.reactions[emoji]) {
    return this;
  }
  
  this.reactions[emoji] = this.reactions[emoji].filter(id => id !== userId);
  
  if (this.reactions[emoji].length === 0) {
    delete this.reactions[emoji];
  }
  
  return this.save();
};

Chat.prototype.editMessage = function(newContent, newAttachments = null) {
  this.content = newContent;
  if (newAttachments) {
    this.attachments = newAttachments;
  }
  this.is_edited = true;
  this.edited_at = new Date();
  
  return this.save();
};

Chat.prototype.pinMessage = function(userId) {
  this.is_pinned = true;
  this.pinned_at = new Date();
  this.pinned_by = userId;
  
  return this.save();
};

Chat.prototype.unpinMessage = function() {
  this.is_pinned = false;
  this.pinned_at = null;
  this.pinned_by = null;
  
  return this.save();
};

Chat.prototype.deleteForUser = function(userId) {
  if (!this.deleted_for) {
    this.deleted_for = [];
  }
  
  if (!this.deleted_for.includes(userId)) {
    this.deleted_for.push(userId);
  }
  
  return this.save();
};

Chat.prototype.isDeletedForUser = function(userId) {
  return this.deleted_for && this.deleted_for.includes(userId);
};

Chat.prototype.canBeEditedBy = function(userId) {
  // Only sender can edit within 15 minutes
  if (this.sender_id !== userId) return false;
  
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  const minutesDiff = (now - createdAt) / (1000 * 60);
  
  return minutesDiff <= 15;
};

Chat.prototype.canBeDeletedBy = function(userId) {
  // Sender can delete anytime, others can delete for themselves
  return this.sender_id === userId;
};

Chat.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > new Date(this.expires_at);
};

Chat.prototype.shouldAutoDelete = function() {
  if (!this.auto_delete_after) return false;
  
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
  
  return hoursDiff >= this.auto_delete_after;
};

// Class methods
Chat.findByRoom = function(roomId, options = {}) {
  const { limit = 50, offset = 0, beforeMessageId = null, afterMessageId = null, messageType = null, userId = null } = options;
  
  const whereClause = { room_id: roomId };
  
  if (messageType) {
    whereClause.message_type = messageType;
  }
  
  if (beforeMessageId) {
    whereClause.createdAt = {
      [sequelize.Sequelize.Op.lt]: sequelize.literal(`(SELECT created_at FROM chats WHERE id = '${beforeMessageId}')`)
    };
  }
  
  if (afterMessageId) {
    whereClause.createdAt = {
      [sequelize.Sequelize.Op.gt]: sequelize.literal(`(SELECT created_at FROM chats WHERE id = '${afterMessageId}')`)
    };
  }
  
  // Exclude messages deleted for this user
  if (userId) {
    whereClause.deleted_for = {
      [sequelize.Sequelize.Op.not]: {
        [sequelize.Sequelize.Op.contains]: [userId]
      }
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Chat.findPinnedMessages = function(roomId) {
  return this.findAll({
    where: {
      room_id: roomId,
      is_pinned: true
    },
    order: [['pinned_at', 'DESC']]
  });
};

Chat.findUnreadMessages = function(roomId, userId, lastReadAt) {
  return this.findAll({
    where: {
      room_id: roomId,
      sender_id: {
        [sequelize.Sequelize.Op.ne]: userId
      },
      createdAt: {
        [sequelize.Sequelize.Op.gt]: lastReadAt
      },
      deleted_for: {
        [sequelize.Sequelize.Op.not]: {
          [sequelize.Sequelize.Op.contains]: [userId]
        }
      }
    },
    order: [['createdAt', 'ASC']]
  });
};

Chat.searchMessages = function(roomId, searchTerm, options = {}) {
  const { limit = 20, offset = 0, messageType = null, userId = null } = options;
  
  const whereClause = {
    room_id: roomId,
    [sequelize.Sequelize.Op.or]: [
      {
        content: {
          [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
        }
      },
      {
        search_vector: {
          [sequelize.Sequelize.Op.match]: sequelize.fn('plainto_tsquery', searchTerm)
        }
      }
    ]
  };
  
  if (messageType) {
    whereClause.message_type = messageType;
  }
  
  if (userId) {
    whereClause.deleted_for = {
      [sequelize.Sequelize.Op.not]: {
        [sequelize.Sequelize.Op.contains]: [userId]
      }
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Chat.findScheduledMessages = function() {
  return this.findAll({
    where: {
      scheduled_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      status: 'sent'
    },
    order: [['scheduled_at', 'ASC']]
  });
};

Chat.findExpiredMessages = function() {
  return this.findAll({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      }
    }
  });
};

Chat.findAutoDeleteMessages = function() {
  return this.findAll({
    where: {
      auto_delete_after: {
        [sequelize.Sequelize.Op.not]: null
      },
      createdAt: {
        [sequelize.Sequelize.Op.lte]: sequelize.literal('NOW() - INTERVAL \'1 hour\' * auto_delete_after')
      }
    }
  });
};

Chat.getMessageStats = function(roomId, startDate, endDate) {
  return this.findAll({
    where: {
      room_id: roomId,
      createdAt: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'message_type',
      'sender_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date']
    ],
    group: ['message_type', 'sender_id', sequelize.fn('DATE', sequelize.col('createdAt'))]
  });
};

module.exports = Chat;