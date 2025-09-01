const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Rate limiting for notification endpoints
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many notification requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

// Rate limiting for bulk notifications (stricter)
const bulkNotificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 bulk requests per hour
  message: {
    error: 'Too many bulk notification requests from this IP, please try again later.',
    code: 'BULK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only allow admin users for bulk notifications
    return req.user && req.user.role === 'admin';
  }
});

// Validation middleware for different notification types
const validateNotification = {
  // Basic notification validation
  basic: [
    body('type')
      .isIn(['info', 'warning', 'error', 'success', 'appointment', 'payment', 'emergency', 'system'])
      .withMessage('Invalid notification type'),
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
    body('channels')
      .optional()
      .isArray()
      .withMessage('Channels must be an array'),
    body('channels.*')
      .optional()
      .isIn(['in_app', 'email', 'sms', 'push'])
      .withMessage('Invalid notification channel'),
    body('scheduled_at')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    body('expires_at')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format')
  ],

  // Appointment notification validation
  appointment: [
    body('appointment_id')
      .isUUID()
      .withMessage('Invalid appointment ID'),
    body('appointment_date')
      .isISO8601()
      .withMessage('Invalid appointment date'),
    body('appointment_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid appointment time format (HH:MM)'),
    body('nakes_name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Nakes name must be between 1 and 100 characters'),
    body('service_type')
      .isLength({ min: 1, max: 100 })
      .withMessage('Service type must be between 1 and 100 characters')
  ],

  // Emergency notification validation
  emergency: [
    body('emergency_id')
      .isUUID()
      .withMessage('Invalid emergency ID'),
    body('emergency_type')
      .isIn(['medical', 'accident', 'cardiac', 'respiratory', 'trauma', 'other'])
      .withMessage('Invalid emergency type'),
    body('location')
      .isObject()
      .withMessage('Location must be an object'),
    body('location.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('location.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    body('patient_name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Patient name must be between 1 and 100 characters')
  ],

  // Payment notification validation
  payment: [
    body('transaction_id')
      .isUUID()
      .withMessage('Invalid transaction ID'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('payment_method')
      .isIn(['credit_card', 'bank_transfer', 'e_wallet', 'cash'])
      .withMessage('Invalid payment method'),
    body('payment_status')
      .isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Invalid payment status')
  ],

  // System notification validation
  system: [
    body('notification_type')
      .isIn(['maintenance', 'update', 'security', 'promotion', 'announcement'])
      .withMessage('Invalid system notification type'),
    body('affected_services')
      .optional()
      .isArray()
      .withMessage('Affected services must be an array'),
    body('maintenance_schedule')
      .optional()
      .isArray()
      .withMessage('Maintenance schedule must be an array'),
    body('estimated_duration')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Estimated duration must be between 1 and 50 characters')
  ],

  // Bulk notification validation
  bulk: [
    body('notifications')
      .isArray({ min: 1, max: 100 })
      .withMessage('Notifications must be an array with 1-100 items'),
    body('notifications.*.user_id')
      .isUUID()
      .withMessage('Invalid user ID in notification'),
    body('notifications.*.type')
      .isIn(['info', 'warning', 'error', 'success', 'appointment', 'payment', 'emergency', 'system'])
      .withMessage('Invalid notification type in bulk'),
    body('notifications.*.title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('notifications.*.message')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ]
};

// Middleware to check validation results
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Middleware to check notification permissions
const checkNotificationPermissions = (req, res, next) => {
  const { user } = req;
  const { user_id } = req.body;

  // Admin can send notifications to anyone
  if (user.role === 'admin') {
    return next();
  }

  // Nakes can send notifications to their patients
  if (user.role === 'nakes') {
    // Additional check needed to verify patient relationship
    // This would require checking appointment history or patient assignments
    return next();
  }

  // Users can only send notifications to themselves
  if (user_id && user_id !== user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only send notifications to yourself',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  next();
};

// Middleware to check bulk notification permissions
const checkBulkNotificationPermissions = (req, res, next) => {
  const { user } = req;

  // Only admin can send bulk notifications
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can send bulk notifications',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Middleware to process notification queue
const processNotificationQueue = async (req, res, next) => {
  try {
    // Add notification to queue for processing
    const notificationData = {
      ...req.body,
      user_id: req.body.user_id || req.user.id,
      created_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    // Queue the notification for background processing
    await NotificationService.queueNotification(notificationData);

    // Attach queue info to request for response
    req.notificationQueued = true;
    next();
  } catch (error) {
    logger.error('Error queuing notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to queue notification',
      code: 'QUEUE_ERROR'
    });
  }
};

// Middleware to log notification activities
const logNotificationActivity = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log notification activity
    const logData = {
      user_id: req.user?.id,
      action: req.method + ' ' + req.path,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_body: req.body,
      response_status: res.statusCode,
      timestamp: new Date().toISOString()
    };

    logger.info('Notification activity:', logData);
    
    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

// Middleware to handle notification errors
const handleNotificationErrors = (error, req, res, next) => {
  logger.error('Notification error:', {
    error: error.message,
    stack: error.stack,
    user_id: req.user?.id,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Handle specific notification errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details
    });
  }

  if (error.name === 'NotificationServiceError') {
    return res.status(503).json({
      success: false,
      message: 'Notification service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  if (error.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

// Middleware to sanitize notification data
const sanitizeNotificationData = (req, res, next) => {
  if (req.body) {
    // Remove any potentially harmful fields
    delete req.body.id;
    delete req.body.created_at;
    delete req.body.updated_at;
    delete req.body.deleted_at;
    
    // Sanitize HTML content in title and message
    if (req.body.title) {
      req.body.title = req.body.title.replace(/<script[^>]*>.*?<\/script>/gi, '');
      req.body.title = req.body.title.replace(/<[^>]*>/g, '');
    }
    
    if (req.body.message) {
      req.body.message = req.body.message.replace(/<script[^>]*>.*?<\/script>/gi, '');
      // Allow basic HTML tags for formatting
      const allowedTags = /<\/?(?:b|i|u|strong|em|br|p|div|span)[^>]*>/gi;
      req.body.message = req.body.message.replace(/<(?!\/?(?:b|i|u|strong|em|br|p|div|span)\b)[^>]*>/gi, '');
    }
  }
  
  next();
};

module.exports = {
  notificationRateLimit,
  bulkNotificationRateLimit,
  validateNotification,
  checkValidationResult,
  checkNotificationPermissions,
  checkBulkNotificationPermissions,
  processNotificationQueue,
  logNotificationActivity,
  handleNotificationErrors,
  sanitizeNotificationData
};