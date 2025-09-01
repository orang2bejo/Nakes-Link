#!/usr/bin/env node

// Performance Testing Suite Setup Script
// This script helps set up the performance testing environment

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

class PerformanceTestingSetup {
  constructor() {
    this.platform = os.platform();
    this.setupSteps = [
      'checkNodeVersion',
      'createDirectories',
      'checkK6Installation',
      'createEnvFile',
      'validateDatabase',
      'installDependencies',
      'runInitialTest',
      'showCompletionMessage'
    ];
    
    this.requiredDirectories = [
      'results',
      'reports', 
      'logs',
      'temp',
      'backups'
    ];
    
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }
  
  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }
  
  logStep(step, message) {
    this.log(`\n🔧 [${step}] ${message}`, 'cyan');
  }
  
  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }
  
  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }
  
  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }
  
  async run() {
    try {
      this.log('\n🚀 Nakes Link Performance Testing Suite Setup', 'bright');
      this.log('=' .repeat(60), 'blue');
      
      for (const step of this.setupSteps) {
        await this[step]();
      }
      
      this.log('\n🎉 Setup completed successfully!', 'green');
      
    } catch (error) {
      this.logError(`Setup failed: ${error.message}`);
      this.log('\n📋 Troubleshooting steps:', 'yellow');
      this.log('1. Check Node.js version (>=16.0.0)');
      this.log('2. Install K6: https://k6.io/docs/getting-started/installation/');
      this.log('3. Verify PostgreSQL is running');
      this.log('4. Check network connectivity');
      this.log('5. Run setup again with: node setup.js');
      process.exit(1);
    }
  }
  
  async checkNodeVersion() {
    this.logStep('1/8', 'Checking Node.js version');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`);
    }
    
    this.logSuccess(`Node.js version ${nodeVersion} is supported`);
  }
  
  async createDirectories() {
    this.logStep('2/8', 'Creating required directories');
    
    for (const dir of this.requiredDirectories) {
      const dirPath = path.join(__dirname, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        this.logSuccess(`Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`Failed to create directory ${dir}: ${error.message}`);
        }
        this.log(`Directory already exists: ${dir}`);
      }
    }
  }
  
  async checkK6Installation() {
    this.logStep('3/8', 'Checking K6 installation');
    
    try {
      const version = await this.executeCommand('k6 version');
      this.logSuccess(`K6 is installed: ${version.trim()}`);
    } catch (error) {
      this.logWarning('K6 is not installed or not in PATH');
      this.log('\n📦 K6 Installation Instructions:', 'yellow');
      
      switch (this.platform) {
        case 'win32':
          this.log('Windows: choco install k6');
          this.log('Or download from: https://github.com/grafana/k6/releases');
          break;
        case 'darwin':
          this.log('macOS: brew install k6');
          break;
        case 'linux':
          this.log('Ubuntu/Debian: sudo apt-get install k6');
          this.log('CentOS/RHEL: sudo yum install k6');
          break;
        default:
          this.log('Download from: https://k6.io/docs/getting-started/installation/');
      }
      
      this.log('\nPlease install K6 and run setup again.', 'yellow');
      throw new Error('K6 installation required');
    }
  }
  
  async createEnvFile() {
    this.logStep('4/8', 'Creating environment configuration');
    
    const envPath = path.join(__dirname, '.env');
    
    try {
      await fs.access(envPath);
      this.log('.env file already exists');
      return;
    } catch (error) {
      // File doesn't exist, create it
    }
    
    const envContent = `# Nakes Link Performance Testing Environment Configuration
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nakes_link_test
DB_USER=postgres
DB_PASSWORD=your_password_here

# Test Environment
TEST_ENV=staging
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_PORT=3001
MONITORING_INTERVAL=5000

# Notification Configuration
NOTIFICATIONS_ENABLED=false
EMAIL_NOTIFICATIONS=false
NOTIFICATION_RECIPIENTS=admin@nakeslink.com

# Email Configuration (if enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Slack Configuration (if enabled)
SLACK_NOTIFICATIONS=false
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Performance Thresholds
RESPONSE_TIME_THRESHOLD=1000
ERROR_RATE_THRESHOLD=5
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85

# Test Data Configuration
TEST_DATA_SIZE=1000
TEST_USER_COUNT=100
TEST_DOCTOR_COUNT=50

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# External Services
SATUSEHAT_API_URL=https://api.satusehat.kemkes.go.id
SATUSEHAT_CLIENT_ID=your_client_id
SATUSEHAT_CLIENT_SECRET=your_client_secret

# Logging
LOG_LEVEL=info
LOG_FILE=logs/performance-testing.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Advanced Configuration
MAX_CONCURRENT_USERS=1000
TEST_TIMEOUT=300000
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
`;
    
    await fs.writeFile(envPath, envContent);
    this.logSuccess('Created .env file with default configuration');
    this.logWarning('Please update .env file with your actual configuration values');
  }
  
  async validateDatabase() {
    this.logStep('5/8', 'Validating database connection');
    
    try {
      // Try to load the config to validate it
      const config = require('./load-testing-config.js');
      this.logSuccess('Configuration loaded successfully');
      
      // Note: We don't actually test DB connection here to avoid requiring
      // the database to be set up during initial setup
      this.log('Database configuration validated (connection test skipped)');
      
    } catch (error) {
      this.logWarning(`Configuration validation failed: ${error.message}`);
      this.log('This is normal if you haven\'t configured the database yet');
    }
  }
  
  async installDependencies() {
    this.logStep('6/8', 'Installing Node.js dependencies');
    
    try {
      this.log('Running npm install...');
      const output = await this.executeCommand('npm install', { timeout: 120000 });
      this.logSuccess('Dependencies installed successfully');
    } catch (error) {
      this.logWarning('Failed to install dependencies automatically');
      this.log('Please run: npm install');
      // Don't throw error, continue with setup
    }
  }
  
  async runInitialTest() {
    this.logStep('7/8', 'Running initial validation test');
    
    try {
      // Test configuration loading
      const config = require('./load-testing-config.js');
      this.logSuccess('Configuration validation passed');
      
      // Test monitoring module
      const { PerformanceMonitor } = require('./performance-monitor.js');
      const monitor = new PerformanceMonitor();
      this.logSuccess('Performance monitor module loaded');
      
      // Test runner module
      const { PerformanceTestRunner } = require('./test-runner.js');
      const runner = new PerformanceTestRunner();
      this.logSuccess('Test runner module loaded');
      
      this.logSuccess('All modules validated successfully');
      
    } catch (error) {
      this.logWarning(`Module validation failed: ${error.message}`);
      this.log('Some modules may not work until dependencies are installed');
    }
  }
  
  async showCompletionMessage() {
    this.logStep('8/8', 'Setup completion');
    
    this.log('\n🎯 Next Steps:', 'bright');
    this.log('=' .repeat(40), 'blue');
    
    this.log('\n1. 📝 Configure your environment:');
    this.log('   - Edit .env file with your database credentials');
    this.log('   - Update load-testing-config.js if needed');
    
    this.log('\n2. 🗄️  Set up your database:');
    this.log('   - Ensure PostgreSQL is running');
    this.log('   - Create test database: nakes_link_test');
    this.log('   - Run database migrations if needed');
    
    this.log('\n3. 🧪 Run your first test:');
    this.log('   - Basic test: npm run test:basic');
    this.log('   - Full suite: npm run test');
    this.log('   - Monitor: npm run monitor:start');
    
    this.log('\n4. 📊 View results:');
    this.log('   - Check ./results/ for raw data');
    this.log('   - Check ./reports/ for HTML reports');
    this.log('   - Dashboard: npm run monitor:dashboard');
    
    this.log('\n5. 📚 Learn more:');
    this.log('   - Read README.md for detailed documentation');
    this.log('   - Check examples in the docs/ folder');
    this.log('   - Visit: https://k6.io/docs/ for K6 documentation');
    
    this.log('\n🆘 Need help?', 'yellow');
    this.log('   - Run: npm run help');
    this.log('   - Check troubleshooting in README.md');
    this.log('   - Contact: support@nakeslink.com');
    
    this.log('\n🚀 Happy testing!', 'green');
  }
  
  executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      
      exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${command}\n${error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// CLI interface
class SetupCLI {
  constructor() {
    this.setup = new PerformanceTestingSetup();
  }
  
  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'check':
        await this.checkEnvironment();
        break;
        
      case 'clean':
        await this.cleanEnvironment();
        break;
        
      case 'reset':
        await this.resetEnvironment();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
        
      default:
        await this.setup.run();
    }
  }
  
  async checkEnvironment() {
    console.log('🔍 Checking environment...');
    
    try {
      await this.setup.checkNodeVersion();
      await this.setup.checkK6Installation();
      
      // Check if directories exist
      for (const dir of this.setup.requiredDirectories) {
        try {
          await fs.access(path.join(__dirname, dir));
          this.setup.logSuccess(`Directory exists: ${dir}`);
        } catch (error) {
          this.setup.logWarning(`Directory missing: ${dir}`);
        }
      }
      
      // Check if .env exists
      try {
        await fs.access(path.join(__dirname, '.env'));
        this.setup.logSuccess('.env file exists');
      } catch (error) {
        this.setup.logWarning('.env file missing');
      }
      
      console.log('\n✅ Environment check completed');
      
    } catch (error) {
      this.setup.logError(`Environment check failed: ${error.message}`);
    }
  }
  
  async cleanEnvironment() {
    console.log('🧹 Cleaning environment...');
    
    const cleanDirs = ['results', 'reports', 'logs', 'temp'];
    
    for (const dir of cleanDirs) {
      const dirPath = path.join(__dirname, dir);
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          await fs.unlink(path.join(dirPath, file));
        }
        this.setup.logSuccess(`Cleaned directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.setup.logWarning(`Failed to clean ${dir}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Environment cleaned');
  }
  
  async resetEnvironment() {
    console.log('🔄 Resetting environment...');
    
    await this.cleanEnvironment();
    
    // Remove .env file
    try {
      await fs.unlink(path.join(__dirname, '.env'));
      this.setup.logSuccess('Removed .env file');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.setup.logWarning('Failed to remove .env file');
      }
    }
    
    // Re-run setup
    await this.setup.run();
  }
  
  showHelp() {
    console.log(`
Nakes Link Performance Testing Setup

Usage: node setup.js [command]

Commands:
  (no command)  Run full setup process
  check         Check current environment status
  clean         Clean temporary files and results
  reset         Reset environment and run setup again
  help          Show this help message

Examples:
  node setup.js         # Run full setup
  node setup.js check   # Check environment
  node setup.js clean   # Clean results
  node setup.js reset   # Reset and setup
`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup interrupted. You can run setup again anytime.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Setup terminated. You can run setup again anytime.');
  process.exit(0);
});

// Export for use as module
module.exports = {
  PerformanceTestingSetup,
  SetupCLI,
};

// Run CLI if called directly
if (require.main === module) {
  const cli = new SetupCLI();
  cli.run().catch(error => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
}