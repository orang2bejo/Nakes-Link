const request = require('supertest');
const app = require('../app');
const { User, Service } = require('../models');
const jwt = require('jsonwebtoken');

describe('Services API', () => {
  let patientToken, nakesToken, adminToken;
  let patientUser, nakesUser, adminUser;
  let service;

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

    // Create test service
    service = await Service.create({
      nakes_id: nakesUser.id,
      name: 'Konsultasi Umum',
      description: 'Konsultasi kesehatan umum',
      price: 50000,
      duration: 30,
      category: 'consultation',
      is_active: true
    });
  });

  afterEach(async () => {
    await Service.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/services', () => {
    it('should create service for nakes', async () => {
      const serviceData = {
        name: 'Konsultasi Spesialis',
        description: 'Konsultasi dengan dokter spesialis',
        price: 100000,
        duration: 45,
        category: 'specialist_consultation'
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(serviceData.name);
      expect(response.body.data.price).toBe(serviceData.price);
      expect(response.body.data.nakes_id).toBe(nakesUser.id);
      expect(response.body.data.is_active).toBe(true);
    });

    it('should reject creation by patient', async () => {
      const serviceData = {
        name: 'Invalid Service',
        description: 'Patient trying to create service',
        price: 50000,
        duration: 30,
        category: 'consultation'
      };

      await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(serviceData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate price is positive', async () => {
      const serviceData = {
        name: 'Free Service',
        description: 'Service with invalid price',
        price: -1000,
        duration: 30,
        category: 'consultation'
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(serviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate duration is positive', async () => {
      const serviceData = {
        name: 'Invalid Duration Service',
        description: 'Service with invalid duration',
        price: 50000,
        duration: 0,
        category: 'consultation'
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(serviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate category', async () => {
      const serviceData = {
        name: 'Invalid Category Service',
        description: 'Service with invalid category',
        price: 50000,
        duration: 30,
        category: 'invalid_category'
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(serviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/services', () => {
    it('should get all active services', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(service => {
        expect(service.is_active).toBe(true);
      });
    });

    it('should filter by nakes_id', async () => {
      const response = await request(app)
        .get(`/api/services?nakes_id=${nakesUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.nakes_id).toBe(nakesUser.id);
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/services?category=consultation')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.category).toBe('consultation');
      });
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/services?min_price=40000&max_price=60000')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.price).toBeGreaterThanOrEqual(40000);
        expect(service.price).toBeLessThanOrEqual(60000);
      });
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/services?search=Konsultasi')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.name.toLowerCase()).toContain('konsultasi');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/services?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should sort by price', async () => {
      // Create another service with different price
      await Service.create({
        nakes_id: nakesUser.id,
        name: 'Expensive Service',
        description: 'High price service',
        price: 200000,
        duration: 60,
        category: 'specialist_consultation',
        is_active: true
      });

      const response = await request(app)
        .get('/api/services?sort_by=price&sort_order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.map(s => s.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should include nakes information', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]).toHaveProperty('Nakes');
      expect(response.body.data[0].Nakes).toHaveProperty('fullName');
      expect(response.body.data[0].Nakes).toHaveProperty('specialization');
    });
  });

  describe('GET /api/services/:id', () => {
    it('should get specific service', async () => {
      const response = await request(app)
        .get(`/api/services/${service.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(service.id);
      expect(response.body.data.name).toBe(service.name);
      expect(response.body.data).toHaveProperty('Nakes');
    });

    it('should return 404 for non-existent service', async () => {
      await request(app)
        .get('/api/services/99999')
        .expect(404);
    });

    it('should return 404 for inactive service', async () => {
      await service.update({ is_active: false });

      await request(app)
        .get(`/api/services/${service.id}`)
        .expect(404);
    });
  });

  describe('PUT /api/services/:id', () => {
    it('should update own service for nakes', async () => {
      const updateData = {
        name: 'Updated Service Name',
        description: 'Updated description',
        price: 75000,
        duration: 45
      };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.duration).toBe(updateData.duration);
    });

    it('should reject update by patient', async () => {
      const updateData = {
        name: 'Malicious Update',
        price: 1
      };

      await request(app)
        .put(`/api/services/${service.id}`)
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
        name: 'Unauthorized Update',
        price: 1000000
      };

      await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${otherNakesToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should validate price on update', async () => {
      const updateData = {
        price: -5000
      };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update any service', async () => {
      const updateData = {
        name: 'Admin Updated Service',
        is_active: false
      };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.is_active).toBe(false);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete own service for nakes', async () => {
      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion by patient', async () => {
      await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });

    it('should reject deletion by other nakes', async () => {
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

      await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${otherNakesToken}`)
        .expect(403);
    });

    it('should allow admin to delete any service', async () => {
      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/services/categories', () => {
    it('should get available service categories', async () => {
      const response = await request(app)
        .get('/api/services/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('consultation');
    });
  });

  describe('GET /api/services/nakes/:nakesId', () => {
    it('should get services by specific nakes', async () => {
      const response = await request(app)
        .get(`/api/services/nakes/${nakesUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(service => {
        expect(service.nakes_id).toBe(nakesUser.id);
        expect(service.is_active).toBe(true);
      });
    });

    it('should return empty array for nakes with no services', async () => {
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
        .get(`/api/services/nakes/${newNakes.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('Authentication', () => {
    it('should allow unauthenticated access to GET endpoints', async () => {
      await request(app)
        .get('/api/services')
        .expect(200);

      await request(app)
        .get(`/api/services/${service.id}`)
        .expect(200);
    });

    it('should require authentication for POST/PUT/DELETE', async () => {
      await request(app)
        .post('/api/services')
        .send({ name: 'Test' })
        .expect(401);

      await request(app)
        .put(`/api/services/${service.id}`)
        .send({ name: 'Test' })
        .expect(401);

      await request(app)
        .delete(`/api/services/${service.id}`)
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .post('/api/services')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Test' })
        .expect(401);
    });
  });
});