// Performance Test Runner for Nakes Link Platform
// This script orchestrates load testing, monitoring, and reporting

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { PerformanceMonitor } = require('./performance-monitor');
const { config } = require('./load-testing-config');

class PerformanceTestRunner {
  constructor() {
    this.monitor = new PerformanceMonitor();
    this.testResults = [];
    this.isRunning = false;
    this.currentTest = null;
    this.startTime = null;
    this.endTime = null;
    
    this.config = {
      scenarios: ['basic', 'stress', 'spike', 'volume', 'endurance'],
      outputDir: './performance/results',
      reportsDir: './performance/reports',
      k6Binary: 'k6', // Assumes k6 is installed globally
      testScript: './performance/k6-load-test.js',
      
      // Test sequence configuration
      sequence: {
        enabled: true,
        delayBetweenTests: 60000, // 1 minute
        warmupDelay: 30000, // 30 seconds
      },
      
      // Monitoring configuration
      monitoring: {
        enabled: true,
        startDelay: 10000, // 10 seconds before test
        stopDelay: 30000, // 30 seconds after test
      },
      
      // Reporting configuration
      reporting: {
        enabled: true,
        formats: ['json', 'html', 'csv'],
        includeCharts: true,
        includeComparison: true,
      },
      
      // Notification configuration
      notifications: {
        enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
        email: {
          enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
          recipients: (process.env.NOTIFICATION_RECIPIENTS || '').split(','),
        },
        slack: {
          enabled: process.env.SLACK_NOTIFICATIONS === 'true',
          webhook: process.env.SLACK_WEBHOOK_URL,
        },
      },
    };
  }
  
  async initialize() {
    try {
      // Create output directories
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(this.config.reportsDir, { recursive: true });
      
      // Verify k6 installation
      await this.verifyK6Installation();
      
      // Initialize monitoring
      if (this.config.monitoring.enabled) {
        console.log('Initializing performance monitoring...');
        // Monitor is already initialized in constructor
      }
      
      console.log('Performance test runner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test runner:', error);
      throw error;
    }
  }
  
  async verifyK6Installation() {
    return new Promise((resolve, reject) => {
      exec('k6 version', (error, stdout, stderr) => {
        if (error) {
          reject(new Error('k6 is not installed or not in PATH. Please install k6 first.'));
        } else {
          console.log('k6 version:', stdout.trim());
          resolve();
        }
      });
    });
  }
  
  async runSingleTest(scenario, options = {}) {
    if (this.isRunning) {
      throw new Error('A test is already running');
    }
    
    console.log(`\n🚀 Starting ${scenario} load test...`);
    this.isRunning = true;
    this.currentTest = scenario;
    this.startTime = Date.now();
    
    try {
      // Start monitoring if enabled
      if (this.config.monitoring.enabled) {
        console.log('Starting performance monitoring...');
        setTimeout(() => {
          this.monitor.startMonitoring();
        }, this.config.monitoring.startDelay);
      }
      
      // Warmup delay
      if (this.config.sequence.warmupDelay > 0) {
        console.log(`Warming up for ${this.config.sequence.warmupDelay / 1000} seconds...`);
        await this.delay(this.config.sequence.warmupDelay);
      }
      
      // Run k6 test
      const testResult = await this.executeK6Test(scenario, options);
      
      // Stop monitoring with delay
      if (this.config.monitoring.enabled) {
        setTimeout(() => {
          this.monitor.stopMonitoring();
        }, this.config.monitoring.stopDelay);
      }
      
      this.endTime = Date.now();
      
      // Process and store results
      const processedResult = await this.processTestResult(scenario, testResult);
      this.testResults.push(processedResult);
      
      console.log(`✅ ${scenario} test completed successfully`);
      
      return processedResult;
      
    } catch (error) {
      console.error(`❌ ${scenario} test failed:`, error.message);
      
      // Stop monitoring on error
      if (this.config.monitoring.enabled) {
        await this.monitor.stopMonitoring();
      }
      
      throw error;
    } finally {
      this.isRunning = false;
      this.currentTest = null;
    }
  }
  
