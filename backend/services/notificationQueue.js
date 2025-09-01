const Queue = require('bull');
const redis = require('redis');
const EmailService = require('./emailService');
const SMSService = require('./smsService');
const { logger, logNotificationEvent } = require('../utils/logger');
const { Notification, User } = require('../models');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
};

// Create notification queue
const notificationQueue = new Queue('notification processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3,
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY) || 5000
    }
  }
});

// Create email queue
const emailQueue = new Queue('email processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000
    }
  }
});

// Create SMS queue
const smsQueue = new Queue('sms processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 15000
    }
  }
});

// Create push notification queue
const pushQueue = new Queue('push processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000
    }
  }
});

// Initialize services
const emailService = new EmailService();
const smsService = new SMSService();

// Notification queue processor
notificationQueue.process('send_notification', async (job) => {
  const { notificationData } = job.data;
  
  try {
    logNotificationEvent('processing_started', {
      notification_id: notificationData.id,
      type: notificationData.type,
      channels: notificationData.channels
    });

    // Create notification record in database
    const notification = await Notification.create({
      user_id: notificationData.user_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      priority: notificationData.priority || 'medium',
      category: notificationData.category || 'general',
      channels: notificationData.channels || ['in_app'],
      delivery_status: {
        in_app: 'pending',
        email: 'pending',
        sms: 'pending',
        push: 'pending'
      },
      scheduled_at: notificationData.scheduled_at,
      expires_at: notificationData.expires_at
    });

    // Process each channel
    const channels = notificationData.channels || ['in_app'];
    const deliveryResults = {};

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await emailQueue.add('send_email', {
              notification_id: notification.id,
              ...notificationData
            }, {
              delay: notificationData.scheduled_at ? 
                new Date(notificationData.scheduled_at).getTime() - Date.now() : 0
            });
            deliveryResults.email = 'queued';
            break;

          case 'sms':
            await smsQueue.add('send_sms', {
              notification_id: notification.id,
              ...notificationData
            }, {
              delay: notificationData.scheduled_at ? 
                new Date(notificationData.scheduled_at).getTime() - Date.now() : 0
            });
            deliveryResults.sms = 'queued';
            break;

          case 'push':
            await pushQueue.add('send_push', {
              notification_id: notification.id,
              ...notificationData
            }, {
              delay: notificationData.scheduled_at ? 
                new Date(notificationData.scheduled_at).getTime() - Date.now() : 0
            });
            deliveryResults.push = 'queued';
            break;

          case 'in_app':
            // In-app notifications are stored in database and delivered via WebSocket
            deliveryResults.in_app = 'delivered';
            break;

          default:
            logger.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (channelError) {
        logger.error(`Error processing channel ${channel}:`, channelError);
        deliveryResults[channel] = 'failed';
      }
    }

    // Update notification delivery status
    await notification.update({
      delivery_status: {
        ...notification.delivery_status,
        ...deliveryResults
      },
      status: 'sent'
    });

    logNotificationEvent('processing_completed', {
      notification_id: notification.id,
      delivery_results: deliveryResults
    });

    return {
      notification_id: notification.id,
      delivery_results: deliveryResults
    };

  } catch (error) {
    logger.error('Error processing notification:', error);
    
    logNotificationEvent('processing_failed', {
      notification_id: notificationData.id,
      error: error.message
    });
    
    throw error;
  }
});

