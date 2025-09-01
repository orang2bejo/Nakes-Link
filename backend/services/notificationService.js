const emailService = require('./emailService');
const smsService = require('./smsService');
const Notification = require('../models/Notification');

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

  // Bulk notifications
  async sendBulkNotifications(notifications) {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map(notification => 
        this.sendNotification(notification).catch(error => ({ error, notification }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
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
    const stats = await Notification.aggregate([
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
    ]);

    return stats[0] || { total: 0, unread: 0, byType: [] };
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
}

module.exports = new NotificationService();