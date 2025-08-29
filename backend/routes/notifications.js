const express = require('express');
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const notificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit notification creation
  message: {
    success: false,
    message: 'Too many notification requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const bulkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit bulk operations
  message: {
    success: false,
    message: 'Too many bulk operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation rules
const notificationQueryValidation = [
  query('type')
    .optional()
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  query('status')
    .optional()
    .isIn(['unread', 'read', 'clicked', 'dismissed'])
    .withMessage('Invalid notification status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid notification priority'),
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

const createNotificationValidation = [
  body('recipient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid recipient ID format'),
  body('recipient_ids')
    .optional()
    .isArray()
    .withMessage('Recipient IDs must be an array'),
  body('recipient_ids.*')
    .optional()
    .isUUID()
    .withMessage('Each recipient ID must be a valid UUID'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('type')
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid notification priority'),
  body('action_url')
    .optional()
    .isURL()
    .withMessage('Action URL must be a valid URL'),
  body('action_data')
    .optional()
    .isObject()
    .withMessage('Action data must be an object'),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Scheduled at must be a valid date'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date'),
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array'),
  body('channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('Invalid notification channel'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const bulkNotificationValidation = [
  body('notifications')
    .isArray({ min: 1, max: 100 })
    .withMessage('Notifications must be an array with 1-100 items'),
  body('notifications.*.recipient_id')
    .isUUID()
    .withMessage('Each notification must have a valid recipient ID'),
  body('notifications.*.title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each title must be between 1 and 200 characters'),
  body('notifications.*.message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Each message must be between 1 and 1000 characters'),
  body('notifications.*.type')
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Each notification must have a valid type'),
  body('notifications.*.priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Each priority must be valid'),
  body('notifications.*.action_url')
    .optional()
    .isURL()
    .withMessage('Each action URL must be valid'),
  body('notifications.*.scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Each scheduled date must be valid'),
  body('notifications.*.expires_at')
    .optional()
    .isISO8601()
    .withMessage('Each expiry date must be valid')
];

const sendImmediateValidation = [
  body('recipient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid recipient ID format'),
  body('recipient_ids')
    .optional()
    .isArray()
    .withMessage('Recipient IDs must be an array'),
  body('recipient_ids.*')
    .optional()
    .isUUID()
    .withMessage('Each recipient ID must be a valid UUID'),
  body('user_type')
    .optional()
    .isIn(['patient', 'nakes', 'admin'])
    .withMessage('Invalid user type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('channels')
    .isArray({ min: 1 })
    .withMessage('At least one channel must be specified'),
  body('channels.*')
    .isIn(['push', 'email', 'sms'])
    .withMessage('Invalid notification channel'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid notification priority'),
  body('action_url')
    .optional()
    .isURL()
    .withMessage('Action URL must be a valid URL'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const preferencesValidation = [
  body('push_enabled')
    .optional()
    .isBoolean()
    .withMessage('Push enabled must be a boolean'),
  body('email_enabled')
    .optional()
    .isBoolean()
    .withMessage('Email enabled must be a boolean'),
  body('sms_enabled')
    .optional()
    .isBoolean()
    .withMessage('SMS enabled must be a boolean'),
  body('appointment_notifications')
    .optional()
    .isBoolean()
    .withMessage('Appointment notifications must be a boolean'),
  body('payment_notifications')
    .optional()
    .isBoolean()
    .withMessage('Payment notifications must be a boolean'),
  body('chat_notifications')
    .optional()
    .isBoolean()
    .withMessage('Chat notifications must be a boolean'),
  body('review_notifications')
    .optional()
    .isBoolean()
    .withMessage('Review notifications must be a boolean'),
  body('system_notifications')
    .optional()
    .isBoolean()
    .withMessage('System notifications must be a boolean'),
  body('promotion_notifications')
    .optional()
    .isBoolean()
    .withMessage('Promotion notifications must be a boolean'),
  body('reminder_notifications')
    .optional()
    .isBoolean()
    .withMessage('Reminder notifications must be a boolean'),
  body('quiet_hours')
    .optional()
    .isObject()
    .withMessage('Quiet hours must be an object'),
  body('quiet_hours.enabled')
    .optional()
    .isBoolean()
    .withMessage('Quiet hours enabled must be a boolean'),
  body('quiet_hours.start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('quiet_hours.end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

const notificationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID format')
];

// User notification routes

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticateToken, generalLimiter, notificationQueryValidation, notificationController.getNotifications);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get a single notification
 * @access  Private
 */
router.get('/:id', authenticateToken, generalLimiter, notificationIdValidation, notificationController.getNotification);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticateToken, generalLimiter, notificationIdValidation, notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/:id/clicked
 * @desc    Mark notification as clicked
 * @access  Private
 */
router.put('/:id/clicked', authenticateToken, generalLimiter, notificationIdValidation, notificationController.markAsClicked);

/**
 * @route   PUT /api/notifications/:id/dismiss
 * @desc    Dismiss notification
 * @access  Private
 */
router.put('/:id/dismiss', authenticateToken, generalLimiter, notificationIdValidation, notificationController.dismissNotification);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticateToken, generalLimiter, notificationController.markAllAsRead);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticateToken, generalLimiter, notificationController.getUnreadCount);

// Notification preferences routes

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', authenticateToken, generalLimiter, notificationController.getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', authenticateToken, generalLimiter, preferencesValidation, notificationController.updatePreferences);

// Admin notification management routes

/**
 * @route   POST /api/notifications/admin/create
 * @desc    Create a notification (admin)
 * @access  Private (Admin)
 */
router.post('/admin/create', authenticateToken, requireRole('admin'), notificationLimiter, createNotificationValidation, notificationController.createNotification);

/**
 * @route   POST /api/notifications/admin/bulk-create
 * @desc    Create multiple notifications (admin)
 * @access  Private (Admin)
 */
router.post('/admin/bulk-create', authenticateToken, requireRole('admin'), bulkLimiter, bulkNotificationValidation, notificationController.createBulkNotifications);

/**
 * @route   POST /api/notifications/admin/send-immediate
 * @desc    Send immediate notification (admin)
 * @access  Private (Admin)
 */
router.post('/admin/send-immediate', authenticateToken, requireRole('admin'), notificationLimiter, sendImmediateValidation, notificationController.sendImmediateNotification);

/**
 * @route   GET /api/notifications/admin/all
 * @desc    Get all notifications (admin)
 * @access  Private (Admin)
 */
router.get('/admin/all', authenticateToken, requireRole('admin'), generalLimiter, [
  query('recipient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid recipient ID format'),
  query('type')
    .optional()
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  query('status')
    .optional()
    .isIn(['pending', 'sent', 'delivered', 'failed', 'expired'])
    .withMessage('Invalid notification status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid notification priority'),
  query('channel')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('Invalid notification channel'),
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
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], notificationController.getAllNotificationsAdmin);

/**
 * @route   GET /api/notifications/admin/stats
 * @desc    Get notification statistics (admin)
 * @access  Private (Admin)
 */
router.get('/admin/stats', authenticateToken, requireRole('admin'), generalLimiter, [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('type')
    .optional()
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  query('channel')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('Invalid notification channel')
], notificationController.getNotificationStatsAdmin);

/**
 * @route   PUT /api/notifications/admin/:id
 * @desc    Update notification (admin)
 * @access  Private (Admin)
 */
router.put('/admin/:id', authenticateToken, requireRole('admin'), generalLimiter, notificationIdValidation, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid notification priority'),
  body('action_url')
    .optional()
    .isURL()
    .withMessage('Action URL must be a valid URL'),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Scheduled at must be a valid date'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
], notificationController.updateNotificationAdmin);

/**
 * @route   DELETE /api/notifications/admin/:id
 * @desc    Delete notification (admin)
 * @access  Private (Admin)
 */
router.delete('/admin/:id', authenticateToken, requireRole('admin'), generalLimiter, notificationIdValidation, notificationController.deleteNotificationAdmin);

/**
 * @route   POST /api/notifications/admin/cleanup
 * @desc    Clean up expired notifications (admin)
 * @access  Private (Admin)
 */
router.post('/admin/cleanup', authenticateToken, requireRole('admin'), generalLimiter, [
  body('days_old')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days old must be between 1 and 365'),
  body('status')
    .optional()
    .isIn(['read', 'dismissed', 'expired', 'failed'])
    .withMessage('Invalid status for cleanup')
], notificationController.cleanupNotificationsAdmin);

/**
 * @route   POST /api/notifications/admin/retry-failed
 * @desc    Retry failed notifications (admin)
 * @access  Private (Admin)
 */
router.post('/admin/retry-failed', authenticateToken, requireRole('admin'), generalLimiter, [
  body('notification_ids')
    .optional()
    .isArray()
    .withMessage('Notification IDs must be an array'),
  body('notification_ids.*')
    .optional()
    .isUUID()
    .withMessage('Each notification ID must be a valid UUID'),
  body('max_retries')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Max retries must be between 1 and 5'),
  body('retry_after_hours')
    .optional()
    .isInt({ min: 1, max: 72 })
    .withMessage('Retry after hours must be between 1 and 72')
], notificationController.retryFailedNotificationsAdmin);

// Template management routes (admin)

/**
 * @route   GET /api/notifications/admin/templates
 * @desc    Get notification templates (admin)
 * @access  Private (Admin)
 */
router.get('/admin/templates', authenticateToken, requireRole('admin'), generalLimiter, [
  query('type')
    .optional()
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], notificationController.getNotificationTemplatesAdmin);

/**
 * @route   POST /api/notifications/admin/templates
 * @desc    Create notification template (admin)
 * @access  Private (Admin)
 */
router.post('/admin/templates', authenticateToken, requireRole('admin'), generalLimiter, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be between 1 and 100 characters'),
  body('type')
    .isIn(['appointment', 'payment', 'chat', 'review', 'system', 'promotion', 'reminder'])
    .withMessage('Invalid notification type'),
  body('title_template')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title template must be between 1 and 200 characters'),
  body('message_template')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message template must be between 1 and 1000 characters'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  body('default_priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid default priority'),
  body('default_channels')
    .optional()
    .isArray()
    .withMessage('Default channels must be an array'),
  body('default_channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('Invalid default channel'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean')
], notificationController.createNotificationTemplateAdmin);

/**
 * @route   PUT /api/notifications/admin/templates/:id
 * @desc    Update notification template (admin)
 * @access  Private (Admin)
 */
router.put('/admin/templates/:id', authenticateToken, requireRole('admin'), generalLimiter, notificationIdValidation, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be between 1 and 100 characters'),
  body('title_template')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title template must be between 1 and 200 characters'),
  body('message_template')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message template must be between 1 and 1000 characters'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  body('default_priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid default priority'),
  body('default_channels')
    .optional()
    .isArray()
    .withMessage('Default channels must be an array'),
  body('default_channels.*')
    .optional()
    .isIn(['push', 'email', 'sms', 'in_app'])
    .withMessage('Invalid default channel'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean')
], notificationController.updateNotificationTemplateAdmin);

/**
 * @route   DELETE /api/notifications/admin/templates/:id
 * @desc    Delete notification template (admin)
 * @access  Private (Admin)
 */
router.delete('/admin/templates/:id', authenticateToken, requireRole('admin'), generalLimiter, notificationIdValidation, notificationController.deleteNotificationTemplateAdmin);

module.exports = router;