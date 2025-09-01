const request = require('supertest');
const app = require('../app');
const { User, Review, Appointment } = require('../models');
const jwt = require('jsonwebtoken');

describe('Reviews API', () => {
  let patientToken, nakesToken, adminToken;
  let patientUser, nakesUser, adminUser;
  let appointment, review;

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

    // Create completed appointment
    appointment = await Appointment.create({
      patient_id: patientUser.id,
      nakes_id: nakesUser.id,
      appointment_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      appointment_time: '10:00',
      status: 'completed',
      complaint: 'Test complaint',
      type: 'consultation'
    });

    // Create test review
    review = await Review.create({
      patient_id: patientUser.id,
      nakes_id: nakesUser.id,
      appointment_id: appointment.id,
      rating: 5,
      comment: 'Excellent service!'
    });
  });

  afterEach(async () => {
    await Review.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/reviews', () => {
    it('should create review for completed appointment', async () => {
      // Create another completed appointment
      const newAppointment = await Appointment.create({
        patient_id: patientUser.id,
        nakes_id: nakesUser.id,
        appointment_date: new Date(Date.now() - 12 * 60 * 60 * 1000),
        appointment_time: '14:00',
        status: 'completed',
        complaint: 'Another complaint',
        type: 'consultation'
      });

      const reviewData = {
        appointment_id: newAppointment.id,
        rating: 4,
        comment: 'Good service'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(reviewData.rating);
      expect(response.body.data.comment).toBe(reviewData.comment);
      expect(response.body.data.patient_id).toBe(patientUser.id);
      expect(response.body.data.nakes_id).toBe(nakesUser.id);
    });

    it('should reject review by nakes', async () => {
      const reviewData = {
        appointment_id: appointment.id,
        rating: 5,
        comment: 'Great patient'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(reviewData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate rating range (1-5)', async () => {
      const reviewData = {
        appointment_id: appointment.id,
        rating: 6,
        comment: 'Invalid rating'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject review for non-completed appointment', async () => {
      const pendingAppointment = await Appointment.create({
        patient_id: patientUser.id,
        nakes_id: nakesUser.id,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        appointment_time: '10:00',
        status: 'confirmed',
        complaint: 'Test complaint',
        type: 'consultation'
      });

      const reviewData = {
        appointment_id: pendingAppointment.id,
        rating: 5,
        comment: 'Premature review'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(reviewData)
        .expect(400);
    });

    it('should reject duplicate review for same appointment', async () => {
      const reviewData = {
        appointment_id: appointment.id,
        rating: 4,
        comment: 'Duplicate review'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(reviewData)
        .expect(400);
    });

    it('should reject review for other patient appointment', async () => {
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

      const reviewData = {
        appointment_id: appointment.id,
        rating: 5,
        comment: 'Unauthorized review'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send(reviewData)
        .expect(403);
    });
  });

  describe('GET /api/reviews', () => {
    it('should get all reviews for admin', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get reviews by nakes_id', async () => {
      const response = await request(app)
        .get(`/api/reviews?nakes_id=${nakesUser.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(review => {
        expect(review.nakes_id).toBe(nakesUser.id);
      });
    });

    it('should get reviews by patient_id for patient (own reviews)', async () => {
      const response = await request(app)
        .get(`/api/reviews?patient_id=${patientUser.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(review => {
        expect(review.patient_id).toBe(patientUser.id);
      });
    });

    it('should reject access to other patient reviews', async () => {
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
        .get(`/api/reviews?patient_id=${patientUser.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/reviews?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should filter by rating', async () => {
      const response = await request(app)
        .get('/api/reviews?rating=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(review => {
        expect(review.rating).toBe(5);
      });
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should get specific review for admin', async () => {
      const response = await request(app)
        .get(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(review.id);
    });

    it('should get own review for patient', async () => {
      const response = await request(app)
        .get(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(review.id);
      expect(response.body.data.patient_id).toBe(patientUser.id);
    });

    it('should get review about nakes for nakes', async () => {
      const response = await request(app)
        .get(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(review.id);
      expect(response.body.data.nakes_id).toBe(nakesUser.id);
    });

    it('should return 404 for non-existent review', async () => {
      await request(app)
        .get('/api/reviews/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update own review for patient', async () => {
      const updateData = {
        rating: 4,
        comment: 'Updated review comment'
      };

      const response = await request(app)
        .put(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(updateData.rating);
      expect(response.body.data.comment).toBe(updateData.comment);
    });

    it('should reject update by nakes', async () => {
      const updateData = {
        rating: 3,
        comment: 'Nakes trying to update'
      };

      await request(app)
        .put(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should reject update by other patient', async () => {
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

      const updateData = {
        rating: 1,
        comment: 'Malicious update'
      };

      await request(app)
        .put(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should validate rating range on update', async () => {
      const updateData = {
        rating: 0,
        comment: 'Invalid rating update'
      };

      const response = await request(app)
        .put(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete review for admin', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should delete own review for patient', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion by nakes', async () => {
      await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });

    it('should reject deletion by other patient', async () => {
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
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/reviews/nakes/:nakesId/stats', () => {
    it('should get review statistics for nakes', async () => {
      const response = await request(app)
        .get(`/api/reviews/nakes/${nakesUser.id}/stats`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('averageRating');
      expect(response.body.data).toHaveProperty('totalReviews');
      expect(response.body.data).toHaveProperty('ratingDistribution');
    });

    it('should return stats for nakes with no reviews', async () => {
      const newNakes = await User.create({
        email: 'new-nakes@test.com',
        password: 'password123',
        role: 'nakes',
        status: 'active',
        fullName: 'Dr. New Nakes',
        phone: '081234567894',
        specialization: 'Umum'
      });

      const response = await request(app)
        .get(`/api/reviews/nakes/${newNakes.id}/stats`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(0);
      expect(response.body.data.totalReviews).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/reviews')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/reviews')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});