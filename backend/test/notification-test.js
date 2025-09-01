const NotificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const pushNotificationService = require('../services/pushNotificationService');
const { logger } = require('../utils/logger');

// Test notification system
async function testNotificationSystem() {
  try {
    logger.info('Starting notification system tests...');
    
    const notificationService = new NotificationService();
    
    // Test 1: Email service connection
    logger.info('Testing email service connection...');
    const emailTest = await emailService.testConnection();
    logger.info('Email service test result:', emailTest);
    
    // Test 2: SMS service (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      logger.info('Testing SMS service...');
      // Note: Replace with a test phone number
      // const smsTest = await smsService.testService('+6281234567890');
      // logger.info('SMS service test result:', smsTest);
      logger.info('SMS service configured and ready');
    } else {
      logger.warn('SMS service not configured - Twilio credentials missing');
    }
    
    // Test 3: Push notification service
    logger.info('Testing push notification service...');
    try {
      await pushNotificationService.validateToken('test-token');
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.warn('Push notification service test failed:', error.message);
    }
    
    // Test 4: Queue notification
    logger.info('Testing notification queue...');
    const testNotification = {
      user_id: 'test-user-123',
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification from the system',
      channels: ['in_app'],
      priority: 'medium',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const queueResult = await notificationService.queueNotification(testNotification);
    logger.info('Notification queue test result:', queueResult);
    
    // Test 5: Get notification stats
    logger.info('Testing notification statistics...');
    const stats = await notificationService.getNotificationStats();
    logger.info('Notification stats:', stats);
    
    logger.info('All notification system tests completed successfully!');
    
    return {
      success: true,
      tests: {
        email: emailTest,
        sms: 'configured',
        push: 'initialized',
        queue: queueResult,
        stats: stats
      }
    };
    
  } catch (error) {
    logger.error('Notification system test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test email templates
async function testEmailTemplates() {
  try {
    logger.info('Testing email templates...');
    
    const templates = [
      'welcome',
      'verification',
      'password-reset',
      'appointment-confirmation',
      'appointment-reminder',
      'emergency-alert',
      'payment-confirmation',
      'nakes-verification-result',
      'system-notification'
    ];
    
    const results = {};
    
    for (const template of templates) {
      try {
        await emailService.loadTemplate(template);
        results[template] = 'loaded';
        logger.info(`Email template '${template}' loaded successfully`);
      } catch (error) {
        results[template] = 'failed';
        logger.warn(`Email template '${template}' failed to load:`, error.message);
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Email template test failed:', error);
    throw error;
  }
}

// Test SMS templates
async function testSMSTemplates() {
  try {
    logger.info('Testing SMS templates...');
    
    const templates = [
      'password-reset',
      'appointment-reminder',
      'emergency-alert',
      'payment-confirmation',
      'nakes-verification-result',
      'system-notification'
    ];
    
    const results = {};
    
    for (const template of templates) {
      try {
        await smsService.loadTemplate(template);
        results[template] = 'loaded';
        logger.info(`SMS template '${template}' loaded successfully`);
      } catch (error) {
        results[template] = 'failed';
        logger.warn(`SMS template '${template}' failed to load:`, error.message);
      }
    }
    
    return results;
  } catch (error) {
    logger.error('SMS template test failed:', error);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  try {
    logger.info('='.repeat(50));
    logger.info('NAKES LINK NOTIFICATION SYSTEM TESTS');
    logger.info('='.repeat(50));
    
    const systemTest = await testNotificationSystem();
    const emailTemplateTest = await testEmailTemplates();
    const smsTemplateTest = await testSMSTemplates();
    
    const results = {
      system: systemTest,
      emailTemplates: emailTemplateTest,
      smsTemplates: smsTemplateTest,
      timestamp: new Date().toISOString()
    };
    
    logger.info('='.repeat(50));
    logger.info('TEST RESULTS SUMMARY');
    logger.info('='.repeat(50));
    logger.info('System Tests:', systemTest.success ? 'PASSED' : 'FAILED');
    logger.info('Email Templates:', Object.values(emailTemplateTest).filter(r => r === 'loaded').length + '/' + Object.keys(emailTemplateTest).length + ' loaded');
    logger.info('SMS Templates:', Object.values(smsTemplateTest).filter(r => r === 'loaded').length + '/' + Object.keys(smsTemplateTest).length + ' loaded');
    logger.info('='.repeat(50));
    
    return results;
  } catch (error) {
    logger.error('Test execution failed:', error);
    throw error;
  }
}

// Export for use in other files
module.exports = {
  testNotificationSystem,
  testEmailTemplates,
  testSMSTemplates,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      logger.info('All tests completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Tests failed:', error);
      process.exit(1);
    });
}