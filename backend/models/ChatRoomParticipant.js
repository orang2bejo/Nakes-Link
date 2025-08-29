const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatRoomParticipant = sequelize.define('ChatRoomParticipant', {
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'participant', 'observer'),
    defaultValue: 'participant'
  },
  status: {
    type: DataTypes.ENUM('active', 'left', 'removed', 'banned', 'invited'),
    defaultValue: 'active'
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_seen_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_read_message_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Chats',
      key: 'id'
    }
  },
  last_read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_typing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  typing_started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notification_settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      muted: false,
      mute_until: null,
      push_notifications: true,
      email_notifications: false,
      sound_enabled: true,
      vibration_enabled: true
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      can_send_messages: true,
      can_send_media: true,
      can_add_participants: false,
      can_remove_participants: false,
      can_edit_room_info: false,
      can_pin_messages: false,
      can_delete_messages: false
    }
  },
  added_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  removed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  removal_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true // Custom nickname in this room
  },
  custom_avatar: {
    type: DataTypes.STRING,
    allowNull: true // Custom avatar for this room
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true // Admin notes about this participant
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'chat_room_participants',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['room_id', 'user_id'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_online']
    },
    {
      fields: ['is_typing']
    },
    {
      fields: ['last_seen_at']
    },
    {
      fields: ['joined_at']
    },
    {
      fields: ['left_at']
    },
    {
      using: 'gin',
      fields: ['tags']
    }
  ]
});

// Instance methods
ChatRoomParticipant.prototype.markAsRead = function(messageId = null) {
  this.last_read_message_id = messageId;
  this.last_read_at = new Date();
  this.unread_count = 0;
  
  return this.save();
};

ChatRoomParticipant.prototype.incrementUnreadCount = function() {
  this.unread_count += 1;
  return this.save();
};

ChatRoomParticipant.prototype.resetUnreadCount = function() {
  this.unread_count = 0;
  return this.save();
};

ChatRoomParticipant.prototype.updateLastSeen = function() {
  this.last_seen_at = new Date();
  return this.save();
};

ChatRoomParticipant.prototype.setOnlineStatus = function(isOnline) {
  this.is_online = isOnline;
  
  if (isOnline) {
    this.last_seen_at = new Date();
  }
  
  return this.save();
};

ChatRoomParticipant.prototype.setTypingStatus = function(isTyping) {
  this.is_typing = isTyping;
  this.typing_started_at = isTyping ? new Date() : null;
  
  return this.save();
};

ChatRoomParticipant.prototype.leaveRoom = function(reason = null) {
  this.status = 'left';
  this.left_at = new Date();
  this.is_online = false;
  this.is_typing = false;
  
  if (reason) {
    this.removal_reason = reason;
  }
  
  return this.save();
};

ChatRoomParticipant.prototype.removeFromRoom = function(removedBy, reason = null) {
  this.status = 'removed';
  this.left_at = new Date();
  this.removed_by = removedBy;
  this.removal_reason = reason;
  this.is_online = false;
  this.is_typing = false;
  
  return this.save();
};

ChatRoomParticipant.prototype.banFromRoom = function(bannedBy, reason = null) {
  this.status = 'banned';
  this.left_at = new Date();
  this.removed_by = bannedBy;
  this.removal_reason = reason;
  this.is_online = false;
  this.is_typing = false;
  
  return this.save();
};

ChatRoomParticipant.prototype.rejoinRoom = function() {
  this.status = 'active';
  this.joined_at = new Date();
  this.left_at = null;
  this.removed_by = null;
  this.removal_reason = null;
  
  return this.save();
};

ChatRoomParticipant.prototype.updateRole = function(newRole) {
  this.role = newRole;
  
  // Update permissions based on role
  switch (newRole) {
    case 'admin':
      this.permissions = {
        can_send_messages: true,
        can_send_media: true,
        can_add_participants: true,
        can_remove_participants: true,
        can_edit_room_info: true,
        can_pin_messages: true,
        can_delete_messages: true
      };
      break;
    case 'moderator':
      this.permissions = {
        can_send_messages: true,
        can_send_media: true,
        can_add_participants: true,
        can_remove_participants: true,
        can_edit_room_info: false,
        can_pin_messages: true,
        can_delete_messages: true
      };
      break;
    case 'observer':
      this.permissions = {
        can_send_messages: false,
        can_send_media: false,
        can_add_participants: false,
        can_remove_participants: false,
        can_edit_room_info: false,
        can_pin_messages: false,
        can_delete_messages: false
      };
      break;
    default: // participant
      this.permissions = {
        can_send_messages: true,
        can_send_media: true,
        can_add_participants: false,
        can_remove_participants: false,
        can_edit_room_info: false,
        can_pin_messages: false,
        can_delete_messages: false
      };
  }
  
  return this.save();
};

