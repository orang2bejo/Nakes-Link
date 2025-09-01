#!/usr/bin/env node

/**
 * Legal Compliance Setup Script
 * Automates the setup of legal compliance monitoring and document management
 * for Nakes Link platform
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nakeslink',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  
  // Legal document paths
  legalDocs: {
    privacyPolicy: './legal/privacy-policy.md',
    termsOfService: './legal/terms-of-service.md',
    healthcareCompliance: './legal/healthcare-compliance.md',
    legalChecklist: './legal/legal-consultation-checklist.md'
  },
  
  // Compliance monitoring
  compliance: {
    auditInterval: 24 * 60 * 60 * 1000, // 24 hours
    reportingEmail: process.env.COMPLIANCE_EMAIL || 'compliance@nakeslink.com',
    alertThresholds: {
      licenseExpiry: 30, // days
      documentUpdate: 90, // days
      auditOverdue: 7 // days
    }
  },
  
  // External services
  services: {
    satusehat: {
      baseUrl: process.env.SATUSEHAT_BASE_URL || 'https://api.satusehat.kemkes.go.id',
      clientId: process.env.SATUSEHAT_CLIENT_ID,
      clientSecret: process.env.SATUSEHAT_CLIENT_SECRET
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    }
  }
};

// Legal compliance database schema
const complianceSchema = `
-- Legal Compliance Tables

-- Document management
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  hash VARCHAR(64) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  effective_date TIMESTAMP,
  expiry_date TIMESTAMP,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License tracking
CREATE TABLE IF NOT EXISTS license_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  license_type VARCHAR(50) NOT NULL, -- STR, SIP, etc.
  license_number VARCHAR(100) NOT NULL,
  issuing_authority VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  verification_source VARCHAR(100), -- SatuSehat, manual, etc.
  verification_date TIMESTAMP,
  verification_status VARCHAR(50),
  documents JSONB, -- Supporting documents
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance audits
CREATE TABLE IF NOT EXISTS compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type VARCHAR(100) NOT NULL,
  scope VARCHAR(255) NOT NULL,
  auditor VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'planned',
  findings JSONB,
  recommendations JSONB,
  action_items JSONB,
  compliance_score INTEGER,
  report_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal incidents
CREATE TABLE IF NOT EXISTS legal_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_users INTEGER DEFAULT 0,
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  regulatory_notification_required BOOLEAN DEFAULT false,
  regulatory_notification_sent BOOLEAN DEFAULT false,
  notification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent management
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  consent_type VARCHAR(100) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  consent_text TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMP NOT NULL,
  withdrawal_date TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data processing activities
CREATE TABLE IF NOT EXISTS data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis VARCHAR(100) NOT NULL,
  data_categories JSONB NOT NULL,
  data_subjects JSONB NOT NULL,
  recipients JSONB,
  international_transfers JSONB,
  retention_period VARCHAR(100),
  security_measures JSONB,
  dpia_required BOOLEAN DEFAULT false,
  dpia_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance monitoring
CREATE TABLE IF NOT EXISTS compliance_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type VARCHAR(100) NOT NULL,
  check_name VARCHAR(255) NOT NULL,
  check_description TEXT,
  frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly
  last_check TIMESTAMP,
  next_check TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB,
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_license_tracking_user ON license_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_license_tracking_expiry ON license_tracking(expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_status ON compliance_audits(status);
CREATE INDEX IF NOT EXISTS idx_legal_incidents_status ON legal_incidents(status);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_next_check ON compliance_monitoring(next_check);

-- Functions for compliance monitoring
CREATE OR REPLACE FUNCTION check_license_expiry()
RETURNS TABLE(
  user_id UUID,
  license_type VARCHAR,
  license_number VARCHAR,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.user_id,
    lt.license_type,
    lt.license_number,
    lt.expiry_date,
    (lt.expiry_date - CURRENT_DATE) as days_until_expiry
  FROM license_tracking lt
  WHERE lt.status = 'active'
    AND lt.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  ORDER BY lt.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_compliance_dashboard()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_licenses', (
      SELECT COUNT(*) FROM license_tracking WHERE status = 'active'
    ),
    'expiring_licenses', (
      SELECT COUNT(*) FROM license_tracking 
      WHERE status = 'active' AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    ),
    'open_incidents', (
      SELECT COUNT(*) FROM legal_incidents WHERE status IN ('open', 'investigating')
    ),
    'pending_audits', (
      SELECT COUNT(*) FROM compliance_audits WHERE status = 'planned'
    ),
    'overdue_checks', (
      SELECT COUNT(*) FROM compliance_monitoring 
      WHERE next_check < CURRENT_TIMESTAMP AND status = 'pending'
    ),
    'consent_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE consent_given = true) * 100.0) / COUNT(*), 2
      ) FROM user_consents WHERE consent_type = 'privacy_policy'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
`;

// Legal compliance monitoring class
class LegalComplianceMonitor {
  constructor() {
    this.db = null;
    this.emailService = null;
  }

  async initialize() {
    console.log('🏛️ Initializing Legal Compliance Monitor...');
    
    // Setup database
    await this.setupDatabase();
    
    // Initialize email service
    await this.initializeEmailService();
    
    // Load legal documents
    await this.loadLegalDocuments();
    
    // Setup compliance checks
    await this.setupComplianceChecks();
    
    console.log('✅ Legal Compliance Monitor initialized successfully');
  }

  async setupDatabase() {
    console.log('📊 Setting up compliance database...');
    
    const { Pool } = require('pg');
    this.db = new Pool(config.database);
    
    try {
      await this.db.query(complianceSchema);
      console.log('✅ Compliance database schema created');
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      throw error;
    }
  }

  async initializeEmailService() {
    console.log('📧 Initializing email service...');
    
    const nodemailer = require('nodemailer');
    this.emailService = nodemailer.createTransporter(config.services.email.smtp);
    
    try {
      await this.emailService.verify();
      console.log('✅ Email service initialized');
    } catch (error) {
      console.warn('⚠️ Email service not available:', error.message);
    }
  }

  async loadLegalDocuments() {
    console.log('📄 Loading legal documents...');
    
    for (const [docType, filePath] of Object.entries(config.legalDocs)) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        await this.db.query(`
          INSERT INTO legal_documents (document_type, title, version, content, hash, status, effective_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (document_type, version) DO UPDATE SET
            content = EXCLUDED.content,
            hash = EXCLUDED.hash,
            updated_at = CURRENT_TIMESTAMP
        `, [
          docType,
          this.extractTitle(content),
          '1.0',
          content,
          hash,
          'active',
          new Date()
        ]);
        
        console.log(`✅ Loaded ${docType} document`);
      } catch (error) {
        console.error(`❌ Failed to load ${docType}:`, error.message);
      }
    }
  }

  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled Document';
  }

  async setupComplianceChecks() {
    console.log('🔍 Setting up compliance checks...');
    
    const checks = [
      {
        check_type: 'license_expiry',
        check_name: 'License Expiry Check',
        check_description: 'Monitor healthcare professional license expiry dates',
        frequency: 'daily'
      },
      {
        check_type: 'document_review',
        check_name: 'Legal Document Review',
        check_description: 'Ensure legal documents are up to date',
        frequency: 'monthly'
      },
      {
        check_type: 'consent_audit',
        check_name: 'User Consent Audit',
        check_description: 'Verify user consent compliance',
        frequency: 'weekly'
      },
      {
        check_type: 'data_retention',
        check_name: 'Data Retention Check',
        check_description: 'Monitor data retention policy compliance',
        frequency: 'weekly'
      },
      {
        check_type: 'security_audit',
        check_name: 'Security Compliance Audit',
        check_description: 'Regular security compliance verification',
        frequency: 'monthly'
      }
    ];

    for (const check of checks) {
      const nextCheck = this.calculateNextCheck(check.frequency);
      
      await this.db.query(`
        INSERT INTO compliance_monitoring (check_type, check_name, check_description, frequency, next_check)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (check_type) DO UPDATE SET
          check_name = EXCLUDED.check_name,
          check_description = EXCLUDED.check_description,
          frequency = EXCLUDED.frequency,
          next_check = EXCLUDED.next_check
      `, [check.check_type, check.check_name, check.check_description, check.frequency, nextCheck]);
    }
    
    console.log('✅ Compliance checks configured');
  }

  calculateNextCheck(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  async runComplianceChecks() {
    console.log('🔍 Running compliance checks...');
    
    const overdueChecks = await this.db.query(`
      SELECT * FROM compliance_monitoring 
      WHERE next_check <= CURRENT_TIMESTAMP AND status = 'pending'
    `);

    for (const check of overdueChecks.rows) {
      try {
        await this.executeComplianceCheck(check);
      } catch (error) {
        console.error(`❌ Check ${check.check_name} failed:`, error.message);
        await this.logIncident('compliance_check_failure', 'medium', 
          `Compliance check failed: ${check.check_name}`, error.message);
      }
    }
  }

  async executeComplianceCheck(check) {
    console.log(`🔍 Executing ${check.check_name}...`);
    
    let result = {};
    
    switch (check.check_type) {
      case 'license_expiry':
        result = await this.checkLicenseExpiry();
        break;
      case 'document_review':
        result = await this.checkDocumentReview();
        break;
      case 'consent_audit':
        result = await this.checkConsentCompliance();
        break;
      case 'data_retention':
        result = await this.checkDataRetention();
        break;
      case 'security_audit':
        result = await this.checkSecurityCompliance();
        break;
      default:
        result = { status: 'unknown_check_type' };
    }

    // Update check status
    const nextCheck = this.calculateNextCheck(check.frequency);
    await this.db.query(`
      UPDATE compliance_monitoring 
      SET last_check = CURRENT_TIMESTAMP, next_check = $1, status = $2, result = $3
      WHERE id = $4
    `, [nextCheck, result.status || 'completed', JSON.stringify(result), check.id]);

    // Send alerts if needed
    if (result.alerts && result.alerts.length > 0) {
      await this.sendComplianceAlerts(check, result.alerts);
    }

    console.log(`✅ ${check.check_name} completed`);
  }

  async checkLicenseExpiry() {
    const expiringLicenses = await this.db.query(`
      SELECT * FROM check_license_expiry()
    `);

    const alerts = [];
    for (const license of expiringLicenses.rows) {
      if (license.days_until_expiry <= 7) {
        alerts.push({
          severity: 'high',
          message: `License ${license.license_number} expires in ${license.days_until_expiry} days`,
          user_id: license.user_id
        });
      } else if (license.days_until_expiry <= 30) {
        alerts.push({
          severity: 'medium',
          message: `License ${license.license_number} expires in ${license.days_until_expiry} days`,
          user_id: license.user_id
        });
      }
    }

    return {
      status: 'completed',
      expiring_count: expiringLicenses.rows.length,
      alerts: alerts
    };
  }

  async checkDocumentReview() {
    const outdatedDocs = await this.db.query(`
      SELECT * FROM legal_documents 
      WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
        AND status = 'active'
    `);

    const alerts = outdatedDocs.rows.map(doc => ({
      severity: 'medium',
      message: `Legal document ${doc.title} needs review (last updated ${doc.updated_at})`,
      document_id: doc.id
    }));

    return {
      status: 'completed',
      outdated_count: outdatedDocs.rows.length,
      alerts: alerts
    };
  }

  async checkConsentCompliance() {
    const consentStats = await this.db.query(`
      SELECT 
        consent_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE consent_given = true) as consented,
        COUNT(*) FILTER (WHERE withdrawal_date IS NOT NULL) as withdrawn
      FROM user_consents 
      GROUP BY consent_type
    `);

    const alerts = [];
    for (const stat of consentStats.rows) {
      const consentRate = (stat.consented / stat.total) * 100;
      if (consentRate < 95) {
        alerts.push({
          severity: 'medium',
          message: `Low consent rate for ${stat.consent_type}: ${consentRate.toFixed(2)}%`,
          consent_type: stat.consent_type
        });
      }
    }

    return {
      status: 'completed',
      consent_stats: consentStats.rows,
      alerts: alerts
    };
  }

  async checkDataRetention() {
    // Check for data that should be deleted according to retention policies
    const retentionChecks = [
      {
        table: 'user_sessions',
        retention_days: 90,
        date_column: 'created_at'
      },
      {
        table: 'audit_logs',
        retention_days: 365,
        date_column: 'created_at'
      },
      {
        table: 'system_logs',
        retention_days: 30,
        date_column: 'created_at'
      }
    ];

    const alerts = [];
    let totalOverdue = 0;

    for (const check of retentionChecks) {
      try {
        const overdueData = await this.db.query(`
          SELECT COUNT(*) as count FROM ${check.table}
          WHERE ${check.date_column} < CURRENT_TIMESTAMP - INTERVAL '${check.retention_days} days'
        `);

        const count = parseInt(overdueData.rows[0].count);
        if (count > 0) {
          totalOverdue += count;
          alerts.push({
            severity: 'medium',
            message: `${count} records in ${check.table} exceed retention period`,
            table: check.table,
            count: count
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not check retention for ${check.table}:`, error.message);
      }
    }

    return {
      status: 'completed',
      overdue_records: totalOverdue,
      alerts: alerts
    };
  }

  async checkSecurityCompliance() {
    const securityChecks = {
      mfa_enabled: 0,
      password_policy: 0,
      session_timeout: 0,
      encryption_status: 0
    };

    // Check MFA adoption
    const mfaStats = await this.db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE mfa_enabled = true) as mfa_users
      FROM users WHERE status = 'active'
    `);

    if (mfaStats.rows[0]) {
      const mfaRate = (mfaStats.rows[0].mfa_users / mfaStats.rows[0].total_users) * 100;
      securityChecks.mfa_enabled = mfaRate;
    }

    const alerts = [];
    if (securityChecks.mfa_enabled < 90) {
      alerts.push({
        severity: 'high',
        message: `Low MFA adoption rate: ${securityChecks.mfa_enabled.toFixed(2)}%`
      });
    }

    return {
      status: 'completed',
      security_metrics: securityChecks,
      alerts: alerts
    };
  }

  async sendComplianceAlerts(check, alerts) {
    if (!this.emailService) {
      console.warn('⚠️ Email service not available for alerts');
      return;
    }

    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
    if (highSeverityAlerts.length === 0) return;

    const emailContent = this.generateAlertEmail(check, highSeverityAlerts);
    
    try {
      await this.emailService.sendMail({
        from: config.services.email.smtp.auth.user,
        to: config.compliance.reportingEmail,
        subject: `🚨 High Priority Compliance Alert - ${check.check_name}`,
        html: emailContent
      });
      
      console.log('📧 Compliance alert sent');
    } catch (error) {
      console.error('❌ Failed to send compliance alert:', error.message);
    }
  }

  generateAlertEmail(check, alerts) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">🚨 High Priority Compliance Alert</h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Check Details</h3>
              <p><strong>Check Name:</strong> ${check.check_name}</p>
              <p><strong>Check Type:</strong> ${check.check_type}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <h3 style="color: #d32f2f;">High Priority Alerts</h3>
            <ul>
              ${alerts.map(alert => `
                <li style="margin: 10px 0; padding: 10px; background: #ffebee; border-left: 4px solid #d32f2f;">
                  <strong>Severity:</strong> ${alert.severity.toUpperCase()}<br>
                  <strong>Message:</strong> ${alert.message}
                </li>
              `).join('')}
            </ul>
            
            <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
              <h4>Recommended Actions</h4>
              <ul>
                <li>Review the compliance dashboard immediately</li>
                <li>Address high-priority issues within 24 hours</li>
                <li>Document any remediation actions taken</li>
                <li>Contact legal counsel if regulatory notification is required</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This is an automated compliance alert from Nakes Link Legal Compliance Monitor.<br>
              For questions, contact: ${config.compliance.reportingEmail}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  async logIncident(type, severity, title, description) {
    await this.db.query(`
      INSERT INTO legal_incidents (incident_type, severity, title, description, status)
      VALUES ($1, $2, $3, $4, 'open')
    `, [type, severity, title, description]);
  }

  async generateComplianceReport() {
    console.log('📊 Generating compliance report...');
    
    const dashboard = await this.db.query('SELECT get_compliance_dashboard() as data');
    const dashboardData = dashboard.rows[0].data;

    const recentIncidents = await this.db.query(`
      SELECT * FROM legal_incidents 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      ORDER BY created_at DESC
    `);

    const upcomingAudits = await this.db.query(`
      SELECT * FROM compliance_audits 
      WHERE status = 'planned' AND start_date >= CURRENT_DATE
      ORDER BY start_date ASC
    `);

    const report = {
      generated_at: new Date().toISOString(),
      dashboard: dashboardData,
      recent_incidents: recentIncidents.rows,
      upcoming_audits: upcomingAudits.rows,
      recommendations: this.generateRecommendations(dashboardData)
    };

    // Save report
    const reportPath = path.join(__dirname, '../reports', `compliance-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Compliance report saved: ${reportPath}`);
    return report;
  }

  generateRecommendations(dashboardData) {
    const recommendations = [];

    if (dashboardData.expiring_licenses > 0) {
      recommendations.push({
        priority: 'high',
        category: 'license_management',
        message: `${dashboardData.expiring_licenses} licenses are expiring soon. Contact affected healthcare professionals immediately.`
      });
    }

    if (dashboardData.open_incidents > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'incident_management',
        message: `${dashboardData.open_incidents} open legal incidents require attention. Review and prioritize resolution.`
      });
    }

    if (dashboardData.consent_rate < 95) {
      recommendations.push({
        priority: 'medium',
        category: 'consent_management',
        message: `Consent rate is ${dashboardData.consent_rate}%. Review consent processes and user experience.`
      });
    }

    if (dashboardData.overdue_checks > 0) {
      recommendations.push({
        priority: 'high',
        category: 'compliance_monitoring',
        message: `${dashboardData.overdue_checks} compliance checks are overdue. Execute immediately to maintain compliance.`
      });
    }

    return recommendations;
  }

  async startMonitoring() {
    console.log('🔄 Starting compliance monitoring...');
    
    // Run initial checks
    await this.runComplianceChecks();
    
    // Schedule regular monitoring
    setInterval(async () => {
      try {
        await this.runComplianceChecks();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error.message);
      }
    }, config.compliance.auditInterval);
    
    console.log('✅ Compliance monitoring started');
  }

  async cleanup() {
    if (this.db) {
      await this.db.end();
    }
    console.log('🧹 Legal compliance monitor cleanup completed');
  }
}

// CLI Interface
class LegalComplianceCLI {
  constructor() {
    this.monitor = new LegalComplianceMonitor();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      await this.monitor.initialize();

      switch (command) {
        case 'setup':
          console.log('✅ Legal compliance system setup completed');
          break;
          
        case 'check':
          await this.monitor.runComplianceChecks();
          break;
          
        case 'report':
          const report = await this.monitor.generateComplianceReport();
          console.log('📊 Compliance Report Generated:');
          console.log(JSON.stringify(report, null, 2));
          break;
          
        case 'monitor':
          await this.monitor.startMonitoring();
          // Keep process running
          process.on('SIGINT', async () => {
            console.log('\n🛑 Stopping compliance monitor...');
            await this.monitor.cleanup();
            process.exit(0);
          });
          break;
          
        case 'dashboard':
          const dashboard = await this.monitor.db.query('SELECT get_compliance_dashboard() as data');
          console.log('📊 Compliance Dashboard:');
          console.log(JSON.stringify(dashboard.rows[0].data, null, 2));
          break;
          
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    } finally {
      if (command !== 'monitor') {
        await this.monitor.cleanup();
      }
    }
  }

  showHelp() {
    console.log(`
🏛️ Nakes Link Legal Compliance Manager

Usage: node legal-compliance-setup.js <command>

Commands:
  setup     - Initialize legal compliance system
  check     - Run compliance checks
  report    - Generate compliance report
  monitor   - Start continuous monitoring
  dashboard - Show compliance dashboard
  help      - Show this help message

Examples:
  node legal-compliance-setup.js setup
  node legal-compliance-setup.js check
  node legal-compliance-setup.js report
  node legal-compliance-setup.js monitor

Environment Variables:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD - Database configuration
  COMPLIANCE_EMAIL - Email for compliance alerts
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS - Email service configuration
  SATUSEHAT_CLIENT_ID, SATUSEHAT_CLIENT_SECRET - SatuSehat API credentials
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new LegalComplianceCLI();
  cli.run().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  LegalComplianceMonitor,
  LegalComplianceCLI,
  config
};