// Email queue processor
emailQueue.process('send_email', async (job) => {
  const { notification_id, type, user_id, title, message, data } = job.data;
  
  try {
    // Get user details
    const user = await User.findByPk(user_id);
    if (!user || !user.email) {
      throw new Error('User not found or email not available');
    }

    // Send email based on notification type
    let emailResult;
    switch (type) {
      case 'welcome':
        emailResult = await emailService.sendWelcomeEmail(user.email, {
          name: user.full_name,
          ...data
        });
        break;

      case 'verification':
        emailResult = await emailService.sendVerificationEmail(user.email, {
          name: user.full_name,
          verificationCode: data.verification_code,
          ...data
        });
        break;

      case 'appointment':
        emailResult = await emailService.sendAppointmentEmail(user.email, {
          patientName: user.full_name,
          ...data
        });
        break;

      case 'emergency':
        emailResult = await emailService.sendEmergencyAlert(user.email, {
          patientName: user.full_name,
          ...data
        });
        break;

      case 'payment':
        emailResult = await emailService.sendPaymentConfirmation(user.email, {
          customerName: user.full_name,
          ...data
        });
        break;

      case 'password_reset':
        emailResult = await emailService.sendPasswordResetEmail(user.email, {
          name: user.full_name,
          resetCode: data.reset_code,
          ...data
        });
        break;

      case 'nakes_verification':
        emailResult = await emailService.sendNakesVerificationResult(user.email, {
          nakesName: user.full_name,
          ...data
        });
        break;

      default:
        emailResult = await emailService.sendSystemNotification(user.email, {
          recipientName: user.full_name,
          notificationTitle: title,
          shortMessage: message,
          ...data
        });
    }

    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            email: emailResult.success ? 'delivered' : 'failed'
          }
        },
        { where: { id: notification_id } }
      );
    }

    logNotificationEvent('email_sent', {
      notification_id,
      user_id,
      email: user.email,
      success: emailResult.success
    });

    return emailResult;

  } catch (error) {
    logger.error('Error sending email:', error);
    
    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            email: 'failed'
          }
        },
        { where: { id: notification_id } }
      );
    }
    
    throw error;
  }
});

// SMS queue processor
smsQueue.process('send_sms', async (job) => {
  const { notification_id, type, user_id, title, message, data } = job.data;
  
  try {
    // Get user details
    const user = await User.findByPk(user_id);
    if (!user || !user.phone_number) {
      throw new Error('User not found or phone number not available');
    }

    // Send SMS based on notification type
    let smsResult;
    switch (type) {
      case 'verification':
        smsResult = await smsService.sendVerificationSMS(user.phone_number, {
          verificationCode: data.verification_code,
          email: user.email,
          ...data
        });
        break;

      case 'appointment':
        smsResult = await smsService.sendAppointmentReminder(user.phone_number, {
          patientName: user.full_name,
          ...data
        });
        break;

      case 'emergency':
        smsResult = await smsService.sendEmergencyAlert(user.phone_number, {
          patientName: user.full_name,
          ...data
        });
        break;

      case 'payment':
        smsResult = await smsService.sendPaymentConfirmation(user.phone_number, {
          customerName: user.full_name,
          ...data
        });
        break;

      case 'password_reset':
        smsResult = await smsService.sendPasswordResetSMS(user.phone_number, {
          resetCode: data.reset_code,
          email: user.email,
          ...data
        });
        break;

      case 'nakes_verification':
        smsResult = await smsService.sendNakesVerificationResult(user.phone_number, {
          nakesName: user.full_name,
          ...data
        });
        break;

      default:
        smsResult = await smsService.sendSystemNotification(user.phone_number, {
          notificationTitle: title,
          shortMessage: message,
          ...data
        });
    }

    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            sms: smsResult.success ? 'delivered' : 'failed'
          }
        },
        { where: { id: notification_id } }
      );
    }

    logNotificationEvent('sms_sent', {
      notification_id,
      user_id,
      phone: user.phone_number,
      success: smsResult.success
    });

    return smsResult;

  } catch (error) {
    logger.error('Error sending SMS:', error);
    
    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            sms: 'failed'
          }
        },
        { where: { id: notification_id } }
      );
    }
    
    throw error;
  }
});

// Push notification queue processor
pushQueue.process('send_push', async (job) => {
  const { notification_id, type, user_id, title, message, data } = job.data;
  
  try {
    // Get user details and FCM token
    const user = await User.findByPk(user_id);
    if (!user || !user.fcm_token) {
      throw new Error('User not found or FCM token not available');
    }

    // Send push notification using Firebase
    const admin = require('firebase-admin');
    
    const pushMessage = {
      notification: {
        title: title,
        body: message
      },
      data: {
        type: type,
        notification_id: notification_id?.toString() || '',
        ...data
      },
      token: user.fcm_token
    };

    const pushResult = await admin.messaging().send(pushMessage);

    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            push: 'delivered'
          }
        },
        { where: { id: notification_id } }
      );
    }

    logNotificationEvent('push_sent', {
      notification_id,
      user_id,
      fcm_token: user.fcm_token,
      message_id: pushResult
    });

    return { success: true, message_id: pushResult };

  } catch (error) {
    logger.error('Error sending push notification:', error);
    
    // Update notification delivery status
    if (notification_id) {
      await Notification.update(
        {
          delivery_status: {
            push: 'failed'
          }
        },
        { where: { id: notification_id } }
      );
    }
    
    throw error;
  }
});