  async executeK6Test(scenario, options = {}) {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(this.config.outputDir, `${scenario}-${Date.now()}.json`);
      
      const k6Args = [
        'run',
        '--out', `json=${outputFile}`,
        '--env', `SCENARIO=${scenario}`,
        this.config.testScript,
      ];
      
      // Add custom options
      if (options.vus) {
        k6Args.push('--vus', options.vus.toString());
      }
      
      if (options.duration) {
        k6Args.push('--duration', options.duration);
      }
      
      console.log(`Executing: k6 ${k6Args.join(' ')}`);
      
      const k6Process = spawn(this.config.k6Binary, k6Args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      let stdout = '';
      let stderr = '';
      
      k6Process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output.trim());
      });
      
      k6Process.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(output.trim());
      });
      
      k6Process.on('close', async (code) => {
        if (code === 0) {
          try {
            // Read and parse k6 output
            const rawResults = await fs.readFile(outputFile, 'utf8');
            const results = this.parseK6Output(rawResults);
            
            resolve({
              scenario,
              exitCode: code,
              stdout,
              stderr,
              outputFile,
              results,
              duration: Date.now() - this.startTime,
            });
          } catch (error) {
            reject(new Error(`Failed to parse k6 output: ${error.message}`));
          }
        } else {
          reject(new Error(`k6 process exited with code ${code}\nStderr: ${stderr}`));
        }
      });
      
      k6Process.on('error', (error) => {
        reject(new Error(`Failed to start k6 process: ${error.message}`));
      });
    });
  }
  
  parseK6Output(rawOutput) {
    const lines = rawOutput.trim().split('\n');
    const metrics = {};
    const dataPoints = [];
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'Metric') {
          metrics[data.metric] = data.data;
        } else if (data.type === 'Point') {
          dataPoints.push(data.data);
        }
      } catch (error) {
        // Skip invalid JSON lines
      }
    }
    
    return {
      metrics,
      dataPoints,
      summary: this.calculateSummaryMetrics(dataPoints),
    };
  }
  
  calculateSummaryMetrics(dataPoints) {
    if (dataPoints.length === 0) {
      return {};
    }
    
    const httpReqDurations = dataPoints
      .filter(p => p.metric === 'http_req_duration')
      .map(p => p.value);
    
    const httpReqs = dataPoints.filter(p => p.metric === 'http_reqs').length;
    const httpReqFailed = dataPoints.filter(p => p.metric === 'http_req_failed' && p.value > 0).length;
    
    const responseTimes = httpReqDurations.sort((a, b) => a - b);
    
    return {
      totalRequests: httpReqs,
      failedRequests: httpReqFailed,
      errorRate: httpReqs > 0 ? (httpReqFailed / httpReqs) * 100 : 0,
      responseTime: {
        min: Math.min(...responseTimes) || 0,
        max: Math.max(...responseTimes) || 0,
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
        p50: this.percentile(responseTimes, 50),
        p90: this.percentile(responseTimes, 90),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99),
      },
    };
  }
  
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  }
  
  async processTestResult(scenario, testResult) {
    const processedResult = {
      scenario,
      timestamp: new Date().toISOString(),
      duration: testResult.duration,
      exitCode: testResult.exitCode,
      success: testResult.exitCode === 0,
      results: testResult.results,
      outputFile: testResult.outputFile,
      
      // Performance metrics
      metrics: {
        totalRequests: testResult.results.summary.totalRequests,
        failedRequests: testResult.results.summary.failedRequests,
        errorRate: testResult.results.summary.errorRate,
        responseTime: testResult.results.summary.responseTime,
        throughput: testResult.results.summary.totalRequests / (testResult.duration / 1000),
      },
      
      // Threshold validation
      thresholds: this.validateThresholds(scenario, testResult.results.summary),
    };
    
    // Save individual test result
    const resultFile = path.join(this.config.outputDir, `${scenario}-result-${Date.now()}.json`);
    await fs.writeFile(resultFile, JSON.stringify(processedResult, null, 2));
    
    return processedResult;
  }
  
  validateThresholds(scenario, summary) {
    const scenarioConfig = config.config.scenarios[scenario];
    const thresholds = scenarioConfig?.thresholds || {};
    const validation = {};
    
    // Validate response time thresholds
    if (thresholds['http_req_duration']) {
      const threshold = thresholds['http_req_duration'][0];
      const match = threshold.match(/p\((\d+)\)<(\d+)/);
      if (match) {
        const percentile = parseInt(match[1]);
        const limit = parseInt(match[2]);
        const actual = summary.responseTime[`p${percentile}`];
        
        validation.responseTime = {
          threshold: `p${percentile} < ${limit}ms`,
          actual: `${actual.toFixed(2)}ms`,
          passed: actual < limit,
        };
      }
    }
    
    // Validate error rate thresholds
    if (thresholds['http_req_failed']) {
      const threshold = thresholds['http_req_failed'][0];
      const match = threshold.match(/rate<([\d.]+)/);
      if (match) {
        const limit = parseFloat(match[1]) * 100; // Convert to percentage
        const actual = summary.errorRate;
        
        validation.errorRate = {
          threshold: `< ${limit}%`,
          actual: `${actual.toFixed(2)}%`,
          passed: actual < limit,
        };
      }
    }
    
    // Validate throughput thresholds
    if (thresholds['http_reqs']) {
      const threshold = thresholds['http_reqs'][0];
      const match = threshold.match(/rate>(\d+)/);
      if (match) {
        const limit = parseInt(match[1]);
        const actual = summary.totalRequests / 60; // Assuming 1-minute test
        
        validation.throughput = {
          threshold: `> ${limit} req/s`,
          actual: `${actual.toFixed(2)} req/s`,
          passed: actual > limit,
        };
      }
    }
    
    return validation;
  }
  
  async runTestSequence(scenarios = null) {
    if (this.isRunning) {
      throw new Error('A test sequence is already running');
    }
    
    const testScenarios = scenarios || this.config.scenarios;
    console.log(`\n🎯 Starting test sequence: ${testScenarios.join(', ')}`);
    
    const sequenceResults = [];
    const sequenceStartTime = Date.now();
    
    try {
      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        
        console.log(`\n📊 Running test ${i + 1}/${testScenarios.length}: ${scenario}`);
        
        const result = await this.runSingleTest(scenario);
        sequenceResults.push(result);
        
        // Delay between tests (except for the last one)
        if (i < testScenarios.length - 1 && this.config.sequence.delayBetweenTests > 0) {
          console.log(`⏳ Waiting ${this.config.sequence.delayBetweenTests / 1000} seconds before next test...`);
          await this.delay(this.config.sequence.delayBetweenTests);
        }
      }
      
      const sequenceEndTime = Date.now();
      const sequenceDuration = sequenceEndTime - sequenceStartTime;
      
      console.log(`\n✅ Test sequence completed in ${(sequenceDuration / 1000 / 60).toFixed(2)} minutes`);
      
      // Generate consolidated report
      if (this.config.reporting.enabled) {
        await this.generateConsolidatedReport(sequenceResults, {
          startTime: sequenceStartTime,
          endTime: sequenceEndTime,
          duration: sequenceDuration,
        });
      }
      
      // Send notifications
      if (this.config.notifications.enabled) {
        await this.sendNotifications(sequenceResults);
      }
      
      return {
        success: true,
        results: sequenceResults,
        duration: sequenceDuration,
        summary: this.generateSequenceSummary(sequenceResults),
      };
      
    } catch (error) {
      console.error('❌ Test sequence failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        results: sequenceResults,
        duration: Date.now() - sequenceStartTime,
      };
    }
  }
  
  generateSequenceSummary(results) {
    const summary = {
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      totalRequests: results.reduce((sum, r) => sum + (r.metrics?.totalRequests || 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r.metrics?.failedRequests || 0), 0),
      averageResponseTime: 0,
      averageErrorRate: 0,
      thresholdsPassed: 0,
      thresholdsFailed: 0,
    };
    
    if (results.length > 0) {
      summary.averageResponseTime = results.reduce((sum, r) => {
        return sum + (r.metrics?.responseTime?.avg || 0);
      }, 0) / results.length;
      
      summary.averageErrorRate = results.reduce((sum, r) => {
        return sum + (r.metrics?.errorRate || 0);
      }, 0) / results.length;
      
      // Count threshold validations
      results.forEach(r => {
        if (r.thresholds) {
          Object.values(r.thresholds).forEach(threshold => {
            if (threshold.passed) {
              summary.thresholdsPassed++;
            } else {
              summary.thresholdsFailed++;
            }
          });
        }
      });
    }
    
    return summary;
  }
  
  async generateConsolidatedReport(results, sequenceInfo) {
    try {
      const reportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          platform: 'Nakes Link',
          testRunner: 'Performance Test Runner v1.0',
          sequence: sequenceInfo,
        },
        summary: this.generateSequenceSummary(results),
        results: results,
        comparison: this.generateComparison(results),
      };
      
      // Generate JSON report
      const jsonReportPath = path.join(
        this.config.reportsDir,
        `consolidated-report-${Date.now()}.json`
      );
      await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
      
      // Generate HTML report
      if (this.config.reporting.formats.includes('html')) {
        const htmlReport = this.generateHtmlReport(reportData);
        const htmlReportPath = path.join(
          this.config.reportsDir,
          `consolidated-report-${Date.now()}.html`
        );
        await fs.writeFile(htmlReportPath, htmlReport);
        console.log(`📄 HTML report generated: ${htmlReportPath}`);
      }
      
      // Generate CSV report
      if (this.config.reporting.formats.includes('csv')) {
        const csvReport = this.generateCsvReport(reportData);
        const csvReportPath = path.join(
          this.config.reportsDir,
          `consolidated-report-${Date.now()}.csv`
        );
        await fs.writeFile(csvReportPath, csvReport);
        console.log(`📊 CSV report generated: ${csvReportPath}`);
      }
      
      console.log(`📋 JSON report generated: ${jsonReportPath}`);
      
      return {
        json: jsonReportPath,
        html: this.config.reporting.formats.includes('html') ? htmlReportPath : null,
        csv: this.config.reporting.formats.includes('csv') ? csvReportPath : null,
      };
      
    } catch (error) {
      console.error('Failed to generate consolidated report:', error);
      throw error;
    }
  }
  
  generateComparison(results) {
    const comparison = {};
    
    results.forEach(result => {
      comparison[result.scenario] = {
        responseTime: result.metrics?.responseTime || {},
        errorRate: result.metrics?.errorRate || 0,
        throughput: result.metrics?.throughput || 0,
        thresholdsPassed: Object.values(result.thresholds || {}).filter(t => t.passed).length,
        thresholdsFailed: Object.values(result.thresholds || {}).filter(t => !t.passed).length,
      };
    });
    
    return comparison;
  }
  
  generateHtmlReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Nakes Link Performance Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 5px solid #007bff; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 1.1em; }
        .summary-value { font-size: 2.5em; font-weight: bold; color: #007bff; margin: 10px 0; }
        .summary-label { color: #6c757d; font-size: 0.9em; }
        .chart-section { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .results-table { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 15px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #dee2e6; }
        td { padding: 15px; border-bottom: 1px solid #dee2e6; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .threshold-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .threshold-pass { background: #d4edda; color: #155724; }
        .threshold-fail { background: #f8d7da; color: #721c24; }
        .scenario-header { background: #e9ecef; padding: 10px 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Nakes Link Performance Test Report</h1>
            <p>Generated on ${data.metadata.generatedAt}</p>
            <p>Test Duration: ${(data.metadata.sequence.duration / 1000 / 60).toFixed(2)} minutes</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="summary-value">${data.summary.totalTests}</div>
                <div class="summary-label">Scenarios executed</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="summary-value">${((data.summary.passedTests / data.summary.totalTests) * 100).toFixed(1)}%</div>
                <div class="summary-label">${data.summary.passedTests}/${data.summary.totalTests} tests passed</div>
            </div>
            <div class="summary-card">
                <h3>Total Requests</h3>
                <div class="summary-value">${data.summary.totalRequests.toLocaleString()}</div>
                <div class="summary-label">Across all scenarios</div>
            </div>
            <div class="summary-card">
                <h3>Average Response Time</h3>
                <div class="summary-value">${data.summary.averageResponseTime.toFixed(0)}ms</div>
                <div class="summary-label">Across all scenarios</div>
            </div>
            <div class="summary-card">
                <h3>Error Rate</h3>
                <div class="summary-value">${data.summary.averageErrorRate.toFixed(2)}%</div>
                <div class="summary-label">${data.summary.totalErrors} total errors</div>
            </div>
            <div class="summary-card">
                <h3>Thresholds</h3>
                <div class="summary-value">${data.summary.thresholdsPassed}/${data.summary.thresholdsPassed + data.summary.thresholdsFailed}</div>
                <div class="summary-label">Passed validation</div>
            </div>
        </div>
        
        <div class="chart-section">
            <h2>Performance Comparison</h2>
            <div class="chart-container">
                <canvas id="comparisonChart"></canvas>
            </div>
        </div>
        
        <div class="results-table">
            <h2 style="padding: 20px 20px 0 20px; margin: 0;">Detailed Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Status</th>
                        <th>Requests</th>
                        <th>Errors</th>
                        <th>Avg Response Time</th>
                        <th>P95 Response Time</th>
                        <th>Throughput</th>
                        <th>Thresholds</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.results.map(result => `
                        <tr>
                            <td class="scenario-header">${result.scenario.toUpperCase()}</td>
                            <td class="${result.success ? 'status-pass' : 'status-fail'}">
                                ${result.success ? '✅ PASS' : '❌ FAIL'}
                            </td>
                            <td>${(result.metrics?.totalRequests || 0).toLocaleString()}</td>
                            <td>${(result.metrics?.failedRequests || 0).toLocaleString()} (${(result.metrics?.errorRate || 0).toFixed(2)}%)</td>
                            <td>${(result.metrics?.responseTime?.avg || 0).toFixed(2)}ms</td>
                            <td>${(result.metrics?.responseTime?.p95 || 0).toFixed(2)}ms</td>
                            <td>${(result.metrics?.throughput || 0).toFixed(2)} req/s</td>
                            <td>
                                ${Object.entries(result.thresholds || {}).map(([key, threshold]) => `
                                    <span class="threshold-badge ${threshold.passed ? 'threshold-pass' : 'threshold-fail'}">
                                        ${key}: ${threshold.passed ? 'PASS' : 'FAIL'}
                                    </span>
                                `).join(' ')}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        // Performance comparison chart
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        const scenarios = ${JSON.stringify(data.results.map(r => r.scenario))};
        const responseTimes = ${JSON.stringify(data.results.map(r => r.metrics?.responseTime?.avg || 0))};
        const errorRates = ${JSON.stringify(data.results.map(r => r.metrics?.errorRate || 0))};
        const throughputs = ${JSON.stringify(data.results.map(r => r.metrics?.throughput || 0))};
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [
                    {
                        label: 'Avg Response Time (ms)',
                        data: responseTimes,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Error Rate (%)',
                        data: errorRates,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Throughput (req/s)',
                        data: throughputs,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Metrics by Scenario'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Error Rate (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
  
  generateCsvReport(data) {
    const headers = [
      'Scenario',
      'Status',
      'Total Requests',
      'Failed Requests',
      'Error Rate (%)',
      'Avg Response Time (ms)',
      'P50 Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)',
      'Throughput (req/s)',
      'Duration (ms)',
      'Thresholds Passed',
      'Thresholds Failed'
    ];
    
    const rows = data.results.map(result => [
      result.scenario,
      result.success ? 'PASS' : 'FAIL',
      result.metrics?.totalRequests || 0,
      result.metrics?.failedRequests || 0,
      (result.metrics?.errorRate || 0).toFixed(2),
      (result.metrics?.responseTime?.avg || 0).toFixed(2),
      (result.metrics?.responseTime?.p50 || 0).toFixed(2),
      (result.metrics?.responseTime?.p95 || 0).toFixed(2),
      (result.metrics?.responseTime?.p99 || 0).toFixed(2),
      (result.metrics?.throughput || 0).toFixed(2),
      result.duration,
      Object.values(result.thresholds || {}).filter(t => t.passed).length,
      Object.values(result.thresholds || {}).filter(t => !t.passed).length
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  async sendNotifications(results) {
    try {
      const summary = this.generateSequenceSummary(results);
      const message = this.formatNotificationMessage(summary, results);
      
      // Send email notification
      if (this.config.notifications.email.enabled) {
        await this.sendEmailNotification(message, summary);
      }
      
      // Send Slack notification
      if (this.config.notifications.slack.enabled) {
        await this.sendSlackNotification(message, summary);
      }
      
      console.log('📧 Notifications sent successfully');
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }
  
  formatNotificationMessage(summary, results) {
    const status = summary.failedTests === 0 ? '✅ PASSED' : '❌ FAILED';
    const successRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
    
    return {
      subject: `Nakes Link Performance Test ${status}`,
      text: `
Performance Test Results Summary:

Status: ${status}
Success Rate: ${successRate}% (${summary.passedTests}/${summary.totalTests})
Total Requests: ${summary.totalRequests.toLocaleString()}
Total Errors: ${summary.totalErrors.toLocaleString()}
Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms
Average Error Rate: ${summary.averageErrorRate.toFixed(2)}%
Thresholds: ${summary.thresholdsPassed} passed, ${summary.thresholdsFailed} failed

Scenario Results:
${results.map(r => `- ${r.scenario}: ${r.success ? 'PASS' : 'FAIL'} (${(r.metrics?.responseTime?.avg || 0).toFixed(2)}ms avg, ${(r.metrics?.errorRate || 0).toFixed(2)}% errors)`).join('\n')}
      `,
      html: `
<h2>🏥 Nakes Link Performance Test Results</h2>
<p><strong>Status:</strong> ${status}</p>
<p><strong>Success Rate:</strong> ${successRate}% (${summary.passedTests}/${summary.totalTests})</p>
<p><strong>Total Requests:</strong> ${summary.totalRequests.toLocaleString()}</p>
<p><strong>Total Errors:</strong> ${summary.totalErrors.toLocaleString()}</p>
<p><strong>Average Response Time:</strong> ${summary.averageResponseTime.toFixed(2)}ms</p>
<p><strong>Average Error Rate:</strong> ${summary.averageErrorRate.toFixed(2)}%</p>
<p><strong>Thresholds:</strong> ${summary.thresholdsPassed} passed, ${summary.thresholdsFailed} failed</p>

<h3>Scenario Results:</h3>
<ul>
${results.map(r => `<li><strong>${r.scenario}:</strong> ${r.success ? '✅ PASS' : '❌ FAIL'} (${(r.metrics?.responseTime?.avg || 0).toFixed(2)}ms avg, ${(r.metrics?.errorRate || 0).toFixed(2)}% errors)</li>`).join('')}
</ul>
      `
    };
  }
  
  async sendEmailNotification(message, summary) {
    // This would integrate with your email service
    console.log('Email notification would be sent:', message.subject);
  }
  
  async sendSlackNotification(message, summary) {
    if (!this.config.notifications.slack.webhook) {
      console.log('Slack webhook not configured');
      return;
    }
    
    try {
      const response = await fetch(this.config.notifications.slack.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.subject,
          attachments: [
            {
              color: summary.failedTests === 0 ? 'good' : 'danger',
              fields: [
                {
                  title: 'Success Rate',
                  value: `${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`,
                  short: true
                },
                {
                  title: 'Total Requests',
                  value: summary.totalRequests.toLocaleString(),
                  short: true
                },
                {
                  title: 'Average Response Time',
                  value: `${summary.averageResponseTime.toFixed(2)}ms`,
                  short: true
                },
                {
                  title: 'Error Rate',
                  value: `${summary.averageErrorRate.toFixed(2)}%`,
                  short: true
                }
              ]
            }
          ]
        }),
      });
      
      if (response.ok) {
        console.log('Slack notification sent successfully');
      } else {
        console.error('Failed to send Slack notification:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async cleanup() {
    if (this.monitor) {
      await this.monitor.cleanup();
    }
    console.log('Test runner cleaned up');
  }
}

// CLI interface
class PerformanceTestCLI {
  constructor() {
    this.runner = new PerformanceTestRunner();
  }
  
  async run() {
    const command = process.argv[2];
    const scenario = process.argv[3];
    
    try {
      await this.runner.initialize();
      
      switch (command) {
        case 'test':
          if (scenario) {
            await this.runner.runSingleTest(scenario);
          } else {
            console.error('Please specify a scenario: basic, stress, spike, volume, or endurance');
          }
          break;
          
        case 'sequence':
          const scenarios = process.argv.slice(3);
          await this.runner.runTestSequence(scenarios.length > 0 ? scenarios : null);
          break;
          
        case 'monitor':
          await this.runner.monitor.startMonitoring();
          break;
          
        case 'report':
          if (this.runner.testResults.length > 0) {
            await this.runner.generateConsolidatedReport(this.runner.testResults, {
              startTime: Date.now() - 3600000,
              endTime: Date.now(),
              duration: 3600000
            });
          } else {
            console.log('No test results available. Run tests first.');
          }
          break;
          
        case 'status':
          console.log('Test Runner Status:');
          console.log('- Running:', this.runner.isRunning);
          console.log('- Current Test:', this.runner.currentTest || 'None');
          console.log('- Results Count:', this.runner.testResults.length);
          break;
          
        default:
          console.log('Nakes Link Performance Test Runner');
          console.log('');
          console.log('Usage: node test-runner.js [command] [options]');
          console.log('');
          console.log('Commands:');
          console.log('  test <scenario>     - Run a single test scenario');
          console.log('  sequence [scenarios]- Run test sequence (all or specified scenarios)');
          console.log('  monitor            - Start performance monitoring');
          console.log('  report             - Generate consolidated report');
          console.log('  status             - Show runner status');
          console.log('');
          console.log('Scenarios: basic, stress, spike, volume, endurance');
          console.log('');
          console.log('Examples:');
          console.log('  node test-runner.js test basic');
          console.log('  node test-runner.js sequence');
          console.log('  node test-runner.js sequence basic stress');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    } finally {
      await this.runner.cleanup();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.testRunner) {
    await global.testRunner.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (global.testRunner) {
    await global.testRunner.cleanup();
  }
  process.exit(0);
});

// Export for use as module
module.exports = {
  PerformanceTestRunner,
  PerformanceTestCLI,
};

// Run CLI if called directly
if (require.main === module) {
  const cli = new PerformanceTestCLI();
  global.testRunner = cli.runner;
  cli.run().catch(console.error);
}