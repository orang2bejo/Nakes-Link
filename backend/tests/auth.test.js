/**
 * Authentication Tests
 * Test suite for authentication and authorization functionality
 */

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.destroy({ where: {} });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new patient user successfully', async () => {
      const userData = {
        email: 'patient@test.com',
        password: 'password123',
        fullName: 'Test Patient',
        phone: '+6281234567890',
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('patient');
      expect(response.body.data.token).toBeDefined();
    });

    it('should register a new nakes user successfully', async () => {
      const userData = {
        email: 'nakes@test.com',
        password: 'password123',
        fullName: 'Dr. Test Nakes',
        phone: '+6281234567891',
        role: 'nakes',
        specialization: 'General Practitioner',
        experience: 5,
        education: 'Medical School',
        workplace: 'Test Hospital'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('nakes');
      expect(response.body.data.user.specialization).toBe(userData.specialization);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        phone: '+6281234567890',
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '+6281234567890',
        role: 'patient'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, phone: '+6281234567891' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@test.com',
        password: '123', // Too short
        fullName: 'Test User',
        phone: '+6281234567890',
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        email: 'test@test.com',
        password: hashedPassword,
        fullName: 'Test User',
        full_name: 'Test User',
        phone: '+6281234567890',
        role: 'patient',
        status: 'active'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'wrong@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for inactive user', async () => {
      // Update user status to inactive
      await testUser.update({ status: 'inactive' });

      const loginData = {
        email: 'test@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        email: 'test@test.com',
        password: hashedPassword,
        fullName: 'Test User',
        full_name: 'Test User',
        phone: '+6281234567890',
        role: 'patient',
        status: 'active'
      });

      // Generate refresh token
      refreshToken = jwt.sign(
        { id: testUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '30d' }
      );

      await testUser.update({ refreshToken });
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        email: 'test@test.com',
        password: hashedPassword,
        fullName: 'Test User',
        full_name: 'Test User',
        phone: '+6281234567890',
        role: 'patient',
        status: 'active'
      });

      token = jwt.sign(
        { id: testUser.id, role: testUser.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        email: 'test@test.com',
        password: hashedPassword,
        fullName: 'Test User',
        full_name: 'Test User',
        phone: '+6281234567890',
        role: 'patient',
        status: 'active'
      });
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Middleware', () => {
    let patientUser, nakesUser, adminUser;
    let patientToken, nakesToken, adminToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);

      patientUser = await User.create({
        email: 'patient@test.com',
        password: hashedPassword,
        fullName: 'Test Patient',
        full_name: 'Test Patient',
        phone: '+6281234567890',
        role: 'patient',
        status: 'active'
      });

      nakesUser = await User.create({
        email: 'nakes@test.com',
        password: hashedPassword,
        fullName: 'Test Nakes',
        full_name: 'Test Nakes',
        phone: '+6281234567891',
        role: 'nakes',
        status: 'active'
      });

      adminUser = await User.create({
        email: 'admin@test.com',
        password: hashedPassword,
        fullName: 'Test Admin',
        full_name: 'Test Admin',
        phone: '+6281234567892',
        role: 'admin',
        status: 'active'
      });

      patientToken = jwt.sign(
        { id: patientUser.id, role: patientUser.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      nakesToken = jwt.sign(
        { id: nakesUser.id, role: nakesUser.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      adminToken = jwt.sign(
        { id: adminUser.id, role: adminUser.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );
    });

    it('should allow access to user profile for authenticated users', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(patientUser.id);
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});