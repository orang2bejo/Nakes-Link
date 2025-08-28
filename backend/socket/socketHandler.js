const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Store active connections
const activeConnections = new Map();

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken', 'emailVerificationToken'] }
    });

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

// Main socket handler
const socketHandler = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.user.fullName} connected (${socket.id})`);
    
    // Store connection
    activeConnections.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Join Nakes to their professional room
    if (socket.user.role === 'nakes') {
      socket.join('nakes_room');
    }

    // Handle user status update
    socket.on('update_status', (data) => {
      const { status } = data;
      
      // Update connection status
      if (activeConnections.has(socket.userId)) {
        activeConnections.get(socket.userId).status = status;
      }
      
      // Broadcast status to relevant users
      socket.broadcast.emit('user_status_updated', {
        userId: socket.userId,
        status,
        timestamp: new Date()
      });
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, message, messageType = 'text' } = data;
        
        // Validate recipient
        const recipient = await User.findByPk(recipientId);
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        // Create message object
        const messageData = {
          id: Date.now().toString(),
          senderId: socket.userId,
          recipientId,
          message,
          messageType,
          timestamp: new Date(),
          status: 'sent'
        };

        // Send to recipient if online
        io.to(`user_${recipientId}`).emit('new_message', messageData);
        
        // Send confirmation to sender
        socket.emit('message_sent', messageData);
        
        // TODO: Save message to database
        console.log(`📨 Message from ${socket.user.fullName} to ${recipient.fullName}`);
        
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle appointment notifications
    socket.on('appointment_update', (data) => {
      const { appointmentId, status, recipientId } = data;
      
      // Send notification to recipient
      io.to(`user_${recipientId}`).emit('appointment_notification', {
        appointmentId,
        status,
        message: `Appointment ${status}`,
        timestamp: new Date()
      });
    });

    // Handle emergency requests
    socket.on('emergency_request', (data) => {
      const { location, urgency, description } = data;
      
      // Broadcast to all available Nakes
      socket.to('nakes_room').emit('emergency_alert', {
        patientId: socket.userId,
        patientName: socket.user.fullName,
        location,
        urgency,
        description,
        timestamp: new Date()
      });
      
      console.log(`🚨 Emergency request from ${socket.user.fullName}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { recipientId } = data;
      io.to(`user_${recipientId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.fullName
      });
    });

    socket.on('typing_stop', (data) => {
      const { recipientId } = data;
      io.to(`user_${recipientId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // Handle location sharing
    socket.on('share_location', (data) => {
      const { recipientId, latitude, longitude } = data;
      
      io.to(`user_${recipientId}`).emit('location_shared', {
        senderId: socket.userId,
        senderName: socket.user.fullName,
        latitude,
        longitude,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ User ${socket.user.fullName} disconnected (${reason})`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Broadcast offline status
      socket.broadcast.emit('user_status_updated', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.fullName}:`, error);
    });
  });

  // Utility functions
  io.getActiveConnections = () => {
    return Array.from(activeConnections.values());
  };

  io.getUserConnection = (userId) => {
    return activeConnections.get(userId);
  };

  io.isUserOnline = (userId) => {
    return activeConnections.has(userId);
  };

  io.sendToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.sendToNakes = (event, data) => {
    io.to('nakes_room').emit(event, data);
  };

  console.log('🔌 Socket.IO server initialized');
};

module.exports = socketHandler;