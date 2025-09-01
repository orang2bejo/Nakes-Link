const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * OWASP ZAP Security Audit Script
 * This script automates security testing using OWASP ZAP
 */

class SecurityAudit {
  constructor(options = {}) {
    this.zapUrl = options.zapUrl || 'http://localhost:8080';
    this.targetUrl = options.targetUrl || 'http://localhost:5000';
    this.apiKey = options.apiKey || process.env.ZAP_API_KEY;
    this.reportDir = options.reportDir || path.join(__dirname, '../reports/security');
    this.zapClient = axios.create({
      baseURL: this.zapUrl,
      timeout: 30000
    });
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }
  
  /**
   * Start OWASP ZAP daemon
   */
  async startZAP() {
    console.log('Starting OWASP ZAP...');
    
    return new Promise((resolve, reject) => {
      const zapProcess = spawn('zap.sh', ['-daemon', '-port', '8080'], {
        stdio: 'pipe'
      });
      
      zapProcess.stdout.on('data', (data) => {
        console.log(`ZAP: ${data}`);
        if (data.toString().includes('ZAP is now listening')) {
          resolve(zapProcess);
        }
      });
      
      zapProcess.stderr.on('data', (data) => {
        console.error(`ZAP Error: ${data}`);
      });
      
      zapProcess.on('error', (error) => {
        reject(error);
      });
      
      // Timeout after 60 seconds
      setTimeout(() => {
        reject(new Error('ZAP startup timeout'));
      }, 60000);
    });
  }
  