// Queue event handlers
notificationQueue.on('completed', (job, result) => {
  logger.info(`Notification job ${job.id} completed:`, result);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job, result) => {
  logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err.message);
});

smsQueue.on('completed', (job, result) => {
  logger.info(`SMS job ${job.id} completed`);
});

smsQueue.on('failed', (job, err) => {
  logger.error(`SMS job ${job.id} failed:`, err.message);
});

pushQueue.on('completed', (job, result) => {
  logger.info(`Push job ${job.id} completed`);
});

pushQueue.on('failed', (job, err) => {
  logger.error(`Push job ${job.id} failed:`, err.message);
});

// Graceful shutdown
async function close() {
  try {
    logger.info('Closing notification queues...');
    
    await Promise.all([
      notificationQueue.close(),
      emailQueue.close(),
      smsQueue.close(),
      pushQueue.close()
    ]);
    
    logger.info('All notification queues closed successfully');
  } catch (error) {
    logger.error('Error closing notification queues:', error);
    throw error;
  }
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down notification queues...');
  await close();
});

module.exports = {
  // Queues
  notificationQueue,
  emailQueue,
  smsQueue,
  pushQueue,
  
  // Helper functions
  addNotificationJob: (data, options = {}) => {
    return notificationQueue.add('send_notification', { notificationData: data }, options);
  },
  
  addBulkNotificationJobs: (notifications, options = {}) => {
    const jobs = notifications.map(notification => ({
      name: 'send_notification',
      data: { notificationData: notification },
      opts: options
    }));
    return notificationQueue.addBulk(jobs);
  },
  
  addEmailJob: (data, options = {}) => {
    return emailQueue.add('send_email', data, options);
  },
  
  addSMSJob: (data, options = {}) => {
    return smsQueue.add('send_sms', data, options);
  },
  
  addPushJob: (data, options = {}) => {
    return pushQueue.add('send_push', data, options);
  },
  
  getQueueStats: async () => {
    const [notificationStats, emailStats, smsStats, pushStats] = await Promise.all([
      {
        waiting: await notificationQueue.getWaiting(),
        active: await notificationQueue.getActive(),
        completed: await notificationQueue.getCompleted(),
        failed: await notificationQueue.getFailed()
      },
      {
        waiting: await emailQueue.getWaiting(),
        active: await emailQueue.getActive(),
        completed: await emailQueue.getCompleted(),
        failed: await emailQueue.getFailed()
      },
      {
        waiting: await smsQueue.getWaiting(),
        active: await smsQueue.getActive(),
        completed: await smsQueue.getCompleted(),
        failed: await smsQueue.getFailed()
      },
      {
        waiting: await pushQueue.getWaiting(),
        active: await pushQueue.getActive(),
        completed: await pushQueue.getCompleted(),
        failed: await pushQueue.getFailed()
      }
    ]);
    
    return {
      notification: {
        waiting: notificationStats.waiting.length,
        active: notificationStats.active.length,
        completed: notificationStats.completed.length,
        failed: notificationStats.failed.length
      },
      email: {
        waiting: emailStats.waiting.length,
        active: emailStats.active.length,
        completed: emailStats.completed.length,
        failed: emailStats.failed.length
      },
      sms: {
        waiting: smsStats.waiting.length,
        active: smsStats.active.length,
        completed: smsStats.completed.length,
        failed: smsStats.failed.length
      },
      push: {
        waiting: pushStats.waiting.length,
        active: pushStats.active.length,
        completed: pushStats.completed.length,
        failed: pushStats.failed.length
      }
    };
  },
  
  retryFailedJobs: async (queueName = 'all') => {
    const queues = queueName === 'all' ? 
      [notificationQueue, emailQueue, smsQueue, pushQueue] : 
      [eval(`${queueName}Queue`)];
    
    const results = [];
    for (const queue of queues) {
      const failedJobs = await queue.getFailed();
      for (const job of failedJobs) {
        await job.retry();
      }
      results.push({
        queue: queue.name,
        retried: failedJobs.length
      });
    }
    
    return results;
  },
  
  close
};