ChatRoomParticipant.prototype.muteNotifications = function(muteUntil = null) {
  this.notification_settings.muted = true;
  this.notification_settings.mute_until = muteUntil;
  
  return this.save();
};

ChatRoomParticipant.prototype.unmuteNotifications = function() {
  this.notification_settings.muted = false;
  this.notification_settings.mute_until = null;
  
  return this.save();
};

ChatRoomParticipant.prototype.isActive = function() {
  return this.status === 'active';
};

ChatRoomParticipant.prototype.canSendMessages = function() {
  return this.isActive() && this.permissions.can_send_messages;
};

ChatRoomParticipant.prototype.canPerformAction = function(action) {
  if (!this.isActive()) {
    return false;
  }
  
  return this.permissions[`can_${action}`] || false;
};

ChatRoomParticipant.prototype.isNotificationMuted = function() {
  if (!this.notification_settings.muted) {
    return false;
  }
  
  if (this.notification_settings.mute_until) {
    const now = new Date();
    const muteUntil = new Date(this.notification_settings.mute_until);
    
    if (now > muteUntil) {
      // Mute period expired, unmute automatically
      this.unmuteNotifications();
      return false;
    }
  }
  
  return true;
};

ChatRoomParticipant.prototype.shouldReceiveNotification = function(notificationType = 'push') {
  if (this.isNotificationMuted()) {
    return false;
  }
  
  switch (notificationType) {
    case 'push':
      return this.notification_settings.push_notifications;
    case 'email':
      return this.notification_settings.email_notifications;
    default:
      return true;
  }
};

// Class methods
ChatRoomParticipant.findByRoom = function(roomId, options = {}) {
  const { status = 'active', role = null } = options;
  
  const whereClause = {
    room_id: roomId,
    status: status
  };
  
  if (role) {
    whereClause.role = role;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['joined_at', 'ASC']]
  });
};

ChatRoomParticipant.findByUser = function(userId, options = {}) {
  const { status = 'active', limit = 50, offset = 0 } = options;
  
  return this.findAll({
    where: {
      user_id: userId,
      status: status
    },
    order: [['joined_at', 'DESC']],
    limit,
    offset
  });
};

ChatRoomParticipant.findParticipant = function(roomId, userId) {
  return this.findOne({
    where: {
      room_id: roomId,
      user_id: userId
    }
  });
};

ChatRoomParticipant.findOnlineParticipants = function(roomId) {
  return this.findAll({
    where: {
      room_id: roomId,
      status: 'active',
      is_online: true
    }
  });
};

ChatRoomParticipant.findTypingParticipants = function(roomId) {
  return this.findAll({
    where: {
      room_id: roomId,
      status: 'active',
      is_typing: true,
      typing_started_at: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30000) // Last 30 seconds
      }
    }
  });
};

ChatRoomParticipant.addParticipant = function(roomId, userId, addedBy = null, role = 'participant') {
  return this.create({
    room_id: roomId,
    user_id: userId,
    added_by: addedBy,
    role: role,
    status: 'active',
    joined_at: new Date()
  });
};

ChatRoomParticipant.getParticipantCount = function(roomId, status = 'active') {
  return this.count({
    where: {
      room_id: roomId,
      status: status
    }
  });
};

ChatRoomParticipant.getUnreadCounts = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      status: 'active',
      unread_count: {
        [sequelize.Sequelize.Op.gt]: 0
      }
    },
    attributes: ['room_id', 'unread_count']
  });
};

ChatRoomParticipant.cleanupTypingStatus = function() {
  // Clean up typing status for participants who have been typing for more than 30 seconds
  return this.update(
    {
      is_typing: false,
      typing_started_at: null
    },
    {
      where: {
        is_typing: true,
        typing_started_at: {
          [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 30000)
        }
      }
    }
  );
};

module.exports = ChatRoomParticipant;