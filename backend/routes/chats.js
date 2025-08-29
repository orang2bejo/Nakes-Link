const express = require('express');
const { body, param, query } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for chat operations
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit file uploads
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const typingLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // 20 typing updates per 10 seconds
  message: {
    success: false,
    message: 'Too many typing updates.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer configuration for media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/chat/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else {
      uploadPath += 'documents/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, audio, video, and documents
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|ogg|mp4|webm|avi|pdf|doc|docx|txt|xlsx|xls|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/avi',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // One file at a time
  },
  fileFilter: fileFilter
});

// Validation rules
const createRoomValidation = [
  body('participant_id')
    .optional()
    .isUUID()
    .withMessage('Invalid participant ID format'),
  body('appointment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid appointment ID format'),
  body('room_type')
    .isIn(['direct', 'appointment'])
    .withMessage('Room type must be direct or appointment'),
  body('room_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters')
];

const sendMessageValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  body('message_type')
    .isIn(['text', 'image', 'audio', 'video', 'document', 'location', 'system'])
    .withMessage('Invalid message type'),
  body('reply_to')
    .optional()
    .isUUID()
    .withMessage('Invalid reply message ID format'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const editMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters')
];

const reactionValidation = [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters')
];

const typingValidation = [
  body('is_typing')
    .isBoolean()
    .withMessage('Is typing must be a boolean value')
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('message_type')
    .optional()
    .isIn(['text', 'image', 'audio', 'video', 'document', 'location'])
    .withMessage('Invalid message type'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const roomIdValidation = [
  param('roomId')
    .isUUID()
    .withMessage('Invalid room ID format')
];

const messageIdValidation = [
  param('messageId')
    .isUUID()
    .withMessage('Invalid message ID format')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('before')
    .optional()
    .isISO8601()
    .withMessage('Before must be a valid date'),
  query('after')
    .optional()
    .isISO8601()
    .withMessage('After must be a valid date')
];

// Chat room routes

/**
 * @route   POST /api/chats/rooms
 * @desc    Create or get a chat room
 * @access  Private
 */
router.post('/rooms', authenticateToken, generalLimiter, createRoomValidation, chatController.createOrGetRoom);

/**
 * @route   GET /api/chats/rooms
 * @desc    Get user's chat rooms
 * @access  Private
 */
router.get('/rooms', authenticateToken, generalLimiter, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
], chatController.getUserRooms);

/**
 * @route   GET /api/chats/rooms/:roomId
 * @desc    Get chat room details
 * @access  Private
 */
router.get('/rooms/:roomId', authenticateToken, generalLimiter, roomIdValidation, chatController.getRoomDetails);

/**
 * @route   PUT /api/chats/rooms/:roomId
 * @desc    Update chat room
 * @access  Private
 */
router.put('/rooms/:roomId', authenticateToken, generalLimiter, roomIdValidation, [
  body('room_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),
  body('is_muted')
    .optional()
    .isBoolean()
    .withMessage('Is muted must be a boolean value')
], chatController.updateRoom);

/**
 * @route   DELETE /api/chats/rooms/:roomId
 * @desc    Leave/delete chat room
 * @access  Private
 */
router.delete('/rooms/:roomId', authenticateToken, generalLimiter, roomIdValidation, chatController.leaveRoom);

// Message routes

/**
 * @route   POST /api/chats/rooms/:roomId/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/rooms/:roomId/messages', authenticateToken, messageLimiter, roomIdValidation, sendMessageValidation, chatController.sendMessage);

/**
 * @route   GET /api/chats/rooms/:roomId/messages
 * @desc    Get messages in a room
 * @access  Private
 */
router.get('/rooms/:roomId/messages', authenticateToken, generalLimiter, roomIdValidation, paginationValidation, chatController.getMessages);

/**
 * @route   PUT /api/chats/rooms/:roomId/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put('/rooms/:roomId/messages/:messageId', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, editMessageValidation, chatController.editMessage);

/**
 * @route   DELETE /api/chats/rooms/:roomId/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/rooms/:roomId/messages/:messageId', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, chatController.deleteMessage);

/**
 * @route   POST /api/chats/rooms/:roomId/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/rooms/:roomId/messages/:messageId/read', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, chatController.markMessageAsRead);

/**
 * @route   POST /api/chats/rooms/:roomId/read-all
 * @desc    Mark all messages as read in a room
 * @access  Private
 */
router.post('/rooms/:roomId/read-all', authenticateToken, generalLimiter, roomIdValidation, chatController.markAllMessagesAsRead);

// Media upload routes

/**
 * @route   POST /api/chats/rooms/:roomId/upload
 * @desc    Upload media to chat
 * @access  Private
 */
router.post('/rooms/:roomId/upload', authenticateToken, uploadLimiter, roomIdValidation, upload.single('media'), chatController.uploadMedia);

/**
 * @route   GET /api/chats/media/:filename
 * @desc    Get media file
 * @access  Private
 */
router.get('/media/:filename', authenticateToken, generalLimiter, [
  param('filename')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Filename is required')
], chatController.getMedia);

// Reaction routes

/**
 * @route   POST /api/chats/rooms/:roomId/messages/:messageId/reactions
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/rooms/:roomId/messages/:messageId/reactions', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, reactionValidation, chatController.addReaction);

/**
 * @route   DELETE /api/chats/rooms/:roomId/messages/:messageId/reactions
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/rooms/:roomId/messages/:messageId/reactions', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, reactionValidation, chatController.removeReaction);

// Typing indicator routes

/**
 * @route   POST /api/chats/rooms/:roomId/typing
 * @desc    Set typing status
 * @access  Private
 */
router.post('/rooms/:roomId/typing', authenticateToken, typingLimiter, roomIdValidation, typingValidation, chatController.setTypingStatus);

/**
 * @route   GET /api/chats/rooms/:roomId/typing
 * @desc    Get typing users in room
 * @access  Private
 */
router.get('/rooms/:roomId/typing', authenticateToken, generalLimiter, roomIdValidation, chatController.getTypingUsers);

// Search routes

/**
 * @route   GET /api/chats/search
 * @desc    Search messages across all accessible rooms
 * @access  Private
 */
router.get('/search', authenticateToken, generalLimiter, searchValidation, chatController.searchMessages);

/**
 * @route   GET /api/chats/rooms/:roomId/search
 * @desc    Search messages in a specific room
 * @access  Private
 */
router.get('/rooms/:roomId/search', authenticateToken, generalLimiter, roomIdValidation, [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('message_type')
    .optional()
    .isIn(['text', 'image', 'audio', 'video', 'document', 'location'])
    .withMessage('Invalid message type'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], chatController.searchRoomMessages);

// Statistics routes

/**
 * @route   GET /api/chats/stats
 * @desc    Get chat statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, generalLimiter, [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('room_id')
    .optional()
    .isUUID()
    .withMessage('Invalid room ID format')
], chatController.getChatStats);

// Room participants routes

/**
 * @route   GET /api/chats/rooms/:roomId/participants
 * @desc    Get room participants
 * @access  Private
 */
router.get('/rooms/:roomId/participants', authenticateToken, generalLimiter, roomIdValidation, chatController.getRoomParticipants);

/**
 * @route   POST /api/chats/rooms/:roomId/participants
 * @desc    Add participant to room (for group chats)
 * @access  Private
 */
router.post('/rooms/:roomId/participants', authenticateToken, generalLimiter, roomIdValidation, [
  body('user_id')
    .isUUID()
    .withMessage('Invalid user ID format')
], chatController.addParticipant);

/**
 * @route   DELETE /api/chats/rooms/:roomId/participants/:userId
 * @desc    Remove participant from room
 * @access  Private
 */
router.delete('/rooms/:roomId/participants/:userId', authenticateToken, generalLimiter, roomIdValidation, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
], chatController.removeParticipant);

// Message forwarding

/**
 * @route   POST /api/chats/rooms/:roomId/messages/:messageId/forward
 * @desc    Forward a message to another room
 * @access  Private
 */
router.post('/rooms/:roomId/messages/:messageId/forward', authenticateToken, generalLimiter, roomIdValidation, messageIdValidation, [
  body('target_room_id')
    .isUUID()
    .withMessage('Invalid target room ID format'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters')
], chatController.forwardMessage);

// Message export

/**
 * @route   GET /api/chats/rooms/:roomId/export
 * @desc    Export chat history
 * @access  Private
 */
router.get('/rooms/:roomId/export', authenticateToken, generalLimiter, roomIdValidation, [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'txt'])
    .withMessage('Format must be json, csv, or txt'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
], chatController.exportChatHistory);

// Unread count

/**
 * @route   GET /api/chats/unread-count
 * @desc    Get total unread messages count
 * @access  Private
 */
router.get('/unread-count', authenticateToken, generalLimiter, chatController.getUnreadCount);

/**
 * @route   GET /api/chats/rooms/:roomId/unread-count
 * @desc    Get unread messages count for a specific room
 * @access  Private
 */
router.get('/rooms/:roomId/unread-count', authenticateToken, generalLimiter, roomIdValidation, chatController.getRoomUnreadCount);

module.exports = router;