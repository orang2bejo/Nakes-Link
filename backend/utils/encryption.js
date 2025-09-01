const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { securityConfig } = require('../config/security');

/**
 * Advanced Encryption Utilities for Nakes Link
 * Implements AES-256-GCM encryption for sensitive data
 */

class DataEncryption {
  constructor() {
    this.algorithm = securityConfig.encryption.algorithm;
    this.keyLength = securityConfig.encryption.keyLength;
    this.ivLength = securityConfig.encryption.ivLength;
    this.tagLength = securityConfig.encryption.tagLength;
    this.saltLength = securityConfig.encryption.saltLength;
    
    // Master encryption key from environment
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!this.masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
  }
  
  /**
   * Generate a random encryption key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }
  
  /**
   * Generate a random initialization vector
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }
  
  /**
   * Generate a random salt
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }
  
  /**
   * Derive encryption key from master key and salt
   */
  deriveKey(salt) {
    return crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');
  }
  
  /**
   * Encrypt sensitive data
   * @param {string} plaintext - Data to encrypt
   * @param {Buffer} additionalData - Additional authenticated data (optional)
   * @returns {string} - Base64 encoded encrypted data with metadata
   */
  encrypt(plaintext, additionalData = null) {
    try {
      if (!plaintext) {
        throw new Error('Plaintext is required for encryption');
      }
      
      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Derive encryption key
      const key = this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(additionalData || Buffer.alloc(0));
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine all components
      const result = {
        algorithm: this.algorithm,
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64'),
        timestamp: Date.now()
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
  
  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {Buffer} additionalData - Additional authenticated data (optional)
   * @returns {string} - Decrypted plaintext
   */
  decrypt(encryptedData, additionalData = null) {
    try {
      if (!encryptedData) {
        throw new Error('Encrypted data is required for decryption');
      }
      
      // Parse encrypted data
      const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
      // Validate algorithm
      if (parsed.algorithm !== this.algorithm) {
        throw new Error('Invalid encryption algorithm');
      }
      
      // Extract components
      const salt = Buffer.from(parsed.salt, 'base64');
      const iv = Buffer.from(parsed.iv, 'base64');
      const tag = Buffer.from(parsed.tag, 'base64');
      const data = Buffer.from(parsed.data, 'base64');
      
      // Derive decryption key
      const key = this.deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(additionalData || Buffer.alloc(0));
      
      // Decrypt data
      let decrypted = decipher.update(data);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  
  /**
   * Hash sensitive data (one-way)
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt (will generate if not provided)
   * @returns {Object} - Hash result with salt
   */
  async hash(data, salt = null) {
    try {
      if (!data) {
        throw new Error('Data is required for hashing');
      }
      
      const saltRounds = securityConfig.encryption.saltRounds;
      const generatedSalt = salt || await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(data, generatedSalt);
      
      return {
        hash,
        salt: generatedSalt,
        algorithm: 'bcrypt',
        rounds: saltRounds,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }
  
  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Hash to verify against
   * @returns {boolean} - Verification result
   */
  async verifyHash(data, hash) {
    try {
      if (!data || !hash) {
        throw new Error('Data and hash are required for verification');
      }
      
      return await bcrypt.compare(data, hash);
    } catch (error) {
      throw new Error(`Hash verification failed: ${error.message}`);
    }
  }
  
  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Base64 encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  /**
   * Generate cryptographically secure random string
   * @param {number} length - String length
   * @param {string} charset - Character set to use
   * @returns {string} - Random string
   */
  generateSecureString(length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    const charsetLength = charset.length;
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charsetLength];
    }
    
    return result;
  }
}

/**
 * Field-level encryption for database models
 */
class FieldEncryption {
  constructor() {
    this.encryption = new DataEncryption();
    
    // Define which fields should be encrypted
    this.encryptedFields = {
      User: ['nik', 'phone', 'address', 'emergencyContact'],
      Nakes: ['str', 'sipNumber', 'bankAccount'],
      MedicalRecord: ['diagnosis', 'treatment', 'notes', 'prescription'],
      Payment: ['cardNumber', 'bankAccount'],
      Chat: ['message']
    };
  }
  
  /**
   * Encrypt model fields before saving to database
   * @param {string} modelName - Model name
   * @param {Object} data - Data object
   * @returns {Object} - Data with encrypted fields
   */
  async encryptFields(modelName, data) {
    const fieldsToEncrypt = this.encryptedFields[modelName] || [];
    const encryptedData = { ...data };
    
    for (const field of fieldsToEncrypt) {
      if (data[field] && typeof data[field] === 'string') {
        try {
          encryptedData[field] = this.encryption.encrypt(data[field]);
          encryptedData[`${field}_encrypted`] = true;
        } catch (error) {
          console.error(`Failed to encrypt field ${field}:`, error.message);
          // Don't save unencrypted sensitive data
          delete encryptedData[field];
        }
      }
    }
    
    return encryptedData;
  }
  
  /**
   * Decrypt model fields after retrieving from database
   * @param {string} modelName - Model name
   * @param {Object} data - Data object
   * @returns {Object} - Data with decrypted fields
   */
  async decryptFields(modelName, data) {
    const fieldsToDecrypt = this.encryptedFields[modelName] || [];
    const decryptedData = { ...data };
    
    for (const field of fieldsToDecrypt) {
      if (data[field] && data[`${field}_encrypted`]) {
        try {
          decryptedData[field] = this.encryption.decrypt(data[field]);
          delete decryptedData[`${field}_encrypted`];
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error.message);
          // Keep encrypted data if decryption fails
          decryptedData[field] = '[ENCRYPTED]';
        }
      }
    }
    
    return decryptedData;
  }
  
  /**
   * Encrypt array of model objects
   * @param {string} modelName - Model name
   * @param {Array} dataArray - Array of data objects
   * @returns {Array} - Array with encrypted fields
   */
  async encryptFieldsArray(modelName, dataArray) {
    return Promise.all(
      dataArray.map(data => this.encryptFields(modelName, data))
    );
  }
  
  /**
   * Decrypt array of model objects
   * @param {string} modelName - Model name
   * @param {Array} dataArray - Array of data objects
   * @returns {Array} - Array with decrypted fields
   */
  async decryptFieldsArray(modelName, dataArray) {
    return Promise.all(
      dataArray.map(data => this.decryptFields(modelName, data))
    );
  }
}

/**
 * Database encryption middleware
 */
class DatabaseEncryption {
  constructor() {
    this.fieldEncryption = new FieldEncryption();
  }
  
  /**
   * Mongoose pre-save middleware
   */
  preSave(modelName) {
    return async function(next) {
      try {
        const encryptedData = await this.fieldEncryption.encryptFields(modelName, this.toObject());
        Object.assign(this, encryptedData);
        next();
      } catch (error) {
        next(error);
      }
    }.bind(this);
  }
  
  /**
   * Mongoose post-find middleware
   */
  postFind(modelName) {
    return async function(docs) {
      if (Array.isArray(docs)) {
        return await this.fieldEncryption.decryptFieldsArray(modelName, docs);
      } else if (docs) {
        return await this.fieldEncryption.decryptFields(modelName, docs);
      }
      return docs;
    }.bind(this);
  }
}

/**
 * Key management for encryption
 */
class KeyManagement {
  constructor() {
    this.encryption = new DataEncryption();
  }
  
  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    console.log('Starting key rotation process...');
    
    try {
      // Generate new master key
      const newMasterKey = this.encryption.generateToken(64);
      
      // Store old key for decryption of existing data
      const oldMasterKey = process.env.ENCRYPTION_MASTER_KEY;
      
      console.log('New encryption key generated');
      console.log('Please update ENCRYPTION_MASTER_KEY environment variable');
      console.log('Old key should be kept for data migration');
      
      return {
        newKey: newMasterKey,
        oldKey: oldMasterKey,
        rotationDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Key rotation failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Validate encryption key strength
   */
  validateKeyStrength(key) {
    if (!key) {
      return { valid: false, reason: 'Key is required' };
    }
    
    if (key.length < 32) {
      return { valid: false, reason: 'Key must be at least 32 characters long' };
    }
    
    // Check for entropy
    const uniqueChars = new Set(key).size;
    if (uniqueChars < 16) {
      return { valid: false, reason: 'Key has insufficient entropy' };
    }
    
    return { valid: true, reason: 'Key meets security requirements' };
  }
}

/**
 * Secure data sanitization
 */
class DataSanitization {
  /**
   * Sanitize sensitive data for logging
   */
  static sanitizeForLogging(data) {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'nik', 'phone', 
      'address', 'str', 'bankAccount', 'cardNumber', 'cvv'
    ];
    
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Mask sensitive data for display
   */
  static maskSensitiveData(data, field) {
    if (!data) return data;
    
    const str = data.toString();
    
    switch (field) {
      case 'nik':
        return str.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
      case 'phone':
        return str.replace(/(\+\d{2})(\d{3})\d{4}(\d{3})/, '$1$2****$3');
      case 'email':
        return str.replace(/(.{2}).*(@.*)/, '$1****$2');
      case 'bankAccount':
        return str.replace(/(\d{4})\d*(\d{4})/, '$1****$2');
      default:
        return str.replace(/./g, '*');
    }
  }
  
  /**
   * Secure data deletion
   */
  static secureDelete(data) {
    if (typeof data === 'object') {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          data[key] = null;
          delete data[key];
        }
      }
    }
    
    // Overwrite memory (basic approach)
    if (typeof data === 'string') {
      data = '0'.repeat(data.length);
    }
    
    return null;
  }
}

module.exports = {
  DataEncryption,
  FieldEncryption,
  DatabaseEncryption,
  KeyManagement,
  DataSanitization
};