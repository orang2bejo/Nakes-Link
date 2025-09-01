/**
 * Appointments Tests
 * Test suite for appointment management API endpoints
 */

const request = require('supertest');
const app = require('../app');
const { User, Appointment, Service } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Appointments', () => {
  let patientUser, nakesUser, service, appointment;
  let patientToken, nakesToken;

  beforeEach(async () => {
    // Clean up database
    await Appointment.destroy({ where: {} });
    await Service.destroy({ where: {} });
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
      status: 'active'
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
      documentsVerified: true,
      isAvailable: true
    });

    // Create test service
    service = await Service.create({
      name: 'General Consultation',
      description: 'General health consultation',
      category: 'consultation',
      price: 100000,
      duration: 30,
      isActive: true,
      providerId: nakesUser.id
    });

    // Create test appointment
    appointment = await Appointment.create({
      patientId: patientUser.id,
      nakesId: nakesUser.id,
      serviceId: service.id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      appointmentTime: '10:00',
      status: 'scheduled',
      totalAmount: service.price,
      paymentStatus: 'pending',
      notes: 'Test appointment'
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
    await Appointment.destroy({ where: {} });
    await Service.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /api/appointments', () => {
    it('should create new appointment successfully', async () => {
      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: '2024-12-31',
        appointmentTime: '14:00',
        notes: 'New test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.patientId).toBe(patientUser.id);
      expect(response.body.data.appointment.nakesId).toBe(nakesUser.id);
      expect(response.body.data.appointment.status).toBe('scheduled');
    });

    it('should reject appointment with unavailable nakes', async () => {
      // Make nakes unavailable
      await nakesUser.update({ isAvailable: false });

      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: '2024-12-31',
        appointmentTime: '14:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('unavailable');
    });

    it('should reject appointment with past date', async () => {
      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: '2020-01-01', // Past date
        appointmentTime: '14:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject appointment with conflicting time slot', async () => {
      // Create conflicting appointment
      const conflictDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await Appointment.create({
        patientId: patientUser.id,
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: conflictDate,
        appointmentTime: '15:00',
        status: 'scheduled',
        totalAmount: service.price,
        paymentStatus: 'pending'
      });

      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: conflictDate.toISOString().split('T')[0],
        appointmentTime: '15:00' // Same time
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflict');
    });

    it('should require authentication', async () => {
      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: '2024-12-31',
        appointmentTime: '14:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments', () => {
    it('should get patient appointments', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toBeInstanceOf(Array);
      expect(response.body.data.appointments.length).toBeGreaterThan(0);
      expect(response.body.data.appointments[0].patientId).toBe(patientUser.id);
    });

    it('should get nakes appointments', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toBeInstanceOf(Array);
      expect(response.body.data.appointments.length).toBeGreaterThan(0);
      expect(response.body.data.appointments[0].nakesId).toBe(nakesUser.id);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments.every(apt => 
        apt.status === 'scheduled'
      )).toBe(true);
    });

    it('should filter appointments by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/appointments?startDate=${today}&endDate=${tomorrow}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toBeInstanceOf(Array);
    });

    it('should implement pagination', async () => {
      const response = await request(app)
        .get('/api/appointments?page=1&limit=5')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.appointments.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should get specific appointment for patient', async () => {
      const response = await request(app)
        .get(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.id).toBe(appointment.id);
      expect(response.body.data.appointment.patientId).toBe(patientUser.id);
    });

    it('should get specific appointment for nakes', async () => {
      const response = await request(app)
        .get(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.id).toBe(appointment.id);
      expect(response.body.data.appointment.nakesId).toBe(nakesUser.id);
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject access to other users appointments', async () => {
      // Create another patient
      const hashedPassword = await bcrypt.hash('password123', 12);
      const otherPatient = await User.create({
        email: 'other@test.com',
        password: hashedPassword,
        fullName: 'Other Patient',
        full_name: 'Other Patient',
        phone: '+6281234567899',
        role: 'patient',
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherPatient.id, role: otherPatient.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment by patient', async () => {
      const updateData = {
        appointmentDate: '2024-12-30',
        appointmentTime: '15:00',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.notes).toBe(updateData.notes);
    });

    it('should update appointment status by nakes', async () => {
      const updateData = {
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.status).toBe('confirmed');
    });

    it('should reject update of confirmed appointment', async () => {
      // First confirm the appointment
      await appointment.update({ status: 'confirmed' });

      const updateData = {
        appointmentDate: '2024-12-30'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('should cancel appointment by patient', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify appointment is cancelled
      const updatedAppointment = await Appointment.findByPk(appointment.id);
      expect(updatedAppointment.status).toBe('cancelled');
    });

    it('should cancel appointment by nakes', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject cancellation of completed appointment', async () => {
      await appointment.update({ status: 'completed' });

      const response = await request(app)
        .delete(`/api/appointments/${appointment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/appointments/:id/complete', () => {
    it('should complete appointment by nakes', async () => {
      // First confirm the appointment
      await appointment.update({ status: 'confirmed' });

      const completionData = {
        diagnosis: 'Common cold',
        treatment: 'Rest and fluids',
        notes: 'Patient is recovering well'
      };

      const response = await request(app)
        .post(`/api/appointments/${appointment.id}/complete`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(completionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment.status).toBe('completed');
    });

    it('should reject completion by patient', async () => {
      const completionData = {
        diagnosis: 'Common cold',
        treatment: 'Rest and fluids'
      };

      const response = await request(app)
        .post(`/api/appointments/${appointment.id}/complete`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(completionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject completion of non-confirmed appointment', async () => {
      const completionData = {
        diagnosis: 'Common cold',
        treatment: 'Rest and fluids'
      };

      const response = await request(app)
        .post(`/api/appointments/${appointment.id}/complete`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(completionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments/availability/:nakesId', () => {
    it('should get nakes availability', async () => {
      const date = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments/availability/${nakesUser.id}?date=${date}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.availableSlots).toBeInstanceOf(Array);
    });

    it('should return empty slots for unavailable nakes', async () => {
      await nakesUser.update({ isAvailable: false });
      
      const date = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments/availability/${nakesUser.id}?date=${date}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.availableSlots).toHaveLength(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate appointment date format', async () => {
      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: 'invalid-date',
        appointmentTime: '14:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate appointment time format', async () => {
      const appointmentData = {
        nakesId: nakesUser.id,
        serviceId: service.id,
        appointmentDate: '2024-12-31',
        appointmentTime: 'invalid-time'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const appointmentData = {
        // Missing required fields
        appointmentDate: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});