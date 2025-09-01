# Performance Testing Suite for Nakes Link Platform

This comprehensive performance testing suite provides tools for load testing, monitoring, and reporting on the Nakes Link telemedicine platform.

## 📋 Overview

The performance testing suite consists of several components:

- **Load Testing Configuration** (`load-testing-config.js`) - Centralized configuration for all test scenarios
- **K6 Load Test Script** (`k6-load-test.js`) - Main load testing script using K6
- **Performance Monitor** (`performance-monitor.js`) - Real-time system and database monitoring
- **Test Runner** (`test-runner.js`) - Orchestrates tests, monitoring, and reporting
- **Compliance Dashboard** (`../legal/compliance-dashboard.html`) - Legal compliance monitoring

## 🚀 Quick Start

### Prerequisites

1. **Install K6**:
   ```bash
   # Windows (using Chocolatey)
   choco install k6
   
   # Or download from https://k6.io/docs/getting-started/installation/
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install express socket.io nodemailer pg systeminformation
   ```

3. **Database Setup**:
   - Ensure PostgreSQL is running
   - Update database configuration in `load-testing-config.js`

4. **Environment Variables**:
   ```bash
   # Create .env file
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nakes_link_test
   DB_USER=your_user
   DB_PASSWORD=your_password
   
   # Optional: Notifications
   NOTIFICATIONS_ENABLED=true
   EMAIL_NOTIFICATIONS=true
   NOTIFICATION_RECIPIENTS=admin@nakeslink.com
   SLACK_NOTIFICATIONS=true
   SLACK_WEBHOOK_URL=your_slack_webhook
   ```

### Running Tests

#### 1. Single Test Scenario
```bash
# Run a basic load test
node performance/test-runner.js test basic

# Run stress test
node performance/test-runner.js test stress

# Run spike test
node performance/test-runner.js test spike
```

#### 2. Full Test Sequence
```bash
# Run all test scenarios
node performance/test-runner.js sequence

# Run specific scenarios
node performance/test-runner.js sequence basic stress spike
```

#### 3. Performance Monitoring
```bash
# Start real-time monitoring
node performance/performance-monitor.js start

# View monitoring dashboard
node performance/performance-monitor.js dashboard
# Then open http://localhost:3001
```

## 📊 Test Scenarios

### 1. Basic Load Test
- **Purpose**: Baseline performance testing
- **Duration**: 5 minutes
- **Users**: 10 → 50 → 10
- **Thresholds**:
  - Response time P95 < 500ms
  - Error rate < 1%
  - Throughput > 10 req/s

### 2. Stress Test
- **Purpose**: Find system breaking point
- **Duration**: 10 minutes
- **Users**: 50 → 200 → 50
- **Thresholds**:
  - Response time P95 < 1000ms
  - Error rate < 5%
  - Throughput > 50 req/s

### 3. Spike Test
- **Purpose**: Test sudden traffic spikes
- **Duration**: 8 minutes
- **Users**: 10 → 500 (spike) → 10
- **Thresholds**:
  - Response time P95 < 2000ms
  - Error rate < 10%
  - System recovery < 30s

### 4. Volume Test
- **Purpose**: Test with large data volumes
- **Duration**: 15 minutes
- **Users**: 100 steady users
- **Focus**: Database performance, memory usage

### 5. Endurance Test
- **Purpose**: Test system stability over time
- **Duration**: 30 minutes
- **Users**: 50 steady users
- **Focus**: Memory leaks, resource cleanup

## 🎯 User Journey Testing

The load tests simulate realistic user behaviors:

### Patient Journey
1. **Registration/Login** (20%)
   - Create account
   - Verify email
   - Complete profile

2. **Doctor Search & Booking** (40%)
   - Search doctors by specialty
   - View doctor profiles
   - Book consultation
   - Make payment

3. **Consultation** (25%)
   - Join video call
   - Chat with doctor
   - Receive prescription

4. **History & Profile** (15%)
   - View consultation history
   - Update profile
   - Download documents

### Healthcare Professional Journey
1. **Login & Dashboard** (30%)
   - Authenticate
   - View schedule
   - Check notifications

