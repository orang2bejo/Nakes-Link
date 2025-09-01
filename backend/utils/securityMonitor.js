const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { DataSanitization } = require('./encryption');

/**
 * Security Monitoring and Alerting System
 * Real-time security threat detection and response
 */

class SecurityMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      alertThresholds: {
        failedLogins: 5,
        rateLimitViolations: 10,
        suspiciousActivity: 3,
        dataAccessViolations: 1
      },
      timeWindows: {
        failedLogins: 15 * 60 * 1000, // 15 minutes
        rateLimitViolations: 5 * 60 * 1000, // 5 minutes
        suspiciousActivity: 30 * 60 * 1000, // 30 minutes
        dataAccessViolations: 60 * 60 * 1000 // 1 hour
      },
      alertChannels: {
        email: true,
        webhook: true,
        log: true
      },
      logPath: options.logPath || path.join(__dirname, '../logs/security.log'),
      ...options
    };
    
    // In-memory tracking for security events
    this.eventTracking = {
      failedLogins: new Map(),
      rateLimitViolations: new Map(),
      suspiciousActivity: new Map(),
      dataAccessViolations: new Map(),
      blockedIPs: new Set(),
      suspiciousUsers: new Set()
    };
    
    // Email transporter for alerts
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Ensure log directory exists
    const logDir = path.dirname(this.config.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * Set up event listeners for security monitoring
   */
  setupEventListeners() {
    this.on('failed_login', this.handleFailedLogin.bind(this));
    this.on('rate_limit_violation', this.handleRateLimitViolation.bind(this));
    this.on('suspicious_activity', this.handleSuspiciousActivity.bind(this));
    this.on('data_access_violation', this.handleDataAccessViolation.bind(this));
    this.on('security_alert', this.handleSecurityAlert.bind(this));
  }
  
  /**
   * Log security event
   */
  logSecurityEvent(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
      sanitizedData: DataSanitization.sanitizeForLogging(event.data || {})
    };
    
    // Remove original data to prevent sensitive info in logs
    delete logEntry.data;
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.config.logPath, logLine);
    } catch (error) {
      console.error('Failed to write security log:', error.message);
    }
    
    // Emit for real-time processing
    this.emit('security_event_logged', logEntry);
  }
  
  /**
   * Track failed login attempts
   */
  trackFailedLogin(ip, userId, userAgent) {
    const event = {
      type: 'failed_login',
      ip,
      userId,
      userAgent,
      timestamp: Date.now()
    };
    
    this.logSecurityEvent(event);
    this.emit('failed_login', event);
  }
  
  /**
   * Track rate limit violations
   */
  trackRateLimitViolation(ip, endpoint, userAgent) {
    const event = {
      type: 'rate_limit_violation',
      ip,
      endpoint,
      userAgent,
      timestamp: Date.now()
    };
    
    this.logSecurityEvent(event);
    this.emit('rate_limit_violation', event);
  }
  
  /**
   * Track suspicious activity
   */
  trackSuspiciousActivity(type, ip, userId, details) {
    const event = {
      type: 'suspicious_activity',
      activityType: type,
      ip,
      userId,
      details,
      timestamp: Date.now()
    };
    
    this.logSecurityEvent(event);
    this.emit('suspicious_activity', event);
  }
  
  /**
   * Track data access violations
   */
  trackDataAccessViolation(userId, resource, action, reason) {
    const event = {
      type: 'data_access_violation',
      userId,
      resource,
      action,
      reason,
      timestamp: Date.now(),
      severity: 'high'
    };
    
    this.logSecurityEvent(event);
    this.emit('data_access_violation', event);
  }
  
  /**
   * Handle failed login events
   */
  handleFailedLogin(event) {
    const { ip, userId } = event;
    const key = ip || userId;
    
    if (!this.eventTracking.failedLogins.has(key)) {
      this.eventTracking.failedLogins.set(key, []);
    }
    
    const events = this.eventTracking.failedLogins.get(key);
    events.push(event.timestamp);
    
    // Clean old events
    const cutoff = Date.now() - this.config.timeWindows.failedLogins;
    const recentEvents = events.filter(timestamp => timestamp > cutoff);
    this.eventTracking.failedLogins.set(key, recentEvents);
    
    // Check threshold
    if (recentEvents.length >= this.config.alertThresholds.failedLogins) {
      this.triggerAlert({
        type: 'multiple_failed_logins',
        severity: 'medium',
        ip,
        userId,
        count: recentEvents.length,
        timeWindow: this.config.timeWindows.failedLogins / 1000 / 60 + ' minutes'
      });
      
      // Block IP temporarily
      if (ip) {
        this.blockIP(ip, 'multiple_failed_logins');
      }
    }
  }
  
  /**
   * Handle rate limit violations
   */
  handleRateLimitViolation(event) {
    const { ip } = event;
    
    if (!this.eventTracking.rateLimitViolations.has(ip)) {
      this.eventTracking.rateLimitViolations.set(ip, []);
    }
    
    const events = this.eventTracking.rateLimitViolations.get(ip);
    events.push(event.timestamp);
    
    // Clean old events
    const cutoff = Date.now() - this.config.timeWindows.rateLimitViolations;
    const recentEvents = events.filter(timestamp => timestamp > cutoff);
    this.eventTracking.rateLimitViolations.set(ip, recentEvents);
    
    // Check threshold
    if (recentEvents.length >= this.config.alertThresholds.rateLimitViolations) {
      this.triggerAlert({
        type: 'excessive_rate_limit_violations',
        severity: 'high',
        ip,
        count: recentEvents.length,
        endpoint: event.endpoint
      });
      
      // Block IP
      this.blockIP(ip, 'excessive_rate_limiting');
    }
  }
  
  /**
   * Handle suspicious activity
   */
  handleSuspiciousActivity(event) {
    const { ip, userId, activityType } = event;
    const key = ip || userId;
    
    if (!this.eventTracking.suspiciousActivity.has(key)) {
      this.eventTracking.suspiciousActivity.set(key, []);
    }
    
    const events = this.eventTracking.suspiciousActivity.get(key);
    events.push(event);
    
    // Clean old events
    const cutoff = Date.now() - this.config.timeWindows.suspiciousActivity;
    const recentEvents = events.filter(e => e.timestamp > cutoff);
    this.eventTracking.suspiciousActivity.set(key, recentEvents);
    
    // Check threshold
    if (recentEvents.length >= this.config.alertThresholds.suspiciousActivity) {
      this.triggerAlert({
        type: 'multiple_suspicious_activities',
        severity: 'high',
        ip,
        userId,
        activities: recentEvents.map(e => e.activityType),
        count: recentEvents.length
      });
      
      // Mark user as suspicious
      if (userId) {
        this.markUserSuspicious(userId);
      }
    }
    
    // Immediate alert for certain activity types
    const criticalActivities = [
      'sql_injection_attempt',
      'xss_attempt',
      'path_traversal_attempt',
      'unauthorized_admin_access'
    ];
    
    if (criticalActivities.includes(activityType)) {
      this.triggerAlert({
        type: 'critical_suspicious_activity',
        severity: 'critical',
        ip,
        userId,
        activityType,
        details: event.details
      });
    }
  }
  
  /**
   * Handle data access violations
   */
  handleDataAccessViolation(event) {
    // Immediate alert for any data access violation
    this.triggerAlert({
      type: 'data_access_violation',
      severity: 'critical',
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      reason: event.reason
    });
    
    // Mark user as suspicious
    if (event.userId) {
      this.markUserSuspicious(event.userId);
    }
  }
  
  /**
   * Trigger security alert
   */
  triggerAlert(alertData) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alertData
    };
    
    this.logSecurityEvent({
      type: 'security_alert',
      alert
    });
    
    this.emit('security_alert', alert);
  }
  
  /**
   * Handle security alerts
   */
  async handleSecurityAlert(alert) {
    console.log(`🚨 SECURITY ALERT [${alert.severity.toUpperCase()}]: ${alert.type}`);
    
    // Send email alert
    if (this.config.alertChannels.email) {
      await this.sendEmailAlert(alert);
    }
    
    // Send webhook alert
    if (this.config.alertChannels.webhook) {
      await this.sendWebhookAlert(alert);
    }
    
    // Take automated response actions
    await this.takeAutomatedResponse(alert);
  }
  
  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    try {
      const subject = `🚨 Nakes Link Security Alert: ${alert.type}`;
      const html = this.generateAlertEmail(alert);
      
      await this.emailTransporter.sendMail({
        from: process.env.SECURITY_EMAIL_FROM,
        to: process.env.SECURITY_EMAIL_TO,
        subject,
        html
      });
    } catch (error) {
      console.error('Failed to send security alert email:', error.message);
    }
  }
  
  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    try {
      const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
      if (!webhookUrl) return;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify({
          text: `🚨 Security Alert: ${alert.type}`,
          alert
        })
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error.message);
    }
  }
  
  /**
   * Take automated response actions
   */
  async takeAutomatedResponse(alert) {
    switch (alert.severity) {
      case 'critical':
        // Block IP immediately
        if (alert.ip) {
          this.blockIP(alert.ip, alert.type);
        }
        
        // Suspend user account
        if (alert.userId) {
          await this.suspendUser(alert.userId, alert.type);
        }
        break;
        
      case 'high':
        // Temporary IP block
        if (alert.ip) {
          this.blockIP(alert.ip, alert.type, 60 * 60 * 1000); // 1 hour
        }
        break;
        
      case 'medium':
        // Increase monitoring
        if (alert.ip) {
          this.increaseMonitoring(alert.ip);
        }
        break;
    }
  }
  
  /**
   * Block IP address
   */
  blockIP(ip, reason, duration = null) {
    this.eventTracking.blockedIPs.add(ip);
    
    this.logSecurityEvent({
      type: 'ip_blocked',
      ip,
      reason,
      duration: duration || 'permanent'
    });
    
    // If duration specified, unblock after timeout
    if (duration) {
      setTimeout(() => {
        this.unblockIP(ip);
      }, duration);
    }
    
    // Emit event for middleware to handle
    this.emit('ip_blocked', { ip, reason, duration });
  }
  
  /**
   * Unblock IP address
   */
  unblockIP(ip) {
    this.eventTracking.blockedIPs.delete(ip);
    
    this.logSecurityEvent({
      type: 'ip_unblocked',
      ip
    });
    
    this.emit('ip_unblocked', { ip });
  }
  
  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    return this.eventTracking.blockedIPs.has(ip);
  }
  
  /**
   * Mark user as suspicious
   */
  markUserSuspicious(userId) {
    this.eventTracking.suspiciousUsers.add(userId);
    
    this.logSecurityEvent({
      type: 'user_marked_suspicious',
      userId
    });
    
    this.emit('user_marked_suspicious', { userId });
  }
  
  /**
   * Check if user is suspicious
   */
  isUserSuspicious(userId) {
    return this.eventTracking.suspiciousUsers.has(userId);
  }
  
  /**
   * Suspend user account
   */
  async suspendUser(userId, reason) {
    try {
      // This would integrate with your user management system
      // For now, just log the action
      this.logSecurityEvent({
        type: 'user_suspended',
        userId,
        reason,
        automated: true
      });
      
      this.emit('user_suspended', { userId, reason });
    } catch (error) {
      console.error('Failed to suspend user:', error.message);
    }
  }
  
  /**
   * Increase monitoring for IP
   */
  increaseMonitoring(ip) {
    this.logSecurityEvent({
      type: 'monitoring_increased',
      ip
    });
    
    this.emit('monitoring_increased', { ip });
  }
  
  /**
   * Generate alert email HTML
   */
  generateAlertEmail(alert) {
    const severityColors = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="border-left: 4px solid ${severityColors[alert.severity]}; padding: 20px; background: #f5f5f5;">
            <h2 style="color: ${severityColors[alert.severity]}; margin-top: 0;">
              🚨 Security Alert: ${alert.type}
            </h2>
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Time:</strong> ${alert.timestamp}</p>
            <p><strong>Alert ID:</strong> ${alert.id}</p>
            
            <h3>Details:</h3>
            <ul>
              ${Object.entries(alert)
                .filter(([key]) => !['id', 'timestamp', 'type', 'severity'].includes(key))
                .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                .join('')}
            </ul>
            
            <p style="margin-top: 20px; padding: 10px; background: #fff; border-radius: 4px;">
              <strong>Action Required:</strong> Please investigate this security alert immediately.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Start cleanup interval to remove old tracking data
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000); // Run every hour
  }
  
  /**
   * Clean up old tracking events
   */
  cleanupOldEvents() {
    const now = Date.now();
    
    // Clean failed logins
    for (const [key, events] of this.eventTracking.failedLogins.entries()) {
      const cutoff = now - this.config.timeWindows.failedLogins;
      const recentEvents = events.filter(timestamp => timestamp > cutoff);
      
      if (recentEvents.length === 0) {
        this.eventTracking.failedLogins.delete(key);
      } else {
        this.eventTracking.failedLogins.set(key, recentEvents);
      }
    }
    
    // Clean rate limit violations
    for (const [key, events] of this.eventTracking.rateLimitViolations.entries()) {
      const cutoff = now - this.config.timeWindows.rateLimitViolations;
      const recentEvents = events.filter(timestamp => timestamp > cutoff);
      
      if (recentEvents.length === 0) {
        this.eventTracking.rateLimitViolations.delete(key);
      } else {
        this.eventTracking.rateLimitViolations.set(key, recentEvents);
      }
    }
    
    // Clean suspicious activities
    for (const [key, events] of this.eventTracking.suspiciousActivity.entries()) {
      const cutoff = now - this.config.timeWindows.suspiciousActivity;
      const recentEvents = events.filter(event => event.timestamp > cutoff);
      
      if (recentEvents.length === 0) {
        this.eventTracking.suspiciousActivity.delete(key);
      } else {
        this.eventTracking.suspiciousActivity.set(key, recentEvents);
      }
    }
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      blockedIPs: this.eventTracking.blockedIPs.size,
      suspiciousUsers: this.eventTracking.suspiciousUsers.size,
      activeFailedLoginTracking: this.eventTracking.failedLogins.size,
      activeRateLimitTracking: this.eventTracking.rateLimitViolations.size,
      activeSuspiciousActivityTracking: this.eventTracking.suspiciousActivity.size
    };
  }
  
  /**
   * Export security logs
   */
  exportSecurityLogs(startDate, endDate) {
    try {
      const logContent = fs.readFileSync(this.config.logPath, 'utf8');
      const logs = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => {
          if (!log) return false;
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      
      return logs;
    } catch (error) {
      console.error('Failed to export security logs:', error.message);
      return [];
    }
  }
}

// Singleton instance
let securityMonitorInstance = null;

/**
 * Get security monitor instance
 */
function getSecurityMonitor(options = {}) {
  if (!securityMonitorInstance) {
    securityMonitorInstance = new SecurityMonitor(options);
  }
  return securityMonitorInstance;
}

module.exports = {
  SecurityMonitor,
  getSecurityMonitor
};