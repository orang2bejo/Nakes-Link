const request = require('supertest');
const app = require('../app');
const { User, Appointment, Payment, Service, Review, MedicalRecord } = require('../models');
const jwt = require('jsonwebtoken');

describe('Admin API', () => {
  let adminToken, nakesToken, patientToken;
  let adminUser, nakesUser, patientUser;
  let testAppointment, testPayment, testService;

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      fullName: 'Test Admin',
      phone: '081234567890'
    });

    nakesUser = await User.create({
      email: 'nakes@test.com',
      password: 'password123',
      role: 'nakes',
      status: 'pending',
      fullName: 'Dr. Test Nakes',
      phone: '081234567891',
      specialization: 'Umum',
      str_number: 'STR123456789',
      sip_number: 'SIP123456789',
      experience_years: 5,
      education: 'S1 Kedokteran',
      workplace: 'RS Test'
    });

    patientUser = await User.create({
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient',
      status: 'active',
      fullName: 'Test Patient',
      phone: '081234567892'
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    nakesToken = jwt.sign(
      { userId: nakesUser.id, role: nakesUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    patientToken = jwt.sign(
      { userId: patientUser.id, role: patientUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test data
    testAppointment = await Appointment.create({
      patient_id: patientUser.id,
      nakes_id: nakesUser.id,
      appointment_date: new Date(),
      appointment_time: '10:00',
      status: 'completed',
      complaint: 'Test complaint',
      type: 'consultation'
    });

    testService = await Service.create({
      nakes_id: nakesUser.id,
      name: 'Test Service',
      description: 'Test service description',
      price: 100000,
      duration: 30,
      category: 'consultation',
      is_active: true
    });

    testPayment = await Payment.create({
      appointment_id: testAppointment.id,
      user_id: patientUser.id,
      amount: 100000,
      payment_method: 'midtrans',
      status: 'completed',
      transaction_id: 'TXN123456'
    });
  });

  afterEach(async () => {
    await Payment.destroy({ where: {}, force: true });
    await Review.destroy({ where: {}, force: true });
    await MedicalRecord.destroy({ where: {}, force: true });
    await Service.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data.users).toHaveProperty('total');
      expect(response.body.data.users).toHaveProperty('patients');
      expect(response.body.data.users).toHaveProperty('nakes');
      expect(response.body.data.users).toHaveProperty('pending_nakes');
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });

    it('should reject access by nakes', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=nakes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.role).toBe('nakes');
      });
    });

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.status).toBe('pending');
      });
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.fullName.toLowerCase()).toContain('test');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should sort users', async () => {
      const response = await request(app)
        .get('/api/admin/users?sortBy=fullName&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const names = response.body.data.map(u => u.fullName);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get specific user details for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${nakesUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(nakesUser.id);
      expect(response.body.data.email).toBe(nakesUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get(`/api/admin/users/${nakesUser.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/admin/users/:id/verify', () => {
    it('should verify nakes user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${nakesUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active', verification_notes: 'Documents verified' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.verification_notes).toBe('Documents verified');
    });

    it('should reject nakes user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${nakesUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'rejected', verification_notes: 'Invalid documents' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.verification_notes).toBe('Invalid documents');
    });

    it('should validate status field', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${nakesUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject verification of non-nakes user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${patientUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .put(`/api/admin/users/${nakesUser.id}/verify`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ status: 'active' })
        .expect(403);
    });
  });

  describe('PUT /api/admin/users/:id/suspend', () => {
    it('should suspend user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${patientUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violation of terms' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
      expect(response.body.data.suspension_reason).toBe('Violation of terms');
    });

    it('should unsuspend user', async () => {
      // First suspend
      await patientUser.update({ status: 'suspended', suspension_reason: 'Test' });

      const response = await request(app)
        .put(`/api/admin/users/${patientUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'unsuspend' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.suspension_reason).toBeNull();
    });

    it('should not suspend admin user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .put(`/api/admin/users/${patientUser.id}/suspend`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });

  describe('GET /api/admin/appointments', () => {
    it('should get all appointments for admin', async () => {
      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('Patient');
      expect(response.body.data[0]).toHaveProperty('Nakes');
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/admin/appointments?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(appointment => {
        expect(appointment.status).toBe('completed');
      });
    });

    it('should filter appointments by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/admin/appointments?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/appointments?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/payments', () => {
    it('should get all payments for admin', async () => {
      const response = await request(app)
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('User');
      expect(response.body.data[0]).toHaveProperty('Appointment');
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/admin/payments?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(payment => {
        expect(payment.status).toBe('completed');
      });
    });

    it('should filter payments by method', async () => {
      const response = await request(app)
        .get('/api/admin/payments?method=midtrans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(payment => {
        expect(payment.payment_method).toBe('midtrans');
      });
    });

    it('should filter payments by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/admin/payments?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/payments?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/services', () => {
    it('should get all services for admin', async () => {
      const response = await request(app)
        .get('/api/admin/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('Nakes');
    });

    it('should filter services by category', async () => {
      const response = await request(app)
        .get('/api/admin/services?category=consultation')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.category).toBe('consultation');
      });
    });

    it('should filter services by status', async () => {
      const response = await request(app)
        .get('/api/admin/services?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.is_active).toBe(true);
      });
    });

    it('should search services by name', async () => {
      const response = await request(app)
        .get('/api/admin/services?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.name.toLowerCase()).toContain('test');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/services?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/services')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/admin/services/:id/status', () => {
    it('should activate service', async () => {
      await testService.update({ is_active: false });

      const response = await request(app)
        .put(`/api/admin/services/${testService.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(true);
    });

    it('should deactivate service', async () => {
      const response = await request(app)
        .put(`/api/admin/services/${testService.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(false);
    });

    it('should validate is_active field', async () => {
      const response = await request(app)
        .put(`/api/admin/services/${testService.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent service', async () => {
      await request(app)
        .put('/api/admin/services/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: true })
        .expect(404);
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .put(`/api/admin/services/${testService.id}/status`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ is_active: false })
        .expect(403);
    });
  });

  describe('GET /api/admin/reports/revenue', () => {
    it('should get revenue report for admin', async () => {
      const response = await request(app)
        .get('/api/admin/reports/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_revenue');
      expect(response.body.data).toHaveProperty('monthly_revenue');
      expect(response.body.data).toHaveProperty('daily_revenue');
    });

    it('should filter revenue by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_revenue');
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/reports/revenue')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/reports/users', () => {
    it('should get user statistics report for admin', async () => {
      const response = await request(app)
        .get('/api/admin/reports/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_users');
      expect(response.body.data).toHaveProperty('user_growth');
      expect(response.body.data).toHaveProperty('user_by_role');
      expect(response.body.data).toHaveProperty('user_by_status');
    });

    it('should filter user report by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/admin/reports/users?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_users');
    });

    it('should reject access by non-admin', async () => {
      await request(app)
        .get('/api/admin/reports/users')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should require admin role for all endpoints', async () => {
      const endpoints = [
        '/api/admin/dashboard',
        '/api/admin/users',
        '/api/admin/appointments',
        '/api/admin/payments',
        '/api/admin/services',
        '/api/admin/reports/revenue',
        '/api/admin/reports/users'
      ];

      for (const endpoint of endpoints) {
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${nakesToken}`)
          .expect(403);
      }
    });
  });
});