2. **Patient Management** (40%)
   - Accept consultations
   - Conduct video calls
   - Write prescriptions
   - Update patient records

3. **Schedule Management** (20%)
   - Update availability
   - Set consultation fees
   - Manage time slots

4. **Reports & Analytics** (10%)
   - View earnings
   - Patient statistics
   - Performance metrics

### Admin Journey
1. **Dashboard Monitoring** (40%)
   - System health
   - User analytics
   - Transaction monitoring

2. **User Management** (30%)
   - Verify healthcare professionals
   - Manage user accounts
   - Handle disputes

3. **Content Management** (20%)
   - Update platform content
   - Manage specialties
   - Configure settings

4. **Reports** (10%)
   - Generate reports
   - Export data
   - Compliance checks

## 📈 Performance Metrics

### Response Time Metrics
- **Average Response Time**: Mean response time across all requests
- **P50 (Median)**: 50% of requests complete within this time
- **P90**: 90% of requests complete within this time
- **P95**: 95% of requests complete within this time
- **P99**: 99% of requests complete within this time

### Throughput Metrics
- **Requests per Second (RPS)**: Total requests processed per second
- **Transactions per Second (TPS)**: Business transactions per second
- **Data Throughput**: MB/s of data transferred

### Error Metrics
- **Error Rate**: Percentage of failed requests
- **Error Types**: HTTP 4xx, 5xx, timeouts, connection errors
- **Error Distribution**: Errors by endpoint and user journey

### System Metrics
- **CPU Usage**: Processor utilization percentage
- **Memory Usage**: RAM consumption and availability
- **Disk I/O**: Read/write operations and latency
- **Network I/O**: Bandwidth utilization

### Database Metrics
- **Connection Pool**: Active/idle connections
- **Query Performance**: Slow queries and execution times
- **Cache Hit Ratio**: Database cache effectiveness
- **Lock Contention**: Database locking issues

## 🔧 Configuration

### Test Environment Setup

```javascript
// load-testing-config.js
const config = {
  environment: {
    name: 'staging', // or 'production'
    baseUrl: 'https://staging.nakeslink.com',
    apiUrl: 'https://api-staging.nakeslink.com',
  },
  
  database: {
    host: 'localhost',
    port: 5432,
    database: 'nakes_link_test',
    // ... other config
  },
  
  scenarios: {
    basic: {
      duration: '5m',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 10 },
      ],
      thresholds: {
        'http_req_duration': ['p(95)<500'],
        'http_req_failed': ['rate<0.01'],
        'http_reqs': ['rate>10'],
      },
    },
    // ... other scenarios
  },
};
```

### Monitoring Configuration

```javascript
// performance-monitor.js
const monitorConfig = {
  intervals: {
    metrics: 5000,      // Collect metrics every 5 seconds
    alerts: 10000,      // Check alerts every 10 seconds
    cleanup: 300000,    // Cleanup old data every 5 minutes
  },
  
  thresholds: {
    cpu: 80,           // CPU usage > 80%
    memory: 85,        // Memory usage > 85%
    disk: 90,          // Disk usage > 90%
    responseTime: 1000, // Response time > 1000ms
    errorRate: 5,      // Error rate > 5%
  },
};
```

## 📊 Reports and Analysis

### Automated Reports

The test runner generates comprehensive reports in multiple formats:

1. **JSON Report**: Machine-readable detailed results
2. **HTML Report**: Interactive dashboard with charts
3. **CSV Report**: Spreadsheet-compatible data export

### Report Contents

- **Executive Summary**: High-level metrics and pass/fail status
- **Performance Trends**: Response time and throughput over time
- **Error Analysis**: Error distribution and root cause analysis
- **Resource Utilization**: System resource consumption
- **Threshold Validation**: Performance criteria compliance
- **Recommendations**: Optimization suggestions

### Sample HTML Report Features

- 📊 Interactive charts using Chart.js
- 📈 Real-time performance trends
- 🎯 Threshold compliance indicators
- 📋 Detailed test results tables
- 🔍 Drill-down capabilities
- 📱 Responsive design for mobile viewing

## 🚨 Monitoring and Alerting

### Real-time Monitoring

The performance monitor provides:

