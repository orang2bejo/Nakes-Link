const request = require('supertest');
const app = require('../app');
const { DataEncryption, FieldEncryption, KeyManagement, DataSanitization } = require('../utils/encryption');
const { EncryptionService, PasswordValidator, InputSanitizer } = require('../config/security');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Security Tests', () => {
  let testUser;
  let authToken;
  let dataEncryption;
  let fieldEncryption;
  let keyManagement;
  
  beforeAll(async () => {
    // Initialize encryption services
    dataEncryption = new DataEncryption();
    fieldEncryption = new FieldEncryption();
    keyManagement = new KeyManagement();
    
    // Set test encryption key
    process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-for-security-testing-very-long-and-secure';
  });
  
  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'security@test.com',
      password: 'SecurePass123!',
      name: 'Security Test User',
      role: 'patient',
      isActive: true,
      isVerified: true
    });
    
    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
  
  afterEach(async () => {
    await User.deleteMany({});
  });
  
  describe('Data Encryption', () => {
    describe('Basic Encryption/Decryption', () => {
      test('should encrypt and decrypt data correctly', () => {
        const plaintext = 'Sensitive medical data';
        const encrypted = dataEncryption.encrypt(plaintext);
        const decrypted = dataEncryption.decrypt(encrypted);
        
        expect(encrypted).not.toBe(plaintext);
        expect(decrypted).toBe(plaintext);
      });
      
      test('should handle empty data', () => {
        expect(() => dataEncryption.encrypt('')).toThrow('Plaintext is required');
        expect(() => dataEncryption.decrypt('')).toThrow('Encrypted data is required');
      });
      
      test('should handle null/undefined data', () => {
        expect(() => dataEncryption.encrypt(null)).toThrow('Plaintext is required');
        expect(() => dataEncryption.decrypt(null)).toThrow('Encrypted data is required');
      });
      
      test('should produce different ciphertext for same plaintext', () => {
        const plaintext = 'Same data';
        const encrypted1 = dataEncryption.encrypt(plaintext);
        const encrypted2 = dataEncryption.encrypt(plaintext);
        
        expect(encrypted1).not.toBe(encrypted2);
        expect(dataEncryption.decrypt(encrypted1)).toBe(plaintext);
        expect(dataEncryption.decrypt(encrypted2)).toBe(plaintext);
      });
    });
    
    describe('Hashing', () => {
      test('should hash data correctly', async () => {
        const data = 'password123';
        const result = await dataEncryption.hash(data);
        
        expect(result.hash).toBeDefined();
        expect(result.salt).toBeDefined();
        expect(result.algorithm).toBe('bcrypt');
        expect(result.timestamp).toBeDefined();
      });
      
      test('should verify hash correctly', async () => {
        const data = 'password123';
        const result = await dataEncryption.hash(data);
        
        const isValid = await dataEncryption.verifyHash(data, result.hash);
        const isInvalid = await dataEncryption.verifyHash('wrongpassword', result.hash);
        
        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });
    });
    
    describe('Token Generation', () => {
      test('should generate secure tokens', () => {
        const token1 = dataEncryption.generateToken();
        const token2 = dataEncryption.generateToken();
        
        expect(token1).toBeDefined();
        expect(token2).toBeDefined();
        expect(token1).not.toBe(token2);
        expect(token1.length).toBeGreaterThan(40); // Base64url encoded 32 bytes
      });
      
      test('should generate tokens of specified length', () => {
        const token = dataEncryption.generateToken(16);
        expect(token.length).toBeGreaterThan(20); // Base64url encoded 16 bytes
      });
      
      test('should generate secure strings', () => {
        const str1 = dataEncryption.generateSecureString(16);
        const str2 = dataEncryption.generateSecureString(16);
        
        expect(str1.length).toBe(16);
        expect(str2.length).toBe(16);
        expect(str1).not.toBe(str2);
      });
    });
  });
  
  describe('Field Encryption', () => {
    test('should encrypt sensitive fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        nik: '1234567890123456',
        phone: '+6281234567890',
        address: 'Jl. Test No. 123'
      };
      
      const encrypted = await fieldEncryption.encryptFields('User', userData);
      
      expect(encrypted.name).toBe(userData.name); // Not encrypted
      expect(encrypted.email).toBe(userData.email); // Not encrypted
      expect(encrypted.nik).not.toBe(userData.nik); // Encrypted
      expect(encrypted.phone).not.toBe(userData.phone); // Encrypted
      expect(encrypted.address).not.toBe(userData.address); // Encrypted
      expect(encrypted.nik_encrypted).toBe(true);
      expect(encrypted.phone_encrypted).toBe(true);
      expect(encrypted.address_encrypted).toBe(true);
    });
    
    test('should decrypt sensitive fields', async () => {
      const userData = {
        name: 'John Doe',
        nik: '1234567890123456',
        phone: '+6281234567890'
      };
      
      const encrypted = await fieldEncryption.encryptFields('User', userData);
      const decrypted = await fieldEncryption.decryptFields('User', encrypted);
      
      expect(decrypted.name).toBe(userData.name);
      expect(decrypted.nik).toBe(userData.nik);
      expect(decrypted.phone).toBe(userData.phone);
      expect(decrypted.nik_encrypted).toBeUndefined();
      expect(decrypted.phone_encrypted).toBeUndefined();
    });
    
    test('should handle arrays of data', async () => {
      const usersData = [
        { name: 'User 1', nik: '1111111111111111' },
        { name: 'User 2', nik: '2222222222222222' }
      ];
      
      const encrypted = await fieldEncryption.encryptFieldsArray('User', usersData);
      const decrypted = await fieldEncryption.decryptFieldsArray('User', encrypted);
      
      expect(encrypted[0].nik).not.toBe(usersData[0].nik);
      expect(encrypted[1].nik).not.toBe(usersData[1].nik);
      expect(decrypted[0].nik).toBe(usersData[0].nik);
      expect(decrypted[1].nik).toBe(usersData[1].nik);
    });
  });
  
  describe('Key Management', () => {
    test('should validate key strength', () => {
      const weakKey = '123';
      const strongKey = 'very-long-and-secure-encryption-key-with-good-entropy';
      
      const weakResult = keyManagement.validateKeyStrength(weakKey);
      const strongResult = keyManagement.validateKeyStrength(strongKey);
      
      expect(weakResult.valid).toBe(false);
      expect(strongResult.valid).toBe(true);
    });
    
    test('should generate key rotation data', async () => {
      const rotation = await keyManagement.rotateKeys();
      
      expect(rotation.newKey).toBeDefined();
      expect(rotation.oldKey).toBeDefined();
      expect(rotation.rotationDate).toBeDefined();
      expect(rotation.newKey).not.toBe(rotation.oldKey);
    });
  });
  
  describe('Data Sanitization', () => {
    test('should sanitize sensitive data for logging', () => {
      const sensitiveData = {
        name: 'John Doe',
        password: 'secret123',
        nik: '1234567890123456',
        token: 'jwt-token-here',
        publicInfo: 'This is public'
      };
      
      const sanitized = DataSanitization.sanitizeForLogging(sensitiveData);
      
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.nik).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.publicInfo).toBe('This is public');
    });
    
    test('should mask sensitive data correctly', () => {
      expect(DataSanitization.maskSensitiveData('1234567890123456', 'nik'))
        .toBe('1234********3456');
      expect(DataSanitization.maskSensitiveData('+6281234567890', 'phone'))
        .toBe('+62812****890');
      expect(DataSanitization.maskSensitiveData('test@example.com', 'email'))
        .toBe('te****@example.com');
      expect(DataSanitization.maskSensitiveData('1234567890', 'bankAccount'))
        .toBe('1234****7890');
    });
  });
  
  describe('Password Security', () => {
    test('should validate password strength', () => {
      const weakPasswords = ['123', 'password', 'abc123'];
      const strongPasswords = ['SecurePass123!', 'MyStr0ng@Password', 'C0mpl3x#P@ssw0rd'];
      
      weakPasswords.forEach(password => {
        const result = PasswordValidator.validate(password);
        expect(result.isValid).toBe(false);
      });
      
      strongPasswords.forEach(password => {
        const result = PasswordValidator.validate(password);
        expect(result.isValid).toBe(true);
      });
    });
    
    test('should hash passwords securely', async () => {
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
    });
  });
  
  describe('Input Sanitization', () => {
    test('should sanitize email input', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = '<script>alert("xss")</script>@example.com';
      
      expect(InputSanitizer.sanitizeEmail(validEmail)).toBe(validEmail);
      expect(InputSanitizer.sanitizeEmail(invalidEmail)).not.toContain('<script>');
    });
    
    test('should validate phone numbers', () => {
      const validPhones = ['+6281234567890', '081234567890', '6281234567890'];
      const invalidPhones = ['123', 'abc', '+1234', ''];
      
      validPhones.forEach(phone => {
        expect(InputSanitizer.validatePhone(phone)).toBe(true);
      });
      
      invalidPhones.forEach(phone => {
        expect(InputSanitizer.validatePhone(phone)).toBe(false);
      });
    });
    
    test('should validate NIK', () => {
      const validNIK = '1234567890123456';
      const invalidNIKs = ['123', 'abc123', '12345678901234567', ''];
      
      expect(InputSanitizer.validateNIK(validNIK)).toBe(true);
      
      invalidNIKs.forEach(nik => {
        expect(InputSanitizer.validateNIK(nik)).toBe(false);
      });
    });
    
    test('should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>'
      ];
      
      xssPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeString(payload);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
      });
    });
    
    test('should prevent SQL injection', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; DELETE FROM users WHERE '1'='1",
        "' UNION SELECT * FROM users --"
      ];
      
      sqlPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeString(payload);
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('DELETE FROM');
        expect(sanitized).not.toContain('UNION SELECT');
        expect(sanitized).not.toContain("' OR '"));
      });
    });
  });
  
  describe('API Security', () => {
    test('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/users/profile' },
        { method: 'put', path: '/api/users/profile' },
        { method: 'get', path: '/api/appointments' },
        { method: 'post', path: '/api/appointments' },
        { method: 'get', path: '/api/payments' }
      ];
      
      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.message).toContain('token');
      }
    });
    
    test('should validate JWT tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'Bearer ',
        jwt.sign({ userId: 'invalid' }, 'wrong-secret'),
        jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET, { expiresIn: '-1h' })
      ];
      
      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', token.startsWith('Bearer') ? token : `Bearer ${token}`);
        
        expect(response.status).toBe(401);
      }
    });
    
    test('should implement rate limiting', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
    
    test('should validate input data', async () => {
      const invalidInputs = [
        { email: 'invalid-email', password: '123' },
        { email: '', password: '' },
        { email: 'test@example.com' }, // Missing password
        { password: 'password123' } // Missing email
      ];
      
      for (const input of invalidInputs) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(input);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
      }
    });
    
    test('should prevent CSRF attacks', async () => {
      // Test that state-changing operations require proper headers
      const response = await request(app)
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'http://malicious-site.com')
        .send({ name: 'Updated Name' });
      
      // Should be blocked by CORS policy
      expect(response.status).toBe(403);
    });
    
    test('should implement proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
    
    test('should set security headers', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
  
  describe('File Upload Security', () => {
    test('should validate file types', async () => {
      const maliciousFiles = [
        { filename: 'malware.exe', mimetype: 'application/x-executable' },
        { filename: 'script.js', mimetype: 'application/javascript' },
        { filename: 'shell.php', mimetype: 'application/x-php' }
      ];
      
      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', Buffer.from('malicious content'), file.filename);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('file type');
      }
    });
    
    test('should limit file size', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB
      
      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', largeFile, 'large-image.jpg');
      
      expect(response.status).toBe(413);
      expect(response.body.message).toContain('file size');
    });
  });
  
  describe('Session Security', () => {
    test('should invalidate sessions on logout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'SecurePass123!'
        });
      
      const token = loginResponse.body.token;
      
      // Use token
      let profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(profileResponse.status).toBe(200);
      
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      // Try to use token again
      profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(profileResponse.status).toBe(401);
    });
    
    test('should handle token expiration', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('expired');
    });
  });
  
  describe('Data Privacy', () => {
    test('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.__v).toBeUndefined();
    });
    
    test('should mask sensitive data in logs', () => {
      const logData = {
        userId: testUser._id,
        action: 'profile_update',
        nik: '1234567890123456',
        phone: '+6281234567890',
        timestamp: new Date()
      };
      
      const sanitized = DataSanitization.sanitizeForLogging(logData);
      
      expect(sanitized.userId).toBe(logData.userId);
      expect(sanitized.action).toBe(logData.action);
      expect(sanitized.nik).toBe('[REDACTED]');
      expect(sanitized.phone).toBe('[REDACTED]');
    });
  });
  
  describe('Error Handling Security', () => {
    test('should not expose stack traces in production', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = await request(app)
        .get('/api/nonexistent-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body.stack).toBeUndefined();
      expect(response.body.message).not.toContain('Error:');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should handle database errors securely', async () => {
      // Try to create user with duplicate email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email, // Duplicate email
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'patient'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).not.toContain('MongoError');
      expect(response.body.message).not.toContain('duplicate key');
    });
  });
});