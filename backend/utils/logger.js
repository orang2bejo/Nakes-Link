const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }),
  
  // File transport for error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }),
  
  // File transport for notification logs
  new winston.transports.File({
    filename: path.join(logsDir, 'notifications.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
    tailable: true
  })
];

// Add daily rotate file transport for production
if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create specialized loggers for different modules
const createModuleLogger = (module) => {
  return {
    error: (message, meta = {}) => logger.error(message, { module, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { module, ...meta }),
    info: (message, meta = {}) => logger.info(message, { module, ...meta }),
    http: (message, meta = {}) => logger.http(message, { module, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { module, ...meta })
  };
};

// Notification-specific logger
const notificationLogger = createModuleLogger('notification');

// Security-specific logger
const securityLogger = createModuleLogger('security');

// Database-specific logger
const dbLogger = createModuleLogger('database');

// API-specific logger
const apiLogger = createModuleLogger('api');

// Emergency-specific logger
const emergencyLogger = createModuleLogger('emergency');

// Payment-specific logger
const paymentLogger = createModuleLogger('payment');

// Authentication-specific logger
const authLogger = createModuleLogger('auth');

// Middleware to log HTTP requests
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

// Function to log notification events
const logNotificationEvent = (event, data) => {
  notificationLogger.info(`Notification ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log security events
const logSecurityEvent = (event, data) => {
  securityLogger.warn(`Security ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log emergency events
const logEmergencyEvent = (event, data) => {
  emergencyLogger.error(`Emergency ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log payment events
const logPaymentEvent = (event, data) => {
  paymentLogger.info(`Payment ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log authentication events
const logAuthEvent = (event, data) => {
  authLogger.info(`Auth ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log database events
const logDatabaseEvent = (event, data) => {
  dbLogger.debug(`Database ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Function to log API events
const logApiEvent = (event, data) => {
  apiLogger.info(`API ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

// Error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
});

module.exports = {
  logger,
  notificationLogger,
  securityLogger,
  dbLogger,
  apiLogger,
  emergencyLogger,
  paymentLogger,
  authLogger,
  httpLogger,
  logNotificationEvent,
  logSecurityEvent,
  logEmergencyEvent,
  logPaymentEvent,
  logAuthEvent,
  logDatabaseEvent,
  logApiEvent,
  createModuleLogger
};