  /**
   * Check if ZAP is running
   */
  async isZAPRunning() {
    try {
      const response = await this.zapClient.get('/JSON/core/view/version/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Configure ZAP settings
   */
  async configureZAP() {
    console.log('Configuring ZAP settings...');
    
    try {
      // Set API key if provided
      if (this.apiKey) {
        await this.zapClient.get(`/JSON/core/action/setOptionApiKey/?apikey=${this.apiKey}&formParameters=`);
      }
      
      // Configure spider settings
      await this.zapClient.get('/JSON/spider/action/setOptionMaxDepth/?zapapiformat=JSON&formParameters=&maxDepth=5');
      await this.zapClient.get('/JSON/spider/action/setOptionMaxChildren/?zapapiformat=JSON&formParameters=&maxChildren=10');
      
      // Configure passive scanner
      await this.zapClient.get('/JSON/pscan/action/enableAllScanners/?zapapiformat=JSON&formParameters=');
      
      // Configure active scanner
      await this.zapClient.get('/JSON/ascan/action/enableAllScanners/?zapapiformat=JSON&formParameters=');
      
      console.log('ZAP configuration completed');
    } catch (error) {
      console.error('Error configuring ZAP:', error.message);
      throw error;
    }
  }
  
  /**
   * Add target URL to ZAP context
   */
  async addTargetToContext() {
    console.log(`Adding target ${this.targetUrl} to ZAP context...`);
    
    try {
      // Create a new context
      const contextResponse = await this.zapClient.get(`/JSON/context/action/newContext/?zapapiformat=JSON&formParameters=&contextName=NakesLinkContext`);
      const contextId = contextResponse.data.contextId;
      
      // Include target URL in context
      await this.zapClient.get(`/JSON/context/action/includeInContext/?zapapiformat=JSON&formParameters=&contextName=NakesLinkContext&regex=${encodeURIComponent(this.targetUrl + '.*')}`);
      
      console.log(`Target added to context with ID: ${contextId}`);
      return contextId;
    } catch (error) {
      console.error('Error adding target to context:', error.message);
      throw error;
    }
  }
  
  /**
   * Run spider scan
   */
  async runSpiderScan() {
    console.log('Starting spider scan...');
    
    try {
      // Start spider scan
      const spiderResponse = await this.zapClient.get(`/JSON/spider/action/scan/?zapapiformat=JSON&formParameters=&url=${encodeURIComponent(this.targetUrl)}`);
      const scanId = spiderResponse.data.scan;
      
      console.log(`Spider scan started with ID: ${scanId}`);
      
      // Wait for spider scan to complete
      let progress = 0;
      while (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await this.zapClient.get(`/JSON/spider/view/status/?zapapiformat=JSON&scanId=${scanId}`);
        progress = parseInt(statusResponse.data.status);
        
        console.log(`Spider scan progress: ${progress}%`);
      }
      
      console.log('Spider scan completed');
      return scanId;
    } catch (error) {
      console.error('Error running spider scan:', error.message);
      throw error;
    }
  }
  
  /**
   * Run active scan
   */
  async runActiveScan() {
    console.log('Starting active scan...');
    
    try {
      // Start active scan
      const scanResponse = await this.zapClient.get(`/JSON/ascan/action/scan/?zapapiformat=JSON&formParameters=&url=${encodeURIComponent(this.targetUrl)}`);
      const scanId = scanResponse.data.scan;
      
      console.log(`Active scan started with ID: ${scanId}`);
      
      // Wait for active scan to complete
      let progress = 0;
      while (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await this.zapClient.get(`/JSON/ascan/view/status/?zapapiformat=JSON&scanId=${scanId}`);
        progress = parseInt(statusResponse.data.status);
        
        console.log(`Active scan progress: ${progress}%`);
      }
      
      console.log('Active scan completed');
      return scanId;
    } catch (error) {
      console.error('Error running active scan:', error.message);
      throw error;
    }
  }
  
  /**
   * Get scan results
   */
  async getScanResults() {
    console.log('Retrieving scan results...');
    
    try {
      // Get alerts
      const alertsResponse = await this.zapClient.get('/JSON/core/view/alerts/?zapapiformat=JSON&formParameters=');
      const alerts = alertsResponse.data.alerts;
      
      // Get sites
      const sitesResponse = await this.zapClient.get('/JSON/core/view/sites/?zapapiformat=JSON&formParameters=');
      const sites = sitesResponse.data.sites;
      
      // Get URLs
      const urlsResponse = await this.zapClient.get('/JSON/core/view/urls/?zapapiformat=JSON&formParameters=');
      const urls = urlsResponse.data.urls;
      
      return {
        alerts,
        sites,
        urls,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving scan results:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate security report
   */
  async generateReport(results) {
    console.log('Generating security report...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(this.reportDir, `security-audit-${timestamp}.json`);
    const htmlReportFile = path.join(this.reportDir, `security-audit-${timestamp}.html`);
    
    // Save JSON report
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(results);
    fs.writeFileSync(htmlReportFile, htmlReport);
    
    // Generate summary
    const summary = this.generateSummary(results);
    
    console.log('Security report generated:');
    console.log(`JSON Report: ${reportFile}`);
    console.log(`HTML Report: ${htmlReportFile}`);
    console.log('\nSecurity Summary:');
    console.log(summary);
    
    return {
      jsonReport: reportFile,
      htmlReport: htmlReportFile,
      summary
    };
  }
  
  /**
   * Generate HTML report
   */
  generateHTMLReport(results) {
    const { alerts } = results;
    
    // Group alerts by risk level
    const alertsByRisk = {
      High: alerts.filter(a => a.risk === 'High'),
      Medium: alerts.filter(a => a.risk === 'Medium'),
      Low: alerts.filter(a => a.risk === 'Low'),
      Informational: alerts.filter(a => a.risk === 'Informational')
    };
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Nakes Link Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .risk-high { color: #d32f2f; }
        .risk-medium { color: #f57c00; }
        .risk-low { color: #388e3c; }
        .risk-info { color: #1976d2; }
        .alert { margin: 10px 0; padding: 15px; border-left: 4px solid #ccc; }
        .alert-high { border-left-color: #d32f2f; }
        .alert-medium { border-left-color: #f57c00; }
        .alert-low { border-left-color: #388e3c; }
        .alert-info { border-left-color: #1976d2; }
        .details { margin-top: 10px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Nakes Link Security Audit Report</h1>
        <p>Generated on: ${results.timestamp}</p>
        <p>Target: ${this.targetUrl}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <ul>
            <li class="risk-high">High Risk: ${alertsByRisk.High.length} issues</li>
            <li class="risk-medium">Medium Risk: ${alertsByRisk.Medium.length} issues</li>
            <li class="risk-low">Low Risk: ${alertsByRisk.Low.length} issues</li>
            <li class="risk-info">Informational: ${alertsByRisk.Informational.length} issues</li>
        </ul>
    </div>
    
    ${Object.entries(alertsByRisk).map(([risk, riskAlerts]) => `
        <h2 class="risk-${risk.toLowerCase()}">${risk} Risk Issues (${riskAlerts.length})</h2>
        ${riskAlerts.map(alert => `
            <div class="alert alert-${risk.toLowerCase()}">
                <h3>${alert.name}</h3>
                <p><strong>Description:</strong> ${alert.description}</p>
                <p><strong>URL:</strong> ${alert.url}</p>
                <div class="details">
                    <p><strong>Solution:</strong> ${alert.solution}</p>
                    <p><strong>Reference:</strong> ${alert.reference}</p>
                    <p><strong>CWE ID:</strong> ${alert.cweid}</p>
                    <p><strong>WASC ID:</strong> ${alert.wascid}</p>
                </div>
            </div>
        `).join('')}
    `).join('')}
    
    <div class="footer">
        <p>This report was generated using OWASP ZAP security scanner.</p>
    </div>
</body>
</html>
    `;
    
    return html;
  }
  
  /**
   * Generate summary
   */
  generateSummary(results) {
    const { alerts } = results;
    
    const summary = {
      totalIssues: alerts.length,
      highRisk: alerts.filter(a => a.risk === 'High').length,
      mediumRisk: alerts.filter(a => a.risk === 'Medium').length,
      lowRisk: alerts.filter(a => a.risk === 'Low').length,
      informational: alerts.filter(a => a.risk === 'Informational').length,
      criticalIssues: alerts.filter(a => a.risk === 'High').map(a => a.name),
      recommendations: this.getRecommendations(alerts)
    };
    
    return summary;
  }
  
  /**
   * Get security recommendations
   */
  getRecommendations(alerts) {
    const recommendations = [];
    
    // Check for common security issues
    const hasXSS = alerts.some(a => a.name.toLowerCase().includes('xss'));
    const hasSQLInjection = alerts.some(a => a.name.toLowerCase().includes('sql'));
    const hasCSRF = alerts.some(a => a.name.toLowerCase().includes('csrf'));
    const hasInsecureHeaders = alerts.some(a => a.name.toLowerCase().includes('header'));
    
    if (hasXSS) {
      recommendations.push('Implement proper input validation and output encoding to prevent XSS attacks');
    }
    
    if (hasSQLInjection) {
      recommendations.push('Use parameterized queries and input validation to prevent SQL injection');
    }
    
    if (hasCSRF) {
      recommendations.push('Implement CSRF tokens for state-changing operations');
    }
    
    if (hasInsecureHeaders) {
      recommendations.push('Configure security headers (CSP, HSTS, X-Frame-Options, etc.)');
    }
    
    // General recommendations
    recommendations.push('Regularly update dependencies and frameworks');
    recommendations.push('Implement proper authentication and authorization');
    recommendations.push('Use HTTPS for all communications');
    recommendations.push('Implement proper session management');
    recommendations.push('Regular security audits and penetration testing');
    
    return recommendations;
  }
  
  /**
   * Run complete security audit
   */
  async runAudit() {
    try {
      console.log('Starting Nakes Link Security Audit...');
      
      // Check if ZAP is running
      if (!(await this.isZAPRunning())) {
        console.log('ZAP is not running. Please start OWASP ZAP manually or install it.');
        console.log('Download from: https://www.zaproxy.org/download/');
        return;
      }
      
      // Configure ZAP
      await this.configureZAP();
      
      // Add target to context
      await this.addTargetToContext();
      
      // Run spider scan
      await this.runSpiderScan();
      
      // Run active scan
      await this.runActiveScan();
      
      // Get results
      const results = await this.getScanResults();
      
      // Generate report
      const report = await this.generateReport(results);
      
      console.log('\nSecurity audit completed successfully!');
      console.log('Please review the generated reports for security issues.');
      
      return report;
    } catch (error) {
      console.error('Security audit failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const audit = new SecurityAudit({
    targetUrl: process.argv[2] || 'http://localhost:5000',
    zapUrl: process.argv[3] || 'http://localhost:8080'
  });
  
  audit.runAudit()
    .then(() => {
      console.log('Audit completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Audit failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityAudit;