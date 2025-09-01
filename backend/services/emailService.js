const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    this.transporter = nodemailer.createTransporter(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async loadTemplate(templateName) {
    try {
      if (this.templates.has(templateName)) {
        return this.templates.get(templateName);
      }

      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);
      
      this.templates.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  async sendEmail(options) {
    try {
      const {
        to,
        subject,
        template,
        data = {},
        attachments = [],
        priority = 'normal'
      } = options;

      let html, text;

      if (template) {
        const compiledTemplate = await this.loadTemplate(template);
        html = compiledTemplate(data);
        
        // Generate text version by stripping HTML
        text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      } else {
        html = options.html;
        text = options.text;
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Nakes Link',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
        },
        to,
        subject,
        text,
        html,
        attachments,
        priority: priority === 'high' ? 'high' : 'normal'
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', {
        messageId: result.messageId,
        to,
        subject
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Predefined email types
  async sendWelcomeEmail(userEmail, userData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Selamat Datang di Nakes Link!',
      template: 'welcome',
      data: userData
    });
  }

  async sendVerificationEmail(userEmail, verificationData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Verifikasi Akun Nakes Link',
      template: 'verification',
      data: verificationData,
      priority: 'high'
    });
  }

  async sendPasswordResetEmail(userEmail, resetData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Reset Password Nakes Link',
      template: 'password-reset',
      data: resetData,
      priority: 'high'
    });
  }

  async sendAppointmentConfirmation(userEmail, appointmentData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Konfirmasi Janji Temu - Nakes Link',
      template: 'appointment-confirmation',
      data: appointmentData
    });
  }

  async sendAppointmentReminder(userEmail, appointmentData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Pengingat Janji Temu - Nakes Link',
      template: 'appointment-reminder',
      data: appointmentData,
      priority: 'high'
    });
  }

  async sendEmergencyAlert(userEmail, emergencyData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'DARURAT - Permintaan Bantuan Medis',
      template: 'emergency-alert',
      data: emergencyData,
      priority: 'high'
    });
  }

  async sendPaymentConfirmation(userEmail, paymentData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Konfirmasi Pembayaran - Nakes Link',
      template: 'payment-confirmation',
      data: paymentData
    });
  }

  async sendNakesVerificationResult(userEmail, verificationData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Hasil Verifikasi Nakes - Nakes Link',
      template: 'nakes-verification',
      data: verificationData,
      priority: 'high'
    });
  }

  async sendSystemNotification(userEmail, notificationData) {
    return this.sendEmail({
      to: userEmail,
      subject: notificationData.subject || 'Notifikasi Sistem - Nakes Link',
      template: 'system-notification',
      data: notificationData
    });
  }

  // Bulk email sending
  async sendBulkEmails(emailList) {
    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limiting

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      const batchPromises = batch.map(emailOptions => 
        this.sendEmail(emailOptions).catch(error => ({ error, emailOptions }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < emailList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Email queue management
  async queueEmail(emailOptions, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.sendEmail(emailOptions);
      }, delay);
    } else {
      return this.sendEmail(emailOptions);
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();