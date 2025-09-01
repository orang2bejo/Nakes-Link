const admin = require('firebase-admin');
const { User } = require('../models');
const { logger, logNotificationEvent } = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.initializeFirebase();
  }

  // Initialize Firebase Admin SDK
  initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          type: process.env.FIREBASE_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      
      this.isInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.isInitialized = false;
    }
  }

  // Send push notification to single device
  async sendToDevice(deviceToken, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      if (!deviceToken) {
        throw new Error('Device token is required');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: deviceToken,
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            priority: 'high'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      };

      const result = await admin.messaging().send(message);
      
      logNotificationEvent('push_notification_sent', {
        device_token: deviceToken.substring(0, 10) + '...',
        message_id: result,
        title: notification.title
      });

      return {
        success: true,
        message_id: result
      };
    } catch (error) {
      logger.error('Error sending push notification to device:', error);
      
      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        await this.removeInvalidToken(deviceToken);
      }
      
      throw error;
    }
  }

  // Send push notification to multiple devices
  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      if (!deviceTokens || deviceTokens.length === 0) {
        throw new Error('Device tokens are required');
      }

      // Filter out invalid tokens
      const validTokens = deviceTokens.filter(token => token && token.length > 0);
      
      if (validTokens.length === 0) {
        throw new Error('No valid device tokens provided');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens: validTokens,
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            priority: 'high'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      };

      const result = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (result.failureCount > 0) {
        const failedTokens = [];
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: validTokens[idx],
              error: resp.error
            });
            
            // Remove invalid tokens
            if (resp.error?.code === 'messaging/registration-token-not-registered' ||
                resp.error?.code === 'messaging/invalid-registration-token') {
              this.removeInvalidToken(validTokens[idx]);
            }
          }
        });
        
        logger.warn('Some push notifications failed:', {
          failed_count: result.failureCount,
          failed_tokens: failedTokens
        });
      }
      
      logNotificationEvent('push_notification_multicast', {
        total_tokens: validTokens.length,
        success_count: result.successCount,
        failure_count: result.failureCount,
        title: notification.title
      });

      return {
        success: true,
        success_count: result.successCount,
        failure_count: result.failureCount,
        responses: result.responses
      };
    } catch (error) {
      logger.error('Error sending push notifications to multiple devices:', error);
      throw error;
    }
  }

  // Send to topic
  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        topic: topic,
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            priority: 'high'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      };

      const result = await admin.messaging().send(message);
      
      logNotificationEvent('push_notification_topic', {
        topic: topic,
        message_id: result,
        title: notification.title
      });

      return {
        success: true,
        message_id: result
      };
    } catch (error) {
      logger.error('Error sending push notification to topic:', error);
      throw error;
    }
  }

  // Subscribe user to topic
  async subscribeToTopic(deviceTokens, topic) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
      const result = await admin.messaging().subscribeToTopic(tokens, topic);
      
      logNotificationEvent('topic_subscription', {
        topic: topic,
        token_count: tokens.length,
        success_count: result.successCount,
        failure_count: result.failureCount
      });

      return {
        success: true,
        success_count: result.successCount,
        failure_count: result.failureCount
      };
    } catch (error) {
      logger.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe user from topic
  async unsubscribeFromTopic(deviceTokens, topic) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
      const result = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      
      logNotificationEvent('topic_unsubscription', {
        topic: topic,
        token_count: tokens.length,
        success_count: result.successCount,
        failure_count: result.failureCount
      });

      return {
        success: true,
        success_count: result.successCount,
        failure_count: result.failureCount
      };
    } catch (error) {
      logger.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Remove invalid token from database
  async removeInvalidToken(deviceToken) {
    try {
      await User.update(
        { fcm_token: null },
        { where: { fcm_token: deviceToken } }
      );
      
      logger.info('Removed invalid FCM token from database:', {
        token: deviceToken.substring(0, 10) + '...'
      });
    } catch (error) {
      logger.error('Error removing invalid token:', error);
    }
  }

  // Send notification based on user role
  async sendByUserRole(role, notification, data = {}) {
    try {
      const users = await User.findAll({
        where: { 
          role: role,
          fcm_token: { [require('sequelize').Op.ne]: null }
        },
        attributes: ['fcm_token']
      });

      if (users.length === 0) {
        return {
          success: true,
          message: 'No users found with the specified role and valid FCM tokens'
        };
      }

      const deviceTokens = users.map(user => user.fcm_token).filter(token => token);
      
      return await this.sendToMultipleDevices(deviceTokens, notification, data);
    } catch (error) {
      logger.error('Error sending notification by user role:', error);
      throw error;
    }
  }

  // Send emergency notification
  async sendEmergencyNotification(notification, data = {}) {
    try {
      // Send to emergency topic for immediate delivery
      const topicResult = await this.sendToTopic('emergency', notification, {
        ...data,
        priority: 'urgent',
        emergency: 'true'
      });

      // Also send to all active Nakes
      const nakesResult = await this.sendByUserRole('nakes', notification, {
        ...data,
        priority: 'urgent',
        emergency: 'true'
      });

      return {
        success: true,
        topic_result: topicResult,
        nakes_result: nakesResult
      };
    } catch (error) {
      logger.error('Error sending emergency notification:', error);
      throw error;
    }
  }

  // Validate FCM token
  async validateToken(deviceToken) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase not initialized');
      }

      // Try to send a test message to validate token
      const testMessage = {
        data: {
          test: 'true',
          timestamp: new Date().toISOString()
        },
        token: deviceToken,
        dryRun: true // This won't actually send the message
      };

      await admin.messaging().send(testMessage);
      return { valid: true };
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        return { valid: false, reason: 'Invalid or unregistered token' };
      }
      
      logger.error('Error validating FCM token:', error);
      return { valid: false, reason: error.message };
    }
  }
}

module.exports = new PushNotificationService();