const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');
const { 
  securityConfig, 
  EncryptionService, 
  PasswordValidator, 
  InputSanitizer, 
  SecurityAuditLogger 
} = require('../config/security');

// Initialize encryption service
const encryptionService = new EncryptionService();

// Rate limiting middleware
const createRateLimit = (options = {}) => {
  const config = { ...securityConfig.rateLimiting, ...options };
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message: config.message
    },
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
    handler: (req, res) => {
      SecurityAuditLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', req.user?.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        message: config.message
      });
    }
  });
};

// Specific rate limits for different endpoints
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.'
});

const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

const strictRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour for sensitive operations
  message: 'Too many sensitive operations, please try again later.'
});

// Security headers middleware
const securityHeaders = helmet(securityConfig.helmet);

// CORS middleware
const corsMiddleware = cors(securityConfig.cors);

// Input validation and sanitization middleware
const validateAndSanitizeInput = (req, res, next) => {
  try {
    // Sanitize string inputs
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Special handling for different field types
          switch (key) {
            case 'email':
              sanitized[key] = InputSanitizer.sanitizeEmail(value);
              break;
            case 'phone':
              sanitized[key] = InputSanitizer.sanitizePhone(value);
              break;
            case 'nik':
            case 'str_number':
            case 'sip_number':
              sanitized[key] = value.replace(/[^0-9]/g, ''); // Only numbers
              break;
            default:
              sanitized[key] = InputSanitizer.sanitizeString(value);
          }
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    };
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  } catch (error) {
    SecurityAuditLogger.logSecurityEvent('INPUT_SANITIZATION_ERROR', req.user?.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
};

// Password validation middleware
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  const validation = PasswordValidator.validate(password);
  
  if (!validation.isValid) {
    SecurityAuditLogger.logSecurityEvent('WEAK_PASSWORD_ATTEMPT', req.user?.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: validation.errors
    });
    
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: validation.errors
    });
  }
  
  next();
};

// Email validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

// Phone validation middleware
const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  
  if (phone && !InputSanitizer.validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  
  next();
};

// NIK validation middleware
const validateNIK = (req, res, next) => {
  const { nik } = req.body;
  
  if (nik && !InputSanitizer.validateNIK(nik)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid NIK format. NIK must be 16 digits'
    });
  }
  
  next();
};

// STR validation middleware
const validateSTR = (req, res, next) => {
  const { str_number } = req.body;
  
  if (str_number && !InputSanitizer.validateSTR(str_number)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid STR number format'
    });
  }
  
  next();
};

// File upload validation middleware
const validateFileUpload = (allowedTypes = securityConfig.validation.allowedImageTypes) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files || [req.file];
    
    for (const file of files) {
      // Check file size
      if (file.size > securityConfig.validation.maxFileSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds maximum limit of ${securityConfig.validation.maxFileSize / (1024 * 1024)}MB`
        });
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.mimetype} is not allowed`
        });
      }
      
      // Check for malicious file names
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        SecurityAuditLogger.logSecurityEvent('MALICIOUS_FILE_UPLOAD_ATTEMPT', req.user?.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          filename: file.originalname
        });
        
        return res.status(400).json({
          success: false,
          message: 'Invalid file name'
        });
      }
    }
    
    next();
  };
};

// SQL injection prevention middleware
const preventSQLInjection = (req, res, next) => {
  const checkForSQLInjection = (value) => {
    if (typeof value !== 'string') return false;
    
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkForSQLInjection(value)) {
        return true;
      } else if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };
  
  if ((req.body && checkObject(req.body)) || (req.query && checkObject(req.query))) {
    SecurityAuditLogger.logSecurityEvent('SQL_INJECTION_ATTEMPT', req.user?.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }
  
  next();
};

// XSS prevention middleware
const preventXSS = (req, res, next) => {
  const checkForXSS = (value) => {
    if (typeof value !== 'string') return false;
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkForXSS(value)) {
        return true;
      } else if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };
  
  if ((req.body && checkObject(req.body)) || (req.query && checkObject(req.query))) {
    SecurityAuditLogger.logSecurityEvent('XSS_ATTEMPT', req.user?.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }
  
  next();
};

// Request logging middleware for security audit
const securityAuditLog = (req, res, next) => {
  // Log sensitive operations
  const sensitiveEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/users/profile',
    '/admin',
    '/payments',
    '/satusehat'
  ];
  
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));
  
  if (isSensitive) {
    SecurityAuditLogger.logSecurityEvent('SENSITIVE_ENDPOINT_ACCESS', req.user?.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No IP restriction if list is empty
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      SecurityAuditLogger.logSecurityEvent('UNAUTHORIZED_IP_ACCESS', req.user?.id, {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        allowedIPs
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

// Encryption middleware for sensitive data
const encryptSensitiveFields = (fields = []) => {
  return (req, res, next) => {
    if (!req.body) return next();
    
    try {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = encryptionService.encrypt(req.body[field]);
        }
      });
      
      next();
    } catch (error) {
      SecurityAuditLogger.logSecurityEvent('ENCRYPTION_ERROR', req.user?.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: error.message,
        fields
      });
      
      res.status(500).json({
        success: false,
        message: 'Data processing error'
      });
    }
  };
};

// Decryption middleware for sensitive data
const decryptSensitiveFields = (fields = []) => {
  return (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      try {
        if (data && data.data) {
          const decryptObject = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            
            const decrypted = Array.isArray(obj) ? [] : {};
            
            for (const [key, value] of Object.entries(obj)) {
              if (fields.includes(key) && typeof value === 'string') {
                try {
                  decrypted[key] = encryptionService.decrypt(value);
                } catch {
                  decrypted[key] = value; // If decryption fails, return original
                }
              } else if (typeof value === 'object' && value !== null) {
                decrypted[key] = decryptObject(value);
              } else {
                decrypted[key] = value;
              }
            }
            
            return decrypted;
          };
          
          data.data = decryptObject(data.data);
        }
      } catch (error) {
        SecurityAuditLogger.logSecurityEvent('DECRYPTION_ERROR', req.user?.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          error: error.message,
          fields
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  // Rate limiting
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  createRateLimit,
  
  // Security headers and CORS
  securityHeaders,
  corsMiddleware,
  
  // Input validation and sanitization
  validateAndSanitizeInput,
  validatePassword,
  validateEmail,
  validatePhone,
  validateNIK,
  validateSTR,
  validateFileUpload,
  
  // Attack prevention
  preventSQLInjection,
  preventXSS,
  
  // Audit and monitoring
  securityAuditLog,
  ipWhitelist,
  
  // Encryption
  encryptSensitiveFields,
  decryptSensitiveFields,
  
  // Utilities
  encryptionService,
  SecurityAuditLogger
};