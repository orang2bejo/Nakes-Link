const { Notification, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../services/pushNotificationService');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const {
      status,
      category,
      type,
      priority,
      unread_only = false,
      page = 1,
      limit = 20
    } = req.query;

    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = { user_id };

    if (status) {
      whereClause.status = status;
    }

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (unread_only === 'true') {
      whereClause.read_at = null;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(notifications.count / limit),
          total_items: notifications.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single notification
exports.getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { category, type } = req.query;

    let whereClause = {
      user_id,
      read_at: null
    };

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    await Notification.markAllAsRead(user_id, whereClause);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark notification as clicked
exports.markAsClicked = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsClicked();

    // If notification has action URL, return it
    let redirectUrl = null;
    if (notification.action_url) {
      redirectUrl = notification.action_url;
    }

    res.json({
      success: true,
      message: 'Notification marked as clicked',
      data: { redirect_url: redirectUrl }
    });

  } catch (error) {
    console.error('Mark as clicked error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Dismiss notification
exports.dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsDismissed();

    res.json({
      success: true,
      message: 'Notification dismissed'
    });

  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { category, type } = req.query;

    let whereClause = { user_id };

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    const unreadCount = await Notification.getUnreadCount(user_id, whereClause);

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create notification (admin only)
exports.createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const {
      user_id,
      user_ids, // For bulk notifications
      type,
      title,
      message,
      short_message,
      data,
      priority = 'medium',
      category = 'general',
      channels = ['push'],
      action_url,
      action_data,
      image_url,
      icon_url,
      sound,
      badge_count,
      group_key,
      collapse_key,
      scheduled_at,
      expires_at,
      template_id,
      template_data
    } = req.body;

    const sender_id = req.user.id;

    if (user_ids && Array.isArray(user_ids)) {
      // Bulk notification creation
      const notifications = await Notification.createBulkNotifications({
        user_ids,
        type,
        title,
        message,
        short_message,
        data,
        priority,
        category,
        channels,
        action_url,
        action_data,
        image_url,
        icon_url,
        sound,
        badge_count,
        group_key,
        collapse_key,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        expires_at: expires_at ? new Date(expires_at) : null,
        sender_id,
        template_id,
        template_data
      });

      res.status(201).json({
        success: true,
        message: `${notifications.length} notifications created successfully`,
        data: { notifications }
      });
    } else {
      // Single notification creation
      const notification = await Notification.createSingleNotification({
        user_id,
        type,
        title,
        message,
        short_message,
        data,
        priority,
        category,
        channels,
        action_url,
        action_data,
        image_url,
        icon_url,
        sound,
        badge_count,
        group_key,
        collapse_key,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        expires_at: expires_at ? new Date(expires_at) : null,
        sender_id,
        template_id,
        template_data
      });

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: { notification }
      });
    }

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send immediate notification (admin only)
exports.sendNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const {
      user_id,
      user_ids,
      type,
      title,
      message,
      channels = ['push'],
      data,
      priority = 'medium'
    } = req.body;

    const targetUsers = user_ids || [user_id];
    const results = [];

    for (const userId of targetUsers) {
      try {
        // Get user details
        const user = await User.findByPk(userId);
        if (!user) {
          results.push({
            user_id: userId,
            success: false,
            error: 'User not found'
          });
          continue;
        }

        // Create notification record
        const notification = await Notification.create({
          user_id: userId,
          type,
          title,
          message,
          data,
          priority,
          channels,
          status: 'pending',
          sender_id: req.user.id
        });

        // Send through specified channels
        const channelResults = {};

        if (channels.includes('push')) {
          try {
            await sendPushNotification({
              user_id: userId,
              title,
              message,
              data
            });
            channelResults.push = { success: true };
          } catch (pushError) {
            channelResults.push = { success: false, error: pushError.message };
          }
        }

        if (channels.includes('email')) {
          try {
            await sendEmail({
              to: user.email,
              subject: title,
              text: message,
              data
            });
            channelResults.email = { success: true };
          } catch (emailError) {
            channelResults.email = { success: false, error: emailError.message };
          }
        }

        if (channels.includes('sms')) {
          try {
            await sendSMS({
              to: user.phone,
              message: message,
              data
            });
            channelResults.sms = { success: true };
          } catch (smsError) {
            channelResults.sms = { success: false, error: smsError.message };
          }
        }

        // Update notification status
        const hasSuccessfulChannel = Object.values(channelResults).some(result => result.success);
        await notification.update({
          status: hasSuccessfulChannel ? 'sent' : 'failed',
          delivery_status: channelResults,
          sent_at: hasSuccessfulChannel ? new Date() : null
        });

        results.push({
          user_id: userId,
          notification_id: notification.id,
          success: hasSuccessfulChannel,
          channels: channelResults
        });

      } catch (userError) {
        results.push({
          user_id: userId,
          success: false,
          error: userError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    res.status(201).json({
      success: true,
      message: `Notifications sent: ${successCount}/${totalCount} successful`,
      data: { results }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get notification statistics (admin only)
exports.getNotificationStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const {
      start_date,
      end_date,
      user_id,
      category,
      type
    } = req.query;

    let whereClause = {};

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    if (user_id) {
      whereClause.user_id = user_id;
    }

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    const stats = await Notification.getNotificationStats(whereClause);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
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
      push_enabled = true,
      email_enabled = true,
      sms_enabled = false,
      categories = {},
      quiet_hours = null,
      frequency_limit = null
    } = req.body;

    const user_id = req.user.id;

    // Update user's notification preferences
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const preferences = {
      push_enabled,
      email_enabled,
      sms_enabled,
      categories,
      quiet_hours,
      frequency_limit,
      updated_at: new Date()
    };

    await user.update({
      notification_preferences: preferences
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await User.findByPk(user_id, {
      attributes: ['id', 'notification_preferences']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const defaultPreferences = {
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      categories: {
        appointments: true,
        payments: true,
        messages: true,
        system: true,
        marketing: false
      },
      quiet_hours: null,
      frequency_limit: null
    };

    const preferences = user.notification_preferences || defaultPreferences;

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Clean up expired notifications (admin only)
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const deletedCount = await Notification.cleanupExpiredNotifications();

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired notifications`
    });

  } catch (error) {
    console.error('Cleanup expired notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Retry failed notifications (admin only)
exports.retryFailedNotifications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { notification_ids } = req.body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({
        success: false,
        message: 'notification_ids array is required'
      });
    }

    const results = [];

    for (const notificationId of notification_ids) {
      try {
        const notification = await Notification.findByPk(notificationId);
        
        if (!notification) {
          results.push({
            notification_id: notificationId,
            success: false,
            error: 'Notification not found'
          });
          continue;
        }

        if (!notification.canRetry()) {
          results.push({
            notification_id: notificationId,
            success: false,
            error: 'Notification cannot be retried'
          });
          continue;
        }

        // Increment retry count
        await notification.incrementRetries();

        // Attempt to resend
        // This would typically involve calling the notification service
        // For now, we'll just mark it as pending
        await notification.update({
          status: 'pending',
          last_retry_at: new Date()
        });

        results.push({
          notification_id: notificationId,
          success: true
        });

      } catch (retryError) {
        results.push({
          notification_id: notificationId,
          success: false,
          error: retryError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    res.json({
      success: true,
      message: `Retry initiated: ${successCount}/${totalCount} successful`,
      data: { results }
    });

  } catch (error) {
    console.error('Retry failed notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};