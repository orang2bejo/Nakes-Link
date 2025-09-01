const http = require('http');
const { logger } = require('./utils/logger');

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  host: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 5000,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Perform HTTP health check
 * @param {number} attempt - Current attempt number
 * @returns {Promise<boolean>} - Health check result
 */
function performHealthCheck(attempt = 1) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HEALTH_CHECK_CONFIG.host,
      port: HEALTH_CHECK_CONFIG.port,
      path: HEALTH_CHECK_CONFIG.path,
      method: 'GET',
      timeout: HEALTH_CHECK_CONFIG.timeout,
      headers: {
        'User-Agent': 'Docker-HealthCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const healthData = JSON.parse(data);
            
            // Validate health response structure
            if (healthData.status === 'healthy' && healthData.timestamp) {
              console.log(`✅ Health check passed (attempt ${attempt}/${HEALTH_CHECK_CONFIG.maxRetries})`);
              console.log(`📊 Status: ${healthData.status}`);
              console.log(`⏰ Timestamp: ${healthData.timestamp}`);
              
              if (healthData.uptime) {
                console.log(`⏱️  Uptime: ${Math.floor(healthData.uptime)}s`);
              }
              
              if (healthData.memory) {
                console.log(`💾 Memory: ${Math.round(healthData.memory.used / 1024 / 1024)}MB used`);
              }
              
              if (healthData.database && healthData.database.status) {
                console.log(`🗄️  Database: ${healthData.database.status}`);
              }
              
              if (healthData.redis && healthData.redis.status) {
                console.log(`🔴 Redis: ${healthData.redis.status}`);
              }
              
              resolve(true);
            } else {
              console.error(`❌ Invalid health response structure:`, healthData);
              resolve(false);
            }
          } else {
            console.error(`❌ Health check failed with status ${res.statusCode}`);
            console.error(`📄 Response: ${data}`);
            resolve(false);
          }
        } catch (error) {
          console.error(`❌ Failed to parse health check response:`, error.message);
          console.error(`📄 Raw response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Health check request failed (attempt ${attempt}/${HEALTH_CHECK_CONFIG.maxRetries}):`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error(`⏰ Health check timed out after ${HEALTH_CHECK_CONFIG.timeout}ms (attempt ${attempt}/${HEALTH_CHECK_CONFIG.maxRetries})`);
      req.destroy();
      resolve(false);
    });

    req.setTimeout(HEALTH_CHECK_CONFIG.timeout);
    req.end();
  });
}

/**
 * Retry health check with exponential backoff
 * @returns {Promise<boolean>} - Final health check result
 */
async function retryHealthCheck() {
  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.maxRetries; attempt++) {
    const isHealthy = await performHealthCheck(attempt);
    
    if (isHealthy) {
      return true;
    }
    
    // Don't wait after the last attempt
    if (attempt < HEALTH_CHECK_CONFIG.maxRetries) {
      const delay = HEALTH_CHECK_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}

/**
 * Additional system checks
 * @returns {Promise<Object>} - System check results
 */
async function performSystemChecks() {
  const checks = {
    memory: false,
    disk: false,
    environment: false
  };
  
  try {
    // Memory check
    const memUsage = process.memoryUsage();
    const memUsedMB = memUsage.heapUsed / 1024 / 1024;
    const memTotalMB = memUsage.heapTotal / 1024 / 1024;
    
    if (memUsedMB < 500) { // Less than 500MB used
      checks.memory = true;
      console.log(`✅ Memory check passed: ${Math.round(memUsedMB)}MB/${Math.round(memTotalMB)}MB`);
    } else {
      console.warn(`⚠️  High memory usage: ${Math.round(memUsedMB)}MB/${Math.round(memTotalMB)}MB`);
    }
    
    // Environment variables check
    const requiredEnvVars = ['NODE_ENV', 'DB_HOST', 'DB_NAME', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      checks.environment = true;
      console.log(`✅ Environment variables check passed`);
    } else {
      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    // Basic disk space check (if possible)
    try {
      const fs = require('fs');
      const stats = fs.statSync('/app');
      checks.disk = true;
      console.log(`✅ Disk access check passed`);
    } catch (error) {
      console.warn(`⚠️  Disk access check failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`❌ System checks failed: ${error.message}`);
  }
  
  return checks;
}

/**
 * Main health check function
 */
async function main() {
  console.log('🏥 Starting Nakes Link health check...');
  console.log(`🔍 Checking ${HEALTH_CHECK_CONFIG.host}:${HEALTH_CHECK_CONFIG.port}${HEALTH_CHECK_CONFIG.path}`);
  
  const startTime = Date.now();
  
  try {
    // Perform HTTP health check
    const isHealthy = await retryHealthCheck();
    
    if (!isHealthy) {
      console.error('❌ HTTP health check failed after all retries');
      process.exit(1);
    }
    
    // Perform additional system checks
    const systemChecks = await performSystemChecks();
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Health check completed in ${duration}ms`);
    
    // Log summary
    const passedChecks = Object.values(systemChecks).filter(Boolean).length;
    const totalChecks = Object.keys(systemChecks).length;
    console.log(`📊 System checks: ${passedChecks}/${totalChecks} passed`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 All health checks passed!');
      process.exit(0);
    } else {
      console.warn('⚠️  Some system checks failed, but HTTP health check passed');
      process.exit(0); // Still exit 0 for Docker health check
    }
    
  } catch (error) {
    console.error('💥 Health check crashed:', error.message);
    if (error.stack) {
      console.error('📚 Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('🛑 Health check received SIGTERM, exiting...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Health check received SIGINT, exiting...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in health check:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in health check:', reason);
  process.exit(1);
});

// Run health check
if (require.main === module) {
  main();
}

module.exports = {
  performHealthCheck,
  retryHealthCheck,
  performSystemChecks
};