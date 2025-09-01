const request = require('supertest');
const app = require('../app');
const { User, MedicalRecord, Appointment } = require('../models');
const jwt = require('jsonwebtoken');

describe('Medical Records API', () => {
  let patientToken, nakesToken, adminToken;
  let patientUser, nakesUser, adminUser;
  let appointment, medicalRecord;

  beforeEach(async () => {
    // Create test users
    patientUser = await User.create({
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient',
      status: 'active',
      fullName: 'Test Patient',
      phone: '081234567890'
    });

    nakesUser = await User.create({
      email: 'nakes@test.com',
      password: 'password123',
      role: 'nakes',
      status: 'active',
      fullName: 'Dr. Test Nakes',
      phone: '081234567891',
      specialization: 'Umum',
      str_number: 'STR123456789',
      sip_number: 'SIP123456789'
    });

    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      fullName: 'Test Admin',
      phone: '081234567892'
    });

    // Generate tokens
    patientToken = jwt.sign(
      { userId: patientUser.id, role: patientUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    nakesToken = jwt.sign(
      { userId: nakesUser.id, role: nakesUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test appointment
    appointment = await Appointment.create({
      patient_id: patientUser.id,
      nakes_id: nakesUser.id,
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      appointment_time: '10:00',
      status: 'completed',
      complaint: 'Test complaint',
      type: 'consultation'
    });

    // Create test medical record
    medicalRecord = await MedicalRecord.create({
      patient_id: patientUser.id,
      nakes_id: nakesUser.id,
      appointment_id: appointment.id,
      diagnosis: 'Test diagnosis',
      treatment: 'Test treatment',
      prescription: 'Test prescription',
      notes: 'Test notes'
    });
  });

  afterEach(async () => {
    await MedicalRecord.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/medical-records', () => {
    it('should create medical record for nakes', async () => {
      const medicalRecordData = {
        patient_id: patientUser.id,
        appointment_id: appointment.id,
        diagnosis: 'New diagnosis',
        treatment: 'New treatment',
        prescription: 'New prescription',
        notes: 'New notes'
      };

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(medicalRecordData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnosis).toBe(medicalRecordData.diagnosis);
      expect(response.body.data.nakes_id).toBe(nakesUser.id);
    });

    it('should reject creation by patient', async () => {
      const medicalRecordData = {
        patient_id: patientUser.id,
        appointment_id: appointment.id,
        diagnosis: 'New diagnosis'
      };

      await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(medicalRecordData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject for non-existent appointment', async () => {
      const medicalRecordData = {
        patient_id: patientUser.id,
        appointment_id: 99999,
        diagnosis: 'Test diagnosis'
      };

      await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(medicalRecordData)
        .expect(404);
    });
  });

  describe('GET /api/medical-records', () => {
    it('should get medical records for patient (own records)', async () => {
      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].patient_id).toBe(patientUser.id);
    });

    it('should get medical records for nakes (their patients)', async () => {
      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].nakes_id).toBe(nakesUser.id);
    });

    it('should filter by patient_id for nakes', async () => {
      const response = await request(app)
        .get(`/api/medical-records?patient_id=${patientUser.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(record => {
        expect(record.patient_id).toBe(patientUser.id);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/medical-records?page=1&limit=5')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/medical-records/:id', () => {
    it('should get specific medical record for patient (own record)', async () => {
      const response = await request(app)
        .get(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(medicalRecord.id);
      expect(response.body.data.patient_id).toBe(patientUser.id);
    });

    it('should get specific medical record for nakes (their patient)', async () => {
      const response = await request(app)
        .get(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(medicalRecord.id);
      expect(response.body.data.nakes_id).toBe(nakesUser.id);
    });

    it('should reject access to other patient records', async () => {
      const otherPatient = await User.create({
        email: 'other@test.com',
        password: 'password123',
        role: 'patient',
        status: 'active',
        fullName: 'Other Patient',
        phone: '081234567893'
      });

      const otherToken = jwt.sign(
        { userId: otherPatient.id, role: otherPatient.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await request(app)
        .get(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent record', async () => {
      await request(app)
        .get('/api/medical-records/99999')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/medical-records/:id', () => {
    it('should update medical record for nakes', async () => {
      const updateData = {
        diagnosis: 'Updated diagnosis',
        treatment: 'Updated treatment',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnosis).toBe(updateData.diagnosis);
      expect(response.body.data.treatment).toBe(updateData.treatment);
    });

    it('should reject update by patient', async () => {
      const updateData = {
        diagnosis: 'Updated diagnosis'
      };

      await request(app)
        .put(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should reject update by other nakes', async () => {
      const otherNakes = await User.create({
        email: 'other-nakes@test.com',
        password: 'password123',
        role: 'nakes',
        status: 'active',
        fullName: 'Dr. Other Nakes',
        phone: '081234567894',
        specialization: 'Umum'
      });

      const otherNakesToken = jwt.sign(
        { userId: otherNakes.id, role: otherNakes.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const updateData = {
        diagnosis: 'Updated diagnosis'
      };

      await request(app)
        .put(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${otherNakesToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/medical-records/:id', () => {
    it('should delete medical record for admin', async () => {
      const response = await request(app)
        .delete(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion by nakes', async () => {
      await request(app)
        .delete(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });

    it('should reject deletion by patient', async () => {
      await request(app)
        .delete(`/api/medical-records/${medicalRecord.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/medical-records')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});