- **Live Dashboard**: Real-time metrics visualization
- **WebSocket Updates**: Instant metric updates
- **Historical Data**: Trend analysis and comparison
- **Alert Management**: Threshold-based notifications

### Alert Types

1. **Performance Alerts**:
   - High response times
   - Increased error rates
   - Low throughput

2. **System Alerts**:
   - High CPU/Memory usage
   - Disk space issues
   - Network problems

3. **Database Alerts**:
   - Connection pool exhaustion
   - Slow queries
   - Lock contention

### Notification Channels

- **Email**: Detailed alert information
- **Slack**: Real-time team notifications
- **Webhook**: Custom integrations
- **Dashboard**: Visual indicators

## 🔍 Troubleshooting

### Common Issues

#### 1. K6 Installation Issues
```bash
# Verify K6 installation
k6 version

# If not found, install using:
# Windows: choco install k6
# macOS: brew install k6
# Linux: sudo apt-get install k6
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Verify credentials in config
# Update load-testing-config.js with correct DB settings
```

#### 3. High Error Rates
- Check application logs
- Verify database connections
- Monitor system resources
- Review test data validity

#### 4. Performance Degradation
- Analyze slow queries
- Check memory leaks
- Review caching strategies
- Monitor third-party services

### Debug Mode

```bash
# Enable verbose logging
DEBUG=true node performance/test-runner.js test basic

# Monitor system resources during test
node performance/performance-monitor.js start &
node performance/test-runner.js test stress
```

### Log Analysis

```bash
# View test logs
tail -f performance/logs/test-runner.log

# View monitoring logs
tail -f performance/logs/performance-monitor.log

# Analyze K6 output
cat performance/results/basic-*.json | jq '.metrics'
```

## 🎯 Best Practices

### Test Design

1. **Realistic User Behavior**:
   - Model actual user journeys
   - Include think time between actions
   - Vary user behavior patterns

2. **Data Management**:
   - Use fresh test data for each run
   - Clean up test data after runs
   - Avoid data conflicts between tests

3. **Environment Isolation**:
   - Use dedicated test environment
   - Mirror production configuration
   - Isolate from development activities

### Performance Optimization

1. **Database Optimization**:
   - Index frequently queried columns
   - Optimize slow queries
   - Configure connection pooling
   - Monitor cache hit ratios

2. **Application Optimization**:
   - Implement caching strategies
   - Optimize API endpoints
   - Use compression
   - Minimize database calls

3. **Infrastructure Optimization**:
   - Scale horizontally when needed
   - Monitor resource utilization
   - Implement load balancing
   - Use CDN for static assets

### Continuous Testing

1. **CI/CD Integration**:
   ```bash
   # Add to your CI pipeline
   npm run test:performance
   ```

2. **Scheduled Testing**:
   ```bash
   # Cron job for daily performance tests
   0 2 * * * cd /path/to/nakes-link && node performance/test-runner.js sequence
   ```

3. **Performance Budgets**:
   - Set performance thresholds
   - Fail builds on regression
   - Track performance trends

## 📚 Additional Resources

### Documentation
- [K6 Documentation](https://k6.io/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

### Tools Integration
- **Grafana**: For advanced visualization
- **Prometheus**: For metrics collection
- **New Relic**: For APM monitoring
- **DataDog**: For infrastructure monitoring

### Performance Testing Resources
- [Performance Testing Patterns](https://k6.io/docs/testing-guides/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/automated-performance-testing/)
- [API Performance Testing](https://k6.io/docs/testing-guides/api-load-testing/)

## 🤝 Contributing

To contribute to the performance testing suite:

1. **Fork the repository**
2. **Create a feature branch**
3. **Add tests for new features**
4. **Update documentation**
5. **Submit a pull request**

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/nakes-link.git
cd nakes-link

# Install dependencies
npm install

# Run tests
npm run test:performance
```

## 📄 License

This performance testing suite is part of the Nakes Link platform and is subject to the same licensing terms.

---

**Need Help?** 
- 📧 Email: support@nakeslink.com
- 💬 Slack: #performance-testing
- 📖 Wiki: [Performance Testing Guide](https://wiki.nakeslink.com/performance)

**Last Updated**: December 2024
**Version**: 1.0.0