const request = require('supertest');
const app = require('../app');
const { User, Notification } = require('../models');
const jwt = require('jsonwebtoken');

describe('Notifications API', () => {
  let patientToken, nakesToken, adminToken;
  let patientUser, nakesUser, adminUser;
  let notification;

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

    // Create test notification
    notification = await Notification.create({
      user_id: patientUser.id,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'appointment',
      is_read: false
    });
  });

  afterEach(async () => {
    await Notification.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/notifications', () => {
    it('should create notification for admin', async () => {
      const notificationData = {
        user_id: nakesUser.id,
        title: 'Admin Notification',
        message: 'Important message from admin',
        type: 'system'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(notificationData.title);
      expect(response.body.data.message).toBe(notificationData.message);
      expect(response.body.data.user_id).toBe(notificationData.user_id);
      expect(response.body.data.is_read).toBe(false);
    });

    it('should reject creation by patient', async () => {
      const notificationData = {
        user_id: nakesUser.id,
        title: 'Unauthorized Notification',
        message: 'Patient trying to create notification',
        type: 'system'
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(notificationData)
        .expect(403);
    });

    it('should reject creation by nakes', async () => {
      const notificationData = {
        user_id: patientUser.id,
        title: 'Unauthorized Notification',
        message: 'Nakes trying to create notification',
        type: 'system'
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(notificationData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate notification type', async () => {
      const notificationData = {
        user_id: patientUser.id,
        title: 'Invalid Type Notification',
        message: 'Notification with invalid type',
        type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate user exists', async () => {
      const notificationData = {
        user_id: 99999,
        title: 'Non-existent User Notification',
        message: 'Notification for non-existent user',
        type: 'system'
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(404);
    });
  });

  describe('GET /api/notifications', () => {
    it('should get own notifications for patient', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(notif => {
        expect(notif.user_id).toBe(patientUser.id);
      });
    });

    it('should get own notifications for nakes', async () => {
      // Create notification for nakes
      await Notification.create({
        user_id: nakesUser.id,
        title: 'Nakes Notification',
        message: 'Notification for nakes',
        type: 'appointment',
        is_read: false
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(notif => {
        expect(notif.user_id).toBe(nakesUser.id);
      });
    });

    it('should get all notifications for admin', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by read status', async () => {
      const response = await request(app)
        .get('/api/notifications?is_read=false')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(notif => {
        expect(notif.is_read).toBe(false);
      });
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=appointment')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(notif => {
        expect(notif.type).toBe('appointment');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should sort by created_at desc by default', async () => {
      // Create another notification
      await Notification.create({
        user_id: patientUser.id,
        title: 'Newer Notification',
        message: 'This is newer',
        type: 'system',
        is_read: false
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.map(n => new Date(n.created_at));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should get own notification for patient', async () => {
      const response = await request(app)
        .get(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(notification.id);
      expect(response.body.data.user_id).toBe(patientUser.id);
    });

    it('should get any notification for admin', async () => {
      const response = await request(app)
        .get(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(notification.id);
    });

    it('should reject access to other user notification', async () => {
      await request(app)
        .get(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .get('/api/notifications/99999')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark own notification as read for patient', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });

    it('should mark any notification as read for admin', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });

    it('should reject marking other user notification as read', async () => {
      await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });

    it('should handle already read notification', async () => {
      // Mark as read first
      await notification.update({ is_read: true });

      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all own notifications as read for patient', async () => {
      // Create another unread notification
      await Notification.create({
        user_id: patientUser.id,
        title: 'Another Notification',
        message: 'Another unread notification',
        type: 'system',
        is_read: false
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated_count).toBeGreaterThan(0);

      // Verify all notifications are read
      const notifications = await Notification.findAll({
        where: { user_id: patientUser.id }
      });
      notifications.forEach(notif => {
        expect(notif.is_read).toBe(true);
      });
    });

    it('should only mark own notifications for nakes', async () => {
      // Create notification for nakes
      await Notification.create({
        user_id: nakesUser.id,
        title: 'Nakes Notification',
        message: 'Unread notification for nakes',
        type: 'appointment',
        is_read: false
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify patient notification is still unread
      const patientNotification = await Notification.findByPk(notification.id);
      expect(patientNotification.is_read).toBe(false);
    });

    it('should mark all notifications for admin', async () => {
      // Create notifications for different users
      await Notification.create({
        user_id: nakesUser.id,
        title: 'Nakes Notification',
        message: 'Notification for nakes',
        type: 'appointment',
        is_read: false
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated_count).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete own notification for patient', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should delete any notification for admin', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion of other user notification', async () => {
      await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(403);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread count for patient', async () => {
      // Create another unread notification
      await Notification.create({
        user_id: patientUser.id,
        title: 'Another Notification',
        message: 'Another unread notification',
        type: 'system',
        is_read: false
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(2);
    });

    it('should get unread count for nakes', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(0);
    });

    it('should get total unread count for admin', async () => {
      // Create notifications for different users
      await Notification.create({
        user_id: nakesUser.id,
        title: 'Nakes Notification',
        message: 'Unread notification for nakes',
        type: 'appointment',
        is_read: false
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBeGreaterThan(0);
    });
  });

  describe('POST /api/notifications/broadcast', () => {
    it('should broadcast notification to all users for admin', async () => {
      const broadcastData = {
        title: 'System Maintenance',
        message: 'System will be down for maintenance',
        type: 'system'
      };

      const response = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(broadcastData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sent_count).toBeGreaterThan(0);
    });

    it('should broadcast to specific role only', async () => {
      const broadcastData = {
        title: 'Nakes Update',
        message: 'Important update for healthcare professionals',
        type: 'system',
        target_role: 'nakes'
      };

      const response = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(broadcastData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sent_count).toBeGreaterThan(0);
    });

    it('should reject broadcast by non-admin', async () => {
      const broadcastData = {
        title: 'Unauthorized Broadcast',
        message: 'This should not work',
        type: 'system'
      };

      await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(broadcastData)
        .expect(403);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/notifications')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});