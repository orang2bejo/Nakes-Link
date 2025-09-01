/**
 * SatuSehat Integration Tests
 * Test suite for SatuSehat API integration functionality
 */

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const satuSehatService = require('../services/satuSehatService');
const jwt = require('jsonwebtoken');

// Mock SatuSehat service for testing
jest.mock('../services/satuSehatService');

describe('SatuSehat Integration', () => {
  let nakesUser;
  let nakesToken;
  let patientUser;
  let patientToken;

  beforeEach(async () => {
    // Create test users
    nakesUser = await User.create({
      email: 'nakes@test.com',
      password: 'password123',
      fullName: 'Dr. Test Nakes',
      full_name: 'Dr. Test Nakes',
      phone: '+6281234567890',
      role: 'nakes',
      status: 'active',
      specialization: 'General Practitioner',
      experience: 5,
      education: 'Medical School',
      workplace: 'Test Hospital'
    });

    patientUser = await User.create({
      email: 'patient@test.com',
      password: 'password123',
      fullName: 'Test Patient',
      full_name: 'Test Patient',
      phone: '+6281234567891',
      role: 'patient',
      status: 'active'
    });

    // Generate tokens
    nakesToken = jwt.sign(
      { id: nakesUser.id, role: nakesUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    patientToken = jwt.sign(
      { id: patientUser.id, role: patientUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up
    await User.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('POST /api/users/satusehat/verify-nik', () => {
    it('should verify NIK successfully for Nakes user', async () => {
      const mockNIKData = {
        success: true,
        data: {
          nik: '1234567890123456',
          name: 'Dr. Test Nakes',
          verified: true
        }
      };

      satuSehatService.verifyNIK.mockResolvedValue(mockNIKData);

      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ nik: '1234567890123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
      expect(satuSehatService.verifyNIK).toHaveBeenCalledWith('1234567890123456');
    });

    it('should reject invalid NIK format', async () => {
      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ nik: '123' }) // Invalid NIK
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid NIK format');
    });

    it('should reject request from patient user', async () => {
      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ nik: '1234567890123456' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .send({ nik: '1234567890123456' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/satusehat/verify-str', () => {
    it('should verify STR successfully for Nakes user', async () => {
      const mockSTRData = {
        success: true,
        data: {
          str: 'STR123456789',
          status: 'active',
          verified: true,
          expiryDate: '2025-12-31'
        }
      };

      satuSehatService.verifySTR.mockResolvedValue(mockSTRData);

      const response = await request(app)
        .post('/api/users/satusehat/verify-str')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ str: 'STR123456789' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
      expect(satuSehatService.verifySTR).toHaveBeenCalledWith('STR123456789');
    });

    it('should reject invalid STR format', async () => {
      const response = await request(app)
        .post('/api/users/satusehat/verify-str')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ str: 'invalid-str' }) // Invalid STR
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid STR format');
    });
  });

  describe('POST /api/users/satusehat/sync', () => {
    it('should sync user data with SatuSehat', async () => {
      const mockSyncData = {
        success: true,
        data: {
          synced: true,
          lastSync: new Date().toISOString()
        }
      };

      satuSehatService.syncUserData.mockResolvedValue(mockSyncData);

      const response = await request(app)
        .post('/api/users/satusehat/sync')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.synced).toBe(true);
    });
  });

  describe('GET /api/users/satusehat/status', () => {
    it('should get SatuSehat verification status', async () => {
      const mockStatusData = {
        success: true,
        data: {
          nikVerified: true,
          strVerified: true,
          practitionerStatus: 'active',
          lastSync: new Date().toISOString()
        }
      };

      satuSehatService.getUserStatus.mockResolvedValue(mockStatusData);

      const response = await request(app)
        .get('/api/users/satusehat/status')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nikVerified).toBe(true);
      expect(response.body.data.strVerified).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting for SatuSehat endpoints', async () => {
      const mockNIKData = {
        success: true,
        data: { verified: true }
      };

      satuSehatService.verifyNIK.mockResolvedValue(mockNIKData);

      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .post('/api/users/satusehat/verify-nik')
            .set('Authorization', `Bearer ${nakesToken}`)
            .send({ nik: '1234567890123456' })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle SatuSehat API errors gracefully', async () => {
      satuSehatService.verifyNIK.mockRejectedValue(new Error('SatuSehat API unavailable'));

      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ nik: '1234567890123456' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('error');
    });

    it('should handle missing SatuSehat configuration', async () => {
      // Temporarily remove environment variables
      const originalClientId = process.env.SATUSEHAT_CLIENT_ID;
      delete process.env.SATUSEHAT_CLIENT_ID;

      const response = await request(app)
        .post('/api/users/satusehat/verify-nik')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({ nik: '1234567890123456' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('configuration');

      // Restore environment variable
      process.env.SATUSEHAT_CLIENT_ID = originalClientId;
    });
  });
});