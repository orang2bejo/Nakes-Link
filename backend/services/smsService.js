const twilio = require('twilio');
const fs = require('fs').promises;
const path = require('path');
const { logger, logNotificationEvent } = require('../utils/logger');
const { addSMSJob } = require('./notificationQueue');

class SMSService {
  constructor() {
    this.client = null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.templates = new Map();
    this.initializeTwilio();
  }

  initializeTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        logger.warn('Twilio credentials not configured. SMS service will be disabled.');
        return;
      }

      this.client = twilio(accountSid, authToken);
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Error initializing Twilio SMS service:', error);
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add Indonesia country code if not present
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    
    return '+' + cleaned;
  }

  async loadTemplate(templateName) {
    try {
      if (this.templates.has(templateName)) {
        return this.templates.get(templateName);
      }

      const templatePath = path.join(__dirname, '../templates/sms', `${templateName}.txt`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      this.templates.set(templateName, templateContent);
      return templateContent;
    } catch (error) {
      logger.error(`Error loading SMS template ${templateName}:`, error);
      throw new Error(`SMS template ${templateName} not found`);
    }
  }

  replaceTemplateVariables(template, data) {
    let message = template;
    
    // Replace all {{variable}} placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(placeholder, data[key] || '');
    });
    
    return message;
  }

  async sendSMS(options) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized. Please check Twilio configuration.');
      }

      const { to, message, template, data = {}, priority = 'normal' } = options;
      
      let finalMessage = message;
      
      if (template) {
        const templateContent = await this.loadTemplate(template);
        finalMessage = this.replaceTemplateVariables(templateContent, data);
      }
      const formattedNumber = this.formatPhoneNumber(to);

      const messageOptions = {
        body: finalMessage,
        from: this.fromNumber,
        to: formattedNumber
      };

      // Add delivery status callback for high priority messages
      if (priority === 'high') {
        messageOptions.statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;
      }

      const result = await this.client.messages.create(messageOptions);
      
      logger.info('SMS sent successfully:', {
        sid: result.sid,
        to: formattedNumber,
        status: result.status
      });

      logNotificationEvent('sms_sent', {
        to: formattedNumber,
        sid: result.sid,
        status: result.status,
        priority,
        template
      });

      return {
        success: true,
        sid: result.sid,
        status: result.status,
        to: formattedNumber
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      logNotificationEvent('sms_failed', {
        to: options.to,
        error: error.message,
        priority
      });
      throw error;
    }
  }

  // Predefined SMS types
  async sendVerificationSMS(phoneNumber, verificationCode) {
    const message = `Kode verifikasi Nakes Link Anda: ${verificationCode}. Jangan bagikan kode ini kepada siapa pun. Berlaku 10 menit.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  async sendPasswordResetSMS(phoneNumber, resetCode) {
    const message = `Kode reset password Nakes Link: ${resetCode}. Gunakan kode ini untuk mereset password Anda. Berlaku 15 menit.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  async sendAppointmentReminder(phoneNumber, appointmentData) {
    const { patientName, nakesName, date, time, location } = appointmentData;
    const message = `Pengingat: Janji temu Anda dengan ${nakesName} pada ${date} pukul ${time} di ${location}. Terima kasih - Nakes Link`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  async sendEmergencyAlert(phoneNumber, emergencyData) {
    const { location, emergencyType } = emergencyData;
    const message = `DARURAT: Permintaan bantuan medis (${emergencyType}) di ${location}. Segera tanggapi melalui aplikasi Nakes Link.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  async sendAppointmentConfirmation(phoneNumber, appointmentData) {
    const { appointmentId, nakesName, date, time } = appointmentData;
    const message = `Janji temu dikonfirmasi! ID: ${appointmentId}, dengan ${nakesName} pada ${date} pukul ${time}. Info lengkap di aplikasi Nakes Link.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  async sendPaymentConfirmation(phoneNumber, paymentData) {
    const { amount, transactionId, serviceName } = paymentData;
    const message = `Pembayaran berhasil! Rp${amount.toLocaleString('id-ID')} untuk ${serviceName}. ID Transaksi: ${transactionId}. Terima kasih - Nakes Link`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  async sendNakesVerificationResult(phoneNumber, verificationData) {
    const { status, nakesName } = verificationData;
    const message = status === 'approved' 
      ? `Selamat ${nakesName}! Verifikasi Nakes Anda telah disetujui. Anda dapat mulai menerima pasien di Nakes Link.`
      : `Verifikasi Nakes Anda memerlukan perbaikan dokumen. Silakan periksa aplikasi untuk detail lebih lanjut.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  async sendSystemNotification(phoneNumber, notificationData) {
    const { message } = notificationData;
    
    return this.sendSMS({
      to: phoneNumber,
      message: `Nakes Link: ${message}`
    });
  }

  // Bulk SMS sending
  async sendBulkSMS(smsList) {
    const results = [];
    const batchSize = 5; // Send in smaller batches for SMS

    for (let i = 0; i < smsList.length; i += batchSize) {
      const batch = smsList.slice(i, i + batchSize);
      const batchPromises = batch.map(smsOptions => 
        this.sendSMS(smsOptions).catch(error => ({ error, smsOptions }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < smsList.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  // Get message status
  async getMessageStatus(messageSid) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      logger.error('Error fetching message status:', error);
      throw error;
    }
  }

  // Queue SMS for processing
  async queueSMS(smsOptions, delay = 0) {
    try {
      // Add SMS to queue for processing
      const job = await addSMSJob(smsOptions, {
        delay: delay * 1000, // Convert seconds to milliseconds
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      
      logger.info('SMS queued for processing:', {
        jobId: job.id,
        to: smsOptions.to,
        template: smsOptions.template,
        delay
      });
      
      return {
        success: true,
        jobId: job.id,
        queued: true
      };
    } catch (error) {
      logger.error('Error queueing SMS:', error);
      throw error;
    }
  }

  // Validate phone number
  async validatePhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const lookup = await this.client.lookups.v1.phoneNumbers(formattedNumber).fetch();
      
      return {
        valid: true,
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Test SMS service
  async testService(testPhoneNumber) {
    try {
      const testMessage = 'Test SMS dari Nakes Link. Service berfungsi dengan baik!';
      const result = await this.sendSMS({
        to: testPhoneNumber,
        message: testMessage
      });
      
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return {
        balance: account.balance,
        currency: account.currency || 'USD'
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      throw error;
    }
  }
}

module.exports = new SMSService();