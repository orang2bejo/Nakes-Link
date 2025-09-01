// Performance Monitoring Script for Nakes Link Platform
// This script monitors system resources and database performance during load tests

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Configuration
const config = {
  monitoring: {
    interval: 5000, // 5 seconds
    duration: 3600000, // 1 hour
    metricsRetention: 86400000, // 24 hours
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nakeslink',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  thresholds: {
    cpu: 80, // 80%
    memory: 85, // 85%
    disk: 90, // 90%
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    dbConnections: 100,
    dbSlowQueries: 10,
  },
  
  alerts: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      recipients: (process.env.ALERT_RECIPIENTS || '').split(','),
    },
    
    webhook: {
      enabled: process.env.WEBHOOK_ENABLED === 'true',
      url: process.env.WEBHOOK_URL,
    },
  },
  
  dashboard: {
    port: process.env.DASHBOARD_PORT || 3003,
    enabled: true,
  },
  
  storage: {
    metricsFile: './performance/data/metrics.json',
    alertsFile: './performance/data/alerts.json',
    reportsDir: './performance/reports',
  },
};

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.alerts = [];
    this.isMonitoring = false;
    this.dbClient = null;
    this.emailTransporter = null;
    this.wsServer = null;
    this.dashboardApp = null;
    this.monitoringInterval = null;
    
    this.initializeStorage();
    this.initializeDatabase();
    this.initializeEmailService();
    this.initializeDashboard();
  }
  
  async initializeStorage() {
    try {
      // Create directories if they don't exist
      await fs.mkdir(path.dirname(config.storage.metricsFile), { recursive: true });
      await fs.mkdir(path.dirname(config.storage.alertsFile), { recursive: true });
      await fs.mkdir(config.storage.reportsDir, { recursive: true });
      
      // Load existing metrics and alerts
      try {
        const metricsData = await fs.readFile(config.storage.metricsFile, 'utf8');
        this.metrics = JSON.parse(metricsData);
        
        // Clean old metrics
        const cutoff = Date.now() - config.monitoring.metricsRetention;
        this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
      } catch (error) {
        console.log('No existing metrics file found, starting fresh');
        this.metrics = [];
      }
      
      try {
        const alertsData = await fs.readFile(config.storage.alertsFile, 'utf8');
        this.alerts = JSON.parse(alertsData);
      } catch (error) {
        console.log('No existing alerts file found, starting fresh');
        this.alerts = [];
      }
      
      console.log('Storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }
  
  async initializeDatabase() {
    try {
      this.dbClient = new Client(config.database);
      await this.dbClient.connect();
      console.log('Database connection established');
    } catch (error) {
      console.error('Failed to connect to database:', error);
    }
  }
  
  initializeEmailService() {
    if (config.alerts.email.enabled) {
      try {
        this.emailTransporter = nodemailer.createTransporter(config.alerts.email.smtp);
        console.log('Email service initialized');
      } catch (error) {
        console.error('Failed to initialize email service:', error);
      }
    }
  }
  
  initializeDashboard() {
    if (config.dashboard.enabled) {
      this.dashboardApp = express();
      const server = http.createServer(this.dashboardApp);
      this.io = socketIo(server);
      
      // Serve static dashboard files
      this.dashboardApp.use(express.static(path.join(__dirname, '../legal')));
      
      // API endpoints
      this.dashboardApp.get('/api/metrics', (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const recentMetrics = this.metrics.slice(-limit);
        res.json(recentMetrics);
      });
      
      this.dashboardApp.get('/api/alerts', (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const recentAlerts = this.alerts.slice(-limit);
        res.json(recentAlerts);
      });
      
      this.dashboardApp.get('/api/status', (req, res) => {
        res.json({
          isMonitoring: this.isMonitoring,
          metricsCount: this.metrics.length,
          alertsCount: this.alerts.length,
          uptime: process.uptime(),
        });
      });
      
      this.dashboardApp.get('/api/summary', (req, res) => {
        const summary = this.generateSummary();
        res.json(summary);
      });
      
      // WebSocket for real-time updates
      this.io.on('connection', (socket) => {
        console.log('Dashboard client connected');
        
        socket.on('disconnect', () => {
          console.log('Dashboard client disconnected');
        });
      });
      
      server.listen(config.dashboard.port, () => {
        console.log(`Performance dashboard running on port ${config.dashboard.port}`);
      });
    }
  }
  
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Monitoring is already running');
      return;
    }
    
    console.log('Starting performance monitoring...');
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Check thresholds and generate alerts
        await this.checkThresholds(metrics);
        
        // Broadcast to dashboard
        if (this.io) {
          this.io.emit('metrics', metrics);
        }
        
        // Save metrics periodically
        if (this.metrics.length % 10 === 0) {
          await this.saveMetrics();
        }
        
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, config.monitoring.interval);
    
    // Auto-stop after duration
    setTimeout(() => {
      this.stopMonitoring();
    }, config.monitoring.duration);
  }
  
  async stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Monitoring is not running');
      return;
    }
    
    console.log('Stopping performance monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Save final metrics and generate report
    await this.saveMetrics();
    await this.saveAlerts();
    await this.generateReport();
    
    console.log('Performance monitoring stopped');
  }
  
  async collectMetrics() {
    const timestamp = Date.now();
    
    // System metrics
    const cpuUsage = await this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const networkStats = this.getNetworkStats();
    
    // Database metrics
    const dbMetrics = await this.getDatabaseMetrics();
    
    // Application metrics
    const appMetrics = await this.getApplicationMetrics();
    
    return {
      timestamp,
      system: {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkStats,
      },
      database: dbMetrics,
      application: appMetrics,
    };
  }
  
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        
        resolve({
          usage: percentageCPU,
          cores: os.cpus().length,
          loadAverage: os.loadavg(),
        });
      }, 1000);
    });
  }
  
  cpuAverage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    
    for (let cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    
    return {
      idle: idle,
      total: total,
    };
  }
  
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: (usedMemory / totalMemory) * 100,
      processMemory: process.memoryUsage(),
    };
  }
  
  async getDiskUsage() {
    try {
      const stats = await fs.stat('.');
      // This is a simplified disk usage calculation
      // In production, you might want to use a more sophisticated method
      return {
        usage: 50, // Placeholder
        available: 1000000000, // Placeholder
        total: 2000000000, // Placeholder
      };
    } catch (error) {
      return {
        usage: 0,
        available: 0,
        total: 0,
        error: error.message,
      };
    }
  }
  
  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    let totalRx = 0;
    let totalTx = 0;
    
    // This is a simplified network stats calculation
    // In production, you might want to use system-specific tools
    return {
      interfaces: Object.keys(networkInterfaces).length,
      bytesReceived: totalRx,
      bytesTransmitted: totalTx,
    };
  }
  
  async getDatabaseMetrics() {
    if (!this.dbClient) {
      return { error: 'Database not connected' };
    }
    
    try {
      // Active connections
      const connectionsResult = await this.dbClient.query(
        'SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\''
      );
      
      // Database size
      const sizeResult = await this.dbClient.query(
        'SELECT pg_size_pretty(pg_database_size(current_database())) as size'
      );
      
      // Slow queries
      const slowQueriesResult = await this.dbClient.query(`
        SELECT count(*) as slow_queries 
        FROM pg_stat_statements 
        WHERE mean_time > 1000
      `);
      
      // Cache hit ratio
      const cacheHitResult = await this.dbClient.query(`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `);
      
      // Transaction stats
      const transactionResult = await this.dbClient.query(`
        SELECT 
          xact_commit,
          xact_rollback,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);
      
      return {
        activeConnections: parseInt(connectionsResult.rows[0].active_connections),
        databaseSize: sizeResult.rows[0].size,
        slowQueries: parseInt(slowQueriesResult.rows[0]?.slow_queries || 0),
        cacheHitRatio: parseFloat(cacheHitResult.rows[0]?.cache_hit_ratio || 0),
        transactions: transactionResult.rows[0] || {},
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }
  
  async getApplicationMetrics() {
    try {
      // HTTP request metrics (if available)
      const httpMetrics = await this.getHttpMetrics();
      
      // WebSocket connections
      const wsConnections = this.io ? this.io.engine.clientsCount : 0;
      
      // Event loop lag
      const eventLoopLag = this.getEventLoopLag();
      
      return {
        http: httpMetrics,
        websockets: wsConnections,
        eventLoopLag: eventLoopLag,
        uptime: process.uptime(),
        version: process.version,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }
  
  async getHttpMetrics() {
    // This would typically integrate with your application's metrics
    // For now, returning placeholder data
    return {
      requestsPerSecond: Math.random() * 100,
      averageResponseTime: Math.random() * 1000,
      errorRate: Math.random() * 0.1,
      activeRequests: Math.floor(Math.random() * 50),
    };
  }
  
  getEventLoopLag() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      return lag;
    });
    return 0; // Placeholder
  }
  
  async checkThresholds(metrics) {
    const alerts = [];
    
    // CPU threshold
    if (metrics.system.cpu.usage > config.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is ${metrics.system.cpu.usage.toFixed(2)}% (threshold: ${config.thresholds.cpu}%)`,
        value: metrics.system.cpu.usage,
        threshold: config.thresholds.cpu,
        timestamp: metrics.timestamp,
      });
    }
    
    // Memory threshold
    if (metrics.system.memory.usage > config.thresholds.memory) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is ${metrics.system.memory.usage.toFixed(2)}% (threshold: ${config.thresholds.memory}%)`,
        value: metrics.system.memory.usage,
        threshold: config.thresholds.memory,
        timestamp: metrics.timestamp,
      });
    }
    
    // Database connections threshold
    if (metrics.database.activeConnections > config.thresholds.dbConnections) {
      alerts.push({
        type: 'database_connections',
        severity: 'critical',
        message: `Active database connections: ${metrics.database.activeConnections} (threshold: ${config.thresholds.dbConnections})`,
        value: metrics.database.activeConnections,
        threshold: config.thresholds.dbConnections,
        timestamp: metrics.timestamp,
      });
    }
    
    // Slow queries threshold
    if (metrics.database.slowQueries > config.thresholds.dbSlowQueries) {
      alerts.push({
        type: 'slow_queries',
        severity: 'warning',
        message: `Slow queries detected: ${metrics.database.slowQueries} (threshold: ${config.thresholds.dbSlowQueries})`,
        value: metrics.database.slowQueries,
        threshold: config.thresholds.dbSlowQueries,
        timestamp: metrics.timestamp,
      });
    }
    
    // Response time threshold
    if (metrics.application.http.averageResponseTime > config.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Average response time: ${metrics.application.http.averageResponseTime.toFixed(2)}ms (threshold: ${config.thresholds.responseTime}ms)`,
        value: metrics.application.http.averageResponseTime,
        threshold: config.thresholds.responseTime,
        timestamp: metrics.timestamp,
      });
    }
    
    // Error rate threshold
    if (metrics.application.http.errorRate > config.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `Error rate: ${(metrics.application.http.errorRate * 100).toFixed(2)}% (threshold: ${(config.thresholds.errorRate * 100).toFixed(2)}%)`,
        value: metrics.application.http.errorRate,
        threshold: config.thresholds.errorRate,
        timestamp: metrics.timestamp,
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }
  
  async processAlert(alert) {
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    
    this.alerts.push(alert);
    
    // Send email notification
    if (config.alerts.email.enabled && this.emailTransporter) {
      await this.sendEmailAlert(alert);
    }
    
    // Send webhook notification
    if (config.alerts.webhook.enabled) {
      await this.sendWebhookAlert(alert);
    }
    
    // Broadcast to dashboard
    if (this.io) {
      this.io.emit('alert', alert);
    }
  }
  
  async sendEmailAlert(alert) {
    try {
      const mailOptions = {
        from: config.alerts.email.smtp.auth.user,
        to: config.alerts.email.recipients.join(','),
        subject: `[Nakes Link] Performance Alert - ${alert.type}`,
        html: `
          <h2>Performance Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Value:</strong> ${alert.value}</p>
          <p><strong>Threshold:</strong> ${alert.threshold}</p>
          <p><strong>Time:</strong> ${new Date(alert.timestamp).toISOString()}</p>
        `,
      };
      
      await this.emailTransporter.sendMail(mailOptions);
      console.log('Email alert sent successfully');
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
  
  async sendWebhookAlert(alert) {
    try {
      const response = await fetch(config.alerts.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Performance Alert: ${alert.message}`,
          alert: alert,
        }),
      });
      
      if (response.ok) {
        console.log('Webhook alert sent successfully');
      } else {
        console.error('Failed to send webhook alert:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }
  
  async saveMetrics() {
    try {
      await fs.writeFile(
        config.storage.metricsFile,
        JSON.stringify(this.metrics, null, 2)
      );
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }
  
  async saveAlerts() {
    try {
      await fs.writeFile(
        config.storage.alertsFile,
        JSON.stringify(this.alerts, null, 2)
      );
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }
  
  generateSummary() {
    if (this.metrics.length === 0) {
      return { error: 'No metrics available' };
    }
    
    const latest = this.metrics[this.metrics.length - 1];
    const cpuValues = this.metrics.map(m => m.system.cpu.usage);
    const memoryValues = this.metrics.map(m => m.system.memory.usage);
    const responseTimeValues = this.metrics.map(m => m.application.http.averageResponseTime);
    
    return {
      period: {
        start: new Date(this.metrics[0].timestamp).toISOString(),
        end: new Date(latest.timestamp).toISOString(),
        duration: latest.timestamp - this.metrics[0].timestamp,
      },
      
      cpu: {
        current: latest.system.cpu.usage,
        average: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
        max: Math.max(...cpuValues),
        min: Math.min(...cpuValues),
      },
      
      memory: {
        current: latest.system.memory.usage,
        average: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
        max: Math.max(...memoryValues),
        min: Math.min(...memoryValues),
      },
      
      responseTime: {
        current: latest.application.http.averageResponseTime,
        average: responseTimeValues.reduce((a, b) => a + b, 0) / responseTimeValues.length,
        max: Math.max(...responseTimeValues),
        min: Math.min(...responseTimeValues),
      },
      
      database: {
        activeConnections: latest.database.activeConnections,
        slowQueries: latest.database.slowQueries,
        cacheHitRatio: latest.database.cacheHitRatio,
      },
      
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        warning: this.alerts.filter(a => a.severity === 'warning').length,
      },
    };
  }
  
  async generateReport() {
    try {
      const summary = this.generateSummary();
      const reportData = {
        summary,
        metrics: this.metrics,
        alerts: this.alerts,
        generatedAt: new Date().toISOString(),
      };
      
      // Save JSON report
      const jsonReportPath = path.join(config.storage.reportsDir, `performance-report-${Date.now()}.json`);
      await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
      
      // Generate HTML report
      const htmlReport = this.generateHtmlReport(reportData);
      const htmlReportPath = path.join(config.storage.reportsDir, `performance-report-${Date.now()}.html`);
      await fs.writeFile(htmlReportPath, htmlReport);
      
      console.log(`Performance report generated: ${htmlReportPath}`);
      
      return {
        jsonReport: jsonReportPath,
        htmlReport: htmlReportPath,
      };
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }
  
  generateHtmlReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Nakes Link Performance Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .chart-container { margin: 30px 0; }
        .alerts-section { margin: 30px 0; }
        .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .alert-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .alert-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Nakes Link Performance Report</h1>
            <p>Generated on ${data.generatedAt}</p>
            <p>Monitoring Period: ${data.summary.period?.start} to ${data.summary.period?.end}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${data.summary.cpu?.current?.toFixed(1) || 'N/A'}%</div>
                <div class="metric-label">Current CPU Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.memory?.current?.toFixed(1) || 'N/A'}%</div>
                <div class="metric-label">Current Memory Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.responseTime?.current?.toFixed(0) || 'N/A'}ms</div>
                <div class="metric-label">Current Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.database?.activeConnections || 'N/A'}</div>
                <div class="metric-label">Active DB Connections</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>Performance Trends</h2>
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>
        
        <div class="alerts-section">
            <h2>Alerts Summary</h2>
            <p>Total Alerts: ${data.summary.alerts?.total || 0} (Critical: ${data.summary.alerts?.critical || 0}, Warning: ${data.summary.alerts?.warning || 0})</p>
            
            ${data.alerts.slice(-10).map(alert => `
                <div class="alert alert-${alert.severity}">
                    <strong>${alert.type.toUpperCase()}</strong> - ${alert.message}
                    <br><small>${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </div>
        
        <div class="summary-table">
            <h2>Performance Summary</h2>
            <table>
                <tr><th>Metric</th><th>Current</th><th>Average</th><th>Max</th><th>Min</th><th>Status</th></tr>
                <tr>
                    <td>CPU Usage (%)</td>
                    <td>${data.summary.cpu?.current?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.cpu?.average?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.cpu?.max?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.cpu?.min?.toFixed(1) || 'N/A'}</td>
                    <td class="${(data.summary.cpu?.current || 0) > 80 ? 'status-critical' : (data.summary.cpu?.current || 0) > 60 ? 'status-warning' : 'status-good'}">●</td>
                </tr>
                <tr>
                    <td>Memory Usage (%)</td>
                    <td>${data.summary.memory?.current?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.memory?.average?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.memory?.max?.toFixed(1) || 'N/A'}</td>
                    <td>${data.summary.memory?.min?.toFixed(1) || 'N/A'}</td>
                    <td class="${(data.summary.memory?.current || 0) > 85 ? 'status-critical' : (data.summary.memory?.current || 0) > 70 ? 'status-warning' : 'status-good'}">●</td>
                </tr>
                <tr>
                    <td>Response Time (ms)</td>
                    <td>${data.summary.responseTime?.current?.toFixed(0) || 'N/A'}</td>
                    <td>${data.summary.responseTime?.average?.toFixed(0) || 'N/A'}</td>
                    <td>${data.summary.responseTime?.max?.toFixed(0) || 'N/A'}</td>
                    <td>${data.summary.responseTime?.min?.toFixed(0) || 'N/A'}</td>
                    <td class="${(data.summary.responseTime?.current || 0) > 5000 ? 'status-critical' : (data.summary.responseTime?.current || 0) > 2000 ? 'status-warning' : 'status-good'}">●</td>
                </tr>
            </table>
        </div>
    </div>
    
    <script>
        // Performance chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        const metrics = ${JSON.stringify(data.metrics.slice(-50))}; // Last 50 data points
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
                datasets: [
                    {
                        label: 'CPU Usage (%)',
                        data: metrics.map(m => m.system.cpu.usage),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Memory Usage (%)',
                        data: metrics.map(m => m.system.memory.usage),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Response Time (ms)',
                        data: metrics.map(m => m.application.http.averageResponseTime),
                        borderColor: 'rgb(255, 205, 86)',
                        backgroundColor: 'rgba(255, 205, 86, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'System Performance Over Time'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
  
  async cleanup() {
    if (this.dbClient) {
      await this.dbClient.end();
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('Performance monitor cleaned up');
  }
}

// CLI interface
class PerformanceMonitorCLI {
  constructor() {
    this.monitor = new PerformanceMonitor();
  }
  
  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'start':
        await this.monitor.startMonitoring();
        break;
        
      case 'stop':
        await this.monitor.stopMonitoring();
        break;
        
      case 'status':
        console.log('Monitoring status:', this.monitor.isMonitoring ? 'Running' : 'Stopped');
        console.log('Metrics collected:', this.monitor.metrics.length);
        console.log('Alerts generated:', this.monitor.alerts.length);
        break;
        
      case 'report':
        const report = await this.monitor.generateReport();
        console.log('Report generated:', report);
        break;
        
      case 'summary':
        const summary = this.monitor.generateSummary();
        console.log('Performance Summary:');
        console.log(JSON.stringify(summary, null, 2));
        break;
        
      case 'dashboard':
        console.log(`Dashboard available at: http://localhost:${config.dashboard.port}`);
        break;
        
      default:
        console.log('Usage: node performance-monitor.js [start|stop|status|report|summary|dashboard]');
        console.log('');
        console.log('Commands:');
        console.log('  start    - Start performance monitoring');
        console.log('  stop     - Stop performance monitoring');
        console.log('  status   - Show monitoring status');
        console.log('  report   - Generate performance report');
        console.log('  summary  - Show performance summary');
        console.log('  dashboard- Show dashboard URL');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.monitor) {
    await global.monitor.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (global.monitor) {
    await global.monitor.cleanup();
  }
  process.exit(0);
});

// Export for use as module
module.exports = {
  PerformanceMonitor,
  PerformanceMonitorCLI,
  config,
};

// Run CLI if called directly
if (require.main === module) {
  const cli = new PerformanceMonitorCLI();
  global.monitor = cli.monitor;
  cli.run().catch(console.error);
}