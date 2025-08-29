const { Chat, ChatRoom, ChatRoomParticipant, User, Appointment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { sendNotification } = require('../services/notificationService');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
const { io } = require('../socket/socketManager');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/chat');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `chat-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|mp4|wav|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Create or get chat room
exports.createOrGetChatRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      participant_id,
      appointment_id,
      room_type = 'direct',
      name,
      description
    } = req.body;

    const user_id = req.user.id;

    let chatRoom;

    if (room_type === 'direct') {
      // Check if direct room already exists
      chatRoom = await ChatRoom.findDirectRoom(user_id, participant_id);
      
      if (!chatRoom) {
        // Create new direct room
        chatRoom = await ChatRoom.createDirectRoom(user_id, participant_id);
      }
    } else if (room_type === 'appointment' && appointment_id) {
      // Check if appointment room already exists
      chatRoom = await ChatRoom.findOne({
        where: {
          appointment_id,
          type: 'appointment'
        }
      });

      if (!chatRoom) {
        // Verify appointment exists and user is participant
        const appointment = await Appointment.findOne({
          where: {
            id: appointment_id,
            [Op.or]: [
              { patient_id: user_id },
              { nakes_id: user_id }
            ]
          }
        });

        if (!appointment) {
          return res.status(404).json({
            success: false,
            message: 'Appointment not found or access denied'
          });
        }

        // Create appointment room
        chatRoom = await ChatRoom.create({
          name: name || `Appointment Chat - ${appointment.id}`,
          type: 'appointment',
          appointment_id,
          creator_id: user_id,
          description: description || 'Chat room for appointment discussion',
          status: 'active'
        });

        // Add participants
        await Promise.all([
          ChatRoomParticipant.addParticipant(chatRoom.id, appointment.patient_id, 'member'),
          ChatRoomParticipant.addParticipant(chatRoom.id, appointment.nakes_id, 'member')
        ]);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid room type or missing required parameters'
      });
    }

    // Load room with participants
    const roomWithParticipants = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: ChatRoomParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'full_name', 'avatar_url', 'role']
            }
          ]
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Chat room created or retrieved successfully',
      data: { chat_room: roomWithParticipants }
    });

  } catch (error) {
    console.error('Create or get chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's chat rooms
exports.getChatRooms = async (req, res) => {
  try {
    const {
      type,
      status = 'active',
      page = 1,
      limit = 20
    } = req.query;

    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = { status };
    if (type) {
      whereClause.type = type;
    }

    const rooms = await ChatRoom.findAndCountAll({
      include: [
        {
          model: ChatRoomParticipant,
          as: 'participants',
          where: { user_id },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'full_name', 'avatar_url', 'role']
            }
          ]
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date', 'status']
        }
      ],
      where: whereClause,
      order: [['last_activity_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        chat_rooms: rooms.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(rooms.count / limit),
          total_items: rooms.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      room_id,
      content,
      message_type = 'text',
      reply_to_id,
      metadata
    } = req.body;

    const sender_id = req.user.id;

    // Verify user is participant in the room
    const participant = await ChatRoomParticipant.findOne({
      where: {
        room_id,
        user_id: sender_id,
        status: 'active'
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room'
      });
    }

    // Verify room is active
    const room = await ChatRoom.findByPk(room_id);
    if (!room || room.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or inactive'
      });
    }

    // Encrypt message content
    const encryptedContent = content ? encryptMessage(content) : null;

    // Create message
    const message = await Chat.create({
      room_id,
      sender_id,
      message_type,
      content: encryptedContent,
      reply_to_id,
      metadata,
      status: 'sent'
    });

    // Update room last activity
    await room.updateLastMessage(message.id, content, sender_id);
    await room.updateActivity();

    // Update participant last seen
    await participant.updateLastSeen();

    // Load message with sender info
    const messageWithSender = await Chat.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name', 'avatar_url', 'role']
        },
        {
          model: Chat,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'full_name']
            }
          ]
        }
      ]
    });

    // Decrypt content for response
    const messageData = messageWithSender.toJSON();
    if (messageData.content) {
      messageData.content = decryptMessage(messageData.content);
    }
    if (messageData.replyTo && messageData.replyTo.content) {
      messageData.replyTo.content = decryptMessage(messageData.replyTo.content);
    }

    // Emit to room participants via WebSocket
    io.to(`room_${room_id}`).emit('new_message', messageData);

    // Send push notifications to other participants
    const otherParticipants = await ChatRoomParticipant.findAll({
      where: {
        room_id,
        user_id: { [Op.ne]: sender_id },
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name']
        }
      ]
    });

    for (const participant of otherParticipants) {
      await sendNotification({
        user_id: participant.user_id,
        type: 'new_message',
        title: `New message from ${req.user.full_name}`,
        message: message_type === 'text' ? content : `Sent a ${message_type}`,
        data: {
          room_id,
          message_id: message.id,
          sender_name: req.user.full_name
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageData }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get messages in a room
exports.getMessages = async (req, res) => {
  try {
    const { room_id } = req.params;
    const {
      page = 1,
      limit = 50,
      before_id,
      after_id
    } = req.query;

    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    // Verify user is participant in the room
    const participant = await ChatRoomParticipant.findOne({
      where: {
        room_id,
        user_id,
        status: 'active'
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room'
      });
    }

    let whereClause = {
      room_id,
      status: { [Op.ne]: 'deleted' }
    };

    if (before_id) {
      whereClause.id = { [Op.lt]: before_id };
    } else if (after_id) {
      whereClause.id = { [Op.gt]: after_id };
    }

    const messages = await Chat.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name', 'avatar_url', 'role']
        },
        {
          model: Chat,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'full_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Decrypt messages
    const decryptedMessages = messages.rows.map(message => {
      const messageData = message.toJSON();
      if (messageData.content) {
        try {
          messageData.content = decryptMessage(messageData.content);
        } catch (decryptError) {
          console.error('Message decryption error:', decryptError);
          messageData.content = '[Encrypted message]';
        }
      }
      if (messageData.replyTo && messageData.replyTo.content) {
        try {
          messageData.replyTo.content = decryptMessage(messageData.replyTo.content);
        } catch (decryptError) {
          messageData.replyTo.content = '[Encrypted message]';
        }
      }
      return messageData;
    });

    // Mark messages as read
    await Chat.update(
      { status: 'read' },
      {
        where: {
          room_id,
          sender_id: { [Op.ne]: user_id },
          status: { [Op.in]: ['sent', 'delivered'] }
        }
      }
    );

    // Update participant's last read message
    if (decryptedMessages.length > 0) {
      await participant.markAsRead(decryptedMessages[0].id);
    }

    res.json({
      success: true,
      data: {
        messages: decryptedMessages.reverse(), // Reverse to show oldest first
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(messages.count / limit),
          total_items: messages.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload file/media
exports.uploadMedia = [upload.single('media'), async (req, res) => {
  try {
    const { room_id, caption } = req.body;
    const sender_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify user is participant in the room
    const participant = await ChatRoomParticipant.findOne({
      where: {
        room_id,
        user_id: sender_id,
        status: 'active'
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room'
      });
    }

    // Determine message type based on file
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    }

    // Create attachment metadata
    const attachmentData = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/chat/${req.file.filename}`
    };

    // Create message
    const message = await Chat.create({
      room_id,
      sender_id,
      message_type: messageType,
      content: caption ? encryptMessage(caption) : null,
      attachments: [attachmentData],
      status: 'sent'
    });

    // Update room last activity
    const room = await ChatRoom.findByPk(room_id);
    await room.updateLastMessage(message.id, `Sent a ${messageType}`, sender_id);
    await room.updateActivity();

    // Load message with sender info
    const messageWithSender = await Chat.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name', 'avatar_url', 'role']
        }
      ]
    });

    // Decrypt content for response
    const messageData = messageWithSender.toJSON();
    if (messageData.content) {
      messageData.content = decryptMessage(messageData.content);
    }

    // Emit to room participants
    io.to(`room_${room_id}`).emit('new_message', messageData);

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      data: { message: messageData }
    });

  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    // Find message
    const message = await Chat.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can edit this message
    if (message.sender_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if message is editable
    if (!message.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be edited (too old or wrong type)'
      });
    }

    // Update message
    await message.editMessage(content);

    // Load updated message
    const updatedMessage = await Chat.findByPk(message_id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name', 'avatar_url', 'role']
        }
      ]
    });

    // Decrypt content for response
    const messageData = updatedMessage.toJSON();
    if (messageData.content) {
      messageData.content = decryptMessage(messageData.content);
    }

    // Emit update to room participants
    io.to(`room_${message.room_id}`).emit('message_edited', messageData);

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: { message: messageData }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { delete_for_everyone = false } = req.body;
    const user_id = req.user.id;

    // Find message
    const message = await Chat.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    if (message.sender_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    if (delete_for_everyone) {
      // Check if message can be deleted for everyone
      if (!message.canDelete()) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be deleted for everyone (too old)'
        });
      }

      // Delete for everyone
      await message.update({
        status: 'deleted',
        content: null,
        deleted_at: new Date()
      });

      // Emit deletion to room participants
      io.to(`room_${message.room_id}`).emit('message_deleted', {
        message_id,
        deleted_for_everyone: true
      });
    } else {
      // Delete for user only
      await message.deleteForUser(user_id);
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { emoji } = req.body;
    const user_id = req.user.id;

    // Find message
    const message = await Chat.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is participant in the room
    const participant = await ChatRoomParticipant.findOne({
      where: {
        room_id: message.room_id,
        user_id,
        status: 'active'
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room'
      });
    }

    // Add reaction
    await message.addReaction(user_id, emoji);

    // Load updated message
    const updatedMessage = await Chat.findByPk(message_id);

    // Emit reaction update
    io.to(`room_${message.room_id}`).emit('reaction_added', {
      message_id,
      user_id,
      emoji,
      reactions: updatedMessage.reactions
    });

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: { reactions: updatedMessage.reactions }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { emoji } = req.body;
    const user_id = req.user.id;

    // Find message
    const message = await Chat.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove reaction
    await message.removeReaction(user_id, emoji);

    // Load updated message
    const updatedMessage = await Chat.findByPk(message_id);

    // Emit reaction update
    io.to(`room_${message.room_id}`).emit('reaction_removed', {
      message_id,
      user_id,
      emoji,
      reactions: updatedMessage.reactions
    });

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: { reactions: updatedMessage.reactions }
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Set typing status
exports.setTypingStatus = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { is_typing } = req.body;
    const user_id = req.user.id;

    // Verify user is participant in the room
    const participant = await ChatRoomParticipant.findOne({
      where: {
        room_id,
        user_id,
        status: 'active'
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room'
      });
    }

    // Update typing status
    await participant.setTypingStatus(is_typing);

    // Emit typing status to other participants
    io.to(`room_${room_id}`).emit('typing_status', {
      user_id,
      user_name: req.user.full_name,
      is_typing
    });

    res.json({
      success: true,
      message: 'Typing status updated'
    });

  } catch (error) {
    console.error('Set typing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const {
      query,
      room_id,
      message_type,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long'
      });
    }

    // Get user's accessible rooms
    const userRooms = await ChatRoomParticipant.findAll({
      where: {
        user_id,
        status: 'active'
      },
      attributes: ['room_id']
    });

    const roomIds = userRooms.map(p => p.room_id);

    let whereClause = {
      room_id: { [Op.in]: roomIds },
      status: { [Op.ne]: 'deleted' }
    };

    if (room_id) {
      whereClause.room_id = room_id;
    }

    if (message_type) {
      whereClause.message_type = message_type;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Use full-text search if available
    const messages = await Chat.searchMessages(query, whereClause, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(messages.count / limit),
          total_items: messages.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get chat statistics
exports.getChatStats = async (req, res) => {
  try {
    const { room_id, start_date, end_date } = req.query;
    const user_id = req.user.id;

    let whereClause = {};

    if (room_id) {
      // Verify user is participant in the room
      const participant = await ChatRoomParticipant.findOne({
        where: {
          room_id,
          user_id,
          status: 'active'
        }
      });

      if (!participant) {
        return res.status(403).json({
          success: false,
          message: 'You are not a participant in this chat room'
        });
      }

      whereClause.room_id = room_id;
    } else {
      // Get user's accessible rooms
      const userRooms = await ChatRoomParticipant.findAll({
        where: {
          user_id,
          status: 'active'
        },
        attributes: ['room_id']
      });

      whereClause.room_id = { [Op.in]: userRooms.map(p => p.room_id) };
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const [totalMessages, messagesByType, messagesByUser] = await Promise.all([
      Chat.count({ where: whereClause }),
      Chat.findAll({
        where: whereClause,
        attributes: [
          'message_type',
          [Chat.sequelize.fn('COUNT', Chat.sequelize.col('id')), 'count']
        ],
        group: ['message_type']
      }),
      Chat.findAll({
        where: whereClause,
        attributes: [
          'sender_id',
          [Chat.sequelize.fn('COUNT', Chat.sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['full_name']
          }
        ],
        group: ['sender_id', 'sender.id'],
        order: [[Chat.sequelize.fn('COUNT', Chat.sequelize.col('Chat.id')), 'DESC']],
        limit: 10
      })
    ]);

    const stats = {
      total_messages: totalMessages,
      messages_by_type: messagesByType.reduce((acc, item) => {
        acc[item.message_type] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      top_users: messagesByUser.map(item => ({
        user_id: item.sender_id,
        user_name: item.sender.full_name,
        message_count: parseInt(item.dataValues.count)
      }))
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};