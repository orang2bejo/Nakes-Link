const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Security configuration
const securityConfig = {
  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltRounds: 12
  },
  
  // Rate limiting settings
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Session security
  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  },
  
  // CORS settings
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'https://api.midtrans.com', 'https://api.xendit.co']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  // Input validation
  validation: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxStringLength: 1000,
    phoneRegex: /^(\+62|62|0)8[1-9][0-9]{6,9}$/,
    nikRegex: /^[0-9]{16}$/,
    strRegex: /^[0-9]{11,15}$/
  },
  
  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxAttempts: 5,
    lockoutDuration: 30 * 60 * 1000 // 30 minutes
  },
  
  // JWT settings
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: 'nakes-link',
    audience: 'nakes-link-users'
  },
  
  // Audit logging
  audit: {
    sensitiveFields: [
      'password',
      'nik',
      'str_number',
      'sip_number',
      'phone',
      'medical_history',
      'diagnosis',
      'prescription'
    ],
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    maxLogSize: '10m',
    maxFiles: '14d'
  }
};

// Encryption utilities
class EncryptionService {
  constructor() {
    this.algorithm = securityConfig.encryption.algorithm;
    this.keyLength = securityConfig.encryption.keyLength;
    this.ivLength = securityConfig.encryption.ivLength;
    this.tagLength = securityConfig.encryption.tagLength;
    
    // Get encryption key from environment or generate one
    this.encryptionKey = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
      : crypto.randomBytes(this.keyLength);
      
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('ENCRYPTION_KEY not set in environment. Using generated key (data will not persist across restarts).');
    }
  }
  
  /**
   * Encrypt sensitive data
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted data with IV and tag
   */
  encrypt(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to encrypt must be a non-empty string');
    }
    
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey, { iv });
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }
  
  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data with IV and tag
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }
    
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey, { iv });
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }
  
  /**
   * Hash sensitive data (one-way)
   * @param {string} data - Data to hash
   * @returns {Promise<string>} - Hashed data
   */
  async hash(data) {
    if (!data || typeof data !== 'string') {
      throw new Error('Data to hash must be a non-empty string');
    }
    
    try {
      return await bcrypt.hash(data, securityConfig.encryption.saltRounds);
    } catch (error) {
      throw new Error('Hashing failed: ' + error.message);
    }
  }
  
  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Hashed data to compare
   * @returns {Promise<boolean>} - Verification result
   */
  async verifyHash(data, hash) {
    if (!data || !hash) {
      return false;
    }
    
    try {
      return await bcrypt.compare(data, hash);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Mask sensitive data for logging
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Number of characters to show
   * @returns {string} - Masked data
   */
  maskSensitiveData(data, visibleChars = 4) {
    if (!data || typeof data !== 'string') {
      return '[REDACTED]';
    }
    
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    
    const visible = data.substring(0, visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return visible + masked;
  }
}

// Password validation utility
class PasswordValidator {
  static validate(password) {
    const config = securityConfig.password;
    const errors = [];
    
    if (!password || password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }
    
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Input sanitization utility
class InputSanitizer {
  static sanitizeString(input, maxLength = securityConfig.validation.maxStringLength) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }
    
    return email.toLowerCase().trim();
  }
  
  static sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return '';
    }
    
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }
  
  static validateNIK(nik) {
    if (!nik || typeof nik !== 'string') {
      return false;
    }
    
    return securityConfig.validation.nikRegex.test(nik);
  }
  
  static validateSTR(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }
    
    return securityConfig.validation.strRegex.test(str);
  }
  
  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    
    return securityConfig.validation.phoneRegex.test(phone);
  }
}

// Security audit logger
class SecurityAuditLogger {
  static logSecurityEvent(event, userId, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      details: this.sanitizeLogDetails(details)
    };
    
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
    
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement external logging (e.g., Winston, ELK stack)
    }
  }
  
  static sanitizeLogDetails(details) {
    const sanitized = { ...details };
    const encryptionService = new EncryptionService();
    
    // Mask sensitive fields
    securityConfig.audit.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = encryptionService.maskSensitiveData(sanitized[field]);
      }
    });
    
    return sanitized;
  }
}

module.exports = {
  securityConfig,
  EncryptionService,
  PasswordValidator,
  InputSanitizer,
  SecurityAuditLogger
};