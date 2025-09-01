/**
 * User Management Tests
 * Test suite for user-related API endpoints
 */

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Management', () => {
  let patientUser, nakesUser;
  let patientToken, nakesToken;

  beforeEach(async () => {
    // Clean up database
    await User.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test users
    patientUser = await User.create({
      email: 'patient@test.com',
      password: hashedPassword,
      fullName: 'Test Patient',
      full_name: 'Test Patient',
      phone: '+6281234567890',
      role: 'patient',
      status: 'active',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province'
    });

    nakesUser = await User.create({
      email: 'nakes@test.com',
      password: hashedPassword,
      fullName: 'Dr. Test Nakes',
      full_name: 'Dr. Test Nakes',
      phone: '+6281234567891',
      role: 'nakes',
      status: 'active',
      specialization: 'General Practitioner',
      experience: 5,
      education: 'Medical School',
      workplace: 'Test Hospital',
      documentsVerified: true,
      isAvailable: true
    });

    // Generate tokens
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
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(patientUser.id);
      expect(response.body.data.user.email).toBe(patientUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'Updated Patient Name',
        phone: '+6281234567899',
        address: 'Updated Address',
        city: 'Updated City'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.fullName).toBe(updateData.fullName);
      expect(response.body.data.user.phone).toBe(updateData.phone);
    });

    it('should update nakes-specific fields', async () => {
      const updateData = {
        specialization: 'Cardiology',
        experience: 10,
        workplace: 'Updated Hospital'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.specialization).toBe(updateData.specialization);
      expect(response.body.data.user.experience).toBe(updateData.experience);
    });

    it('should reject invalid phone format', async () => {
      const updateData = {
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/nakes', () => {
    beforeEach(async () => {
      // Create additional nakes users for testing
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await User.create({
        email: 'nakes2@test.com',
        password: hashedPassword,
        fullName: 'Dr. Test Nakes 2',
        full_name: 'Dr. Test Nakes 2',
        phone: '+6281234567892',
        role: 'nakes',
        status: 'active',
        specialization: 'Cardiology',
        experience: 8,
        education: 'Medical School',
        workplace: 'Test Hospital 2',
        documentsVerified: true,
        isAvailable: true,
        averageRating: 4.5
      });

      await User.create({
        email: 'nakes3@test.com',
        password: hashedPassword,
        fullName: 'Dr. Test Nakes 3',
        full_name: 'Dr. Test Nakes 3',
        phone: '+6281234567893',
        role: 'nakes',
        status: 'active',
        specialization: 'Pediatrics',
        experience: 3,
        education: 'Medical School',
        workplace: 'Test Hospital 3',
        documentsVerified: false,
        isAvailable: false
      });
    });

    it('should get list of nakes users', async () => {
      const response = await request(app)
        .get('/api/users/nakes')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes).toBeInstanceOf(Array);
      expect(response.body.data.nakes.length).toBeGreaterThan(0);
    });

    it('should filter by specialization', async () => {
      const response = await request(app)
        .get('/api/users/nakes?specialization=Cardiology')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes).toBeInstanceOf(Array);
      expect(response.body.data.nakes.every(nakes => 
        nakes.specialization === 'Cardiology'
      )).toBe(true);
    });

    it('should filter by availability', async () => {
      const response = await request(app)
        .get('/api/users/nakes?available=true')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes.every(nakes => 
        nakes.isAvailable === true
      )).toBe(true);
    });

    it('should filter by verification status', async () => {
      const response = await request(app)
        .get('/api/users/nakes?verified=true')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes.every(nakes => 
        nakes.documentsVerified === true
      )).toBe(true);
    });

    it('should sort by rating', async () => {
      const response = await request(app)
        .get('/api/users/nakes?sortBy=rating')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const ratings = response.body.data.nakes.map(nakes => nakes.averageRating || 0);
      const sortedRatings = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sortedRatings);
    });

    it('should implement pagination', async () => {
      const response = await request(app)
        .get('/api/users/nakes?page=1&limit=2')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/users/nakes/:id', () => {
    it('should get specific nakes profile', async () => {
      const response = await request(app)
        .get(`/api/users/nakes/${nakesUser.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nakes.id).toBe(nakesUser.id);
      expect(response.body.data.nakes.specialization).toBe(nakesUser.specialization);
    });

    it('should return 404 for non-existent nakes', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/users/nakes/${fakeId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for patient user ID', async () => {
      const response = await request(app)
        .get(`/api/users/nakes/${patientUser.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/availability', () => {
    it('should update nakes availability', async () => {
      const updateData = {
        isAvailable: false,
        availabilitySchedule: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: false }
        }
      };

      const response = await request(app)
        .put('/api/users/availability')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isAvailable).toBe(false);
      expect(response.body.data.availabilitySchedule).toEqual(updateData.availabilitySchedule);
    });

    it('should reject access from patient users', async () => {
      const updateData = {
        isAvailable: false
      };

      const response = await request(app)
        .put('/api/users/availability')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require verified nakes', async () => {
      // Update nakes to unverified
      await nakesUser.update({ documentsVerified: false });

      const updateData = {
        isAvailable: false
      };

      const response = await request(app)
        .put('/api/users/availability')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/stats', () => {
    it('should get patient statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalAppointments).toBeDefined();
      expect(response.body.data.stats.averageRating).toBeDefined();
    });

    it('should get nakes statistics with additional fields', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.experienceYears).toBeDefined();
      expect(response.body.data.stats.isVerified).toBeDefined();
      expect(response.body.data.stats.isAvailable).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate email format in profile update', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate phone format in profile update', async () => {
      const updateData = {
        phone: '123' // Too short
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date format for dateOfBirth', async () => {
      const updateData = {
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.refreshToken).toBeUndefined();
      expect(response.body.data.user.emailVerificationToken).toBeUndefined();
    });

    it('should not allow users to access other users profiles directly', async () => {
      // This would require implementing a direct profile access endpoint
      // For now, we test that the profile endpoint only returns the authenticated user's data
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.data.user.id).toBe(patientUser.id);
      expect(response.body.data.user.id).not.toBe(nakesUser.id);
    });
  });
});