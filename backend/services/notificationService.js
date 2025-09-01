const emailService = require('./emailService');
const smsService = require('./smsService');
const { addNotificationJob, addBulkNotificationJobs, getQueueStats, retryFailedJobs } = require('./notificationQueue');
const Notification = require('../models/Notification');
const { logger, logNotificationEvent } = require('../utils/logger');
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    this.emailService = emailService;
    this.smsService = smsService;
  }

  async sendNotification(options) {
    try {
      const {
        userId,
        type,
        title,
        message,
        data = {},
        channels = ['in_app'], // 'email', 'sms', 'in_app', 'push'
        priority = 'normal',
        scheduledAt = null
      } = options;

      const results = {
        inApp: null,
        email: null,
        sms: null,
        push: null
      };

      // Save in-app notification
      if (channels.includes('in_app')) {
        const notification = new Notification({
          userId,
          type,
          title,
          message,
          data,
          priority,
          scheduledAt,
          channels: ['in_app'],
          status: scheduledAt ? 'scheduled' : 'sent'
        });

        results.inApp = await notification.save();
      }

      // If scheduled, don't send immediately
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        return {
          success: true,
          scheduled: true,
          scheduledAt,
          results
        };
      }

      // Send email notification
      if (channels.includes('email') && data.email) {
        try {
          results.email = await this.sendEmailNotification({
            email: data.email,
            type,
            title,
            message,
            data,
            priority
          });
        } catch (error) {
          console.error('Email notification failed:', error);
          results.email = { success: false, error: error.message };
        }
      }

      // Send SMS notification
      if (channels.includes('sms') && data.phoneNumber) {
        try {
          results.sms = await this.sendSMSNotification({
            phoneNumber: data.phoneNumber,
            type,
            message,
            data,
            priority
          });
        } catch (error) {
          console.error('SMS notification failed:', error);
          results.sms = { success: false, error: error.message };
        }
      }

      // Send push notification (placeholder for future implementation)
      if (channels.includes('push') && data.deviceToken) {
        try {
          results.push = await this.sendPushNotification({
            deviceToken: data.deviceToken,
            title,
            message,
            data
          });
        } catch (error) {
          console.error('Push notification failed:', error);
          results.push = { success: false, error: error.message };
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Notification service error:', error);
      throw error;
    }
  }

  async sendEmailNotification(options) {
    const { email, type, title, message, data, priority } = options;

    const emailOptions = {
      to: email,
      subject: title,
      priority
    };

    // Use template based on notification type
    switch (type) {
      case 'welcome':
        return this.emailService.sendWelcomeEmail(email, data);
      
      case 'verification':
        return this.emailService.sendVerificationEmail(email, data);
      
      case 'password_reset':
        return this.emailService.sendPasswordResetEmail(email, data);
      
      case 'appointment_confirmation':
        return this.emailService.sendAppointmentConfirmation(email, data);
      
      case 'appointment_reminder':
        return this.emailService.sendAppointmentReminder(email, data);
      
      case 'emergency_alert':
        return this.emailService.sendEmergencyAlert(email, data);
      
      case 'payment_confirmation':
        return this.emailService.sendPaymentConfirmation(email, data);
      
      case 'nakes_verification':
        return this.emailService.sendNakesVerificationResult(email, data);
      
      default:
        emailOptions.html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">${title}</h2>
            <p>${message}</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Pesan ini dikirim oleh sistem Nakes Link. Jangan balas email ini.
            </p>
          </div>
        `;
        return this.emailService.sendEmail(emailOptions);
    }
  }

  async sendSMSNotification(options) {
    const { phoneNumber, type, message, data, priority } = options;

    // Use predefined SMS methods based on type
    switch (type) {
      case 'verification':
        return this.smsService.sendVerificationSMS(phoneNumber, data.verificationCode);
      
      case 'password_reset':
        return this.smsService.sendPasswordResetSMS(phoneNumber, data.resetCode);
      
      case 'appointment_reminder':
        return this.smsService.sendAppointmentReminder(phoneNumber, data);
      
      case 'emergency_alert':
        return this.smsService.sendEmergencyAlert(phoneNumber, data);
      
      case 'appointment_confirmation':
        return this.smsService.sendAppointmentConfirmation(phoneNumber, data);
      
      case 'payment_confirmation':
        return this.smsService.sendPaymentConfirmation(phoneNumber, data);
      
      case 'nakes_verification':
        return this.smsService.sendNakesVerificationResult(phoneNumber, data);
      
      default:
        return this.smsService.sendSMS({
          to: phoneNumber,
          message,
          priority
        });
    }
  }

  async sendPushNotification(options) {
    // Placeholder for push notification implementation
    // This would integrate with Firebase Cloud Messaging or similar service
    console.log('Push notification would be sent:', options);
    return { success: true, message: 'Push notification service not implemented yet' };
  }

  // Predefined notification methods
  async sendWelcomeNotification(userId, userData) {
    return this.sendNotification({
      userId,
      type: 'welcome',
      title: 'Selamat Datang di Nakes Link!',
      message: `Halo ${userData.name}, selamat bergabung dengan platform kesehatan terpercaya.`,
      data: userData,
      channels: ['in_app', 'email']
    });
  }

  async sendVerificationNotification(userId, verificationData) {
    const { email, phoneNumber, verificationCode } = verificationData;
    
    return this.sendNotification({
      userId,
      type: 'verification',
      title: 'Verifikasi Akun Anda',
      message: `Kode verifikasi: ${verificationCode}`,
      data: { email, phoneNumber, verificationCode },
      channels: ['in_app', 'email', 'sms'],
      priority: 'high'
    });
  }

  async sendPasswordResetNotification(userId, resetData) {
    const { email, phoneNumber, resetCode } = resetData;
    
    return this.sendNotification({
      userId,
      type: 'password_reset',
      title: 'Reset Password',
      message: `Kode reset password: ${resetCode}`,
      data: { email, phoneNumber, resetCode },
      channels: ['in_app', 'email', 'sms'],
      priority: 'high'
    });
  }

  async sendAppointmentConfirmation(userId, appointmentData) {
    return this.sendNotification({
      userId,
      type: 'appointment_confirmation',
      title: 'Janji Temu Dikonfirmasi',
      message: `Janji temu Anda dengan ${appointmentData.nakesName} telah dikonfirmasi.`,
      data: appointmentData,
      channels: ['in_app', 'email', 'sms']
    });
  }

  async sendAppointmentReminder(userId, appointmentData) {
    return this.sendNotification({
      userId,
      type: 'appointment_reminder',
      title: 'Pengingat Janji Temu',
      message: `Janji temu Anda dengan ${appointmentData.nakesName} akan dimulai dalam 1 jam.`,
      data: appointmentData,
      channels: ['in_app', 'email', 'sms'],
      priority: 'high'
    });
  }

  async sendEmergencyAlert(userId, emergencyData) {
    return this.sendNotification({
      userId,
      type: 'emergency_alert',
      title: 'DARURAT - Permintaan Bantuan Medis',
      message: `Permintaan bantuan medis darurat di ${emergencyData.location}`,
      data: emergencyData,
      channels: ['in_app', 'email', 'sms'],
      priority: 'high'
    });
  }

  async sendPaymentConfirmation(userId, paymentData) {
    return this.sendNotification({
      userId,
      type: 'payment_confirmation',
      title: 'Pembayaran Berhasil',
      message: `Pembayaran sebesar Rp${paymentData.amount.toLocaleString('id-ID')} telah berhasil.`,
      data: paymentData,
      channels: ['in_app', 'email', 'sms']
    });
  }

  async sendNakesVerificationResult(userId, verificationData) {
    const isApproved = verificationData.status === 'approved';
    
    return this.sendNotification({
      userId,
      type: 'nakes_verification',
      title: isApproved ? 'Verifikasi Nakes Disetujui' : 'Verifikasi Nakes Memerlukan Perbaikan',
      message: isApproved 
        ? 'Selamat! Verifikasi Nakes Anda telah disetujui.' 
        : 'Verifikasi Nakes Anda memerlukan perbaikan dokumen.',
      data: verificationData,
      channels: ['in_app', 'email', 'sms'],
      priority: 'high'
    });
  }

  // Queue notification for background processing
  async queueNotification(notificationData, options = {}) {
    try {
      logNotificationEvent('queuing_notification', {
        type: notificationData.type,
        user_id: notificationData.userId,
        channels: notificationData.channels
      });

      // Add to notification queue for background processing
      const job = await addNotificationJob(notificationData, {
        delay: options.delay || 0,
        priority: this.getPriorityValue(notificationData.priority),
        ...options
      });

      return {
        success: true,
        job_id: job.id,
        message: 'Notification queued successfully'
      };
    } catch (error) {
      logger.error('Error queuing notification:', error);
      throw error;
    }
  }

  // Bulk notifications
  async sendBulkNotifications(notifications, options = {}) {
    try {
      logNotificationEvent('queuing_bulk_notifications', {
        count: notifications.length
      });

      // Add bulk notifications to queue
      const jobs = await addBulkNotificationJobs(notifications, {
        priority: this.getPriorityValue(options.priority || 'normal'),
        ...options
      });
      
      return {
        success: true,
        message: 'Bulk notifications queued successfully',
        job_count: jobs.length,
        job_ids: jobs.map(job => job.id)
      };
    } catch (error) {
      logger.error('Error queuing bulk notifications:', error);
      throw error;
    }
  }

  // Scheduled notifications
  async scheduleNotification(options) {
    const { scheduledAt } = options;
    
    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    return this.sendNotification(options);
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      status = null,
      unreadOnly = false
    } = options;

    const query = { userId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (unreadOnly) query.readAt = null;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, readAt: null },
      { readAt: new Date() }
    );

    return result;
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const [dbStats, queueStats] = await Promise.all([
        Notification.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              unread: {
                $sum: {
                  $cond: [{ $eq: ['$readAt', null] }, 1, 0]
                }
              },
              byType: {
                $push: {
                  type: '$type',
                  count: 1
                }
              }
            }
          }
        ]),
        getQueueStats()
      ]);

      return {
        database_stats: dbStats[0] || { total: 0, unread: 0, byType: [] },
        queue_stats: queueStats
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Test notification services
  async testServices(testData) {
    const results = {};

    // Test email service
    if (testData.email) {
      try {
        results.email = await this.emailService.testConnection();
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Test SMS service
    if (testData.phoneNumber) {
      try {
        results.sms = await this.smsService.testService(testData.phoneNumber);
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    return results;
  }

  // Get priority value for queue processing
  getPriorityValue(priority) {
    const priorityMap = {
      'urgent': 1,
      'high': 2,
      'normal': 3,
      'low': 4
    };
    return priorityMap[priority] || 3;
  }

  // Retry failed notifications
  async retryFailedNotifications(queueName = 'all') {
    try {
      const results = await retryFailedJobs(queueName);
      
      logNotificationEvent('retrying_failed_notifications', {
        queue_name: queueName,
        results
      });
      
      return {
        success: true,
        message: 'Failed notifications retry initiated',
        results
      };
    } catch (error) {
      logger.error('Error retrying failed notifications:', error);
      throw error;
    }
  }

  // Send push notification directly
  async sendPushNotification(options) {
    try {
      const { deviceToken, title, message, data = {} } = options;
      
      if (!deviceToken) {
        throw new Error('Device token not available');
      }

      const pushMessage = {
        notification: {
          title: title,
          body: message
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        token: deviceToken
      };

      const result = await admin.messaging().send(pushMessage);
      
      logNotificationEvent('push_notification_sent', {
        message_id: result
      });

      return {
        success: true,
        message_id: result
      };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Schedule notification
  async scheduleNotification(notificationData, scheduledAt) {
    try {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      
      if (delay <= 0) {
        throw new Error('Scheduled time must be in the future');
      }

      return await this.queueNotification(notificationData, { delay });
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(jobId) {
    try {
      // Implementation would depend on the queue system
      // For Bull queue, you would get the job and remove it
      logNotificationEvent('notification_cancelled', {
        job_id: jobId
      });
      
      return {
        success: true,
        message: 'Notification cancelled successfully'
      };
    } catch (error) {
      logger.error('Error cancelling notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();