const request = require('supertest');
const app = require('../app');
const { User, ChatRoom, ChatRoomParticipant, Chat, Appointment } = require('../models');
const jwt = require('jsonwebtoken');

describe('Chat API', () => {
  let patientToken, nakesToken, adminToken;
  let patientUser, nakesUser, adminUser;
  let chatRoom, appointment;

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
      status: 'confirmed',
      complaint: 'Test complaint',
      type: 'consultation'
    });

    // Create test chat room
    chatRoom = await ChatRoom.create({
      appointment_id: appointment.id,
      status: 'active'
    });

    // Add participants
    await ChatRoomParticipant.create({
      chat_room_id: chatRoom.id,
      user_id: patientUser.id
    });

    await ChatRoomParticipant.create({
      chat_room_id: chatRoom.id,
      user_id: nakesUser.id
    });
  });

  afterEach(async () => {
    await Chat.destroy({ where: {}, force: true });
    await ChatRoomParticipant.destroy({ where: {}, force: true });
    await ChatRoom.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/chat/rooms', () => {
    it('should create chat room for appointment by patient', async () => {
      // Create new appointment without chat room
      const newAppointment = await Appointment.create({
        patient_id: patientUser.id,
        nakes_id: nakesUser.id,
        appointment_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        appointment_time: '14:00',
        status: 'confirmed',
        complaint: 'Another complaint',
        type: 'consultation'
      });

      const roomData = {
        appointment_id: newAppointment.id
      };

      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment_id).toBe(newAppointment.id);
      expect(response.body.data.status).toBe('active');
    });

    it('should create chat room for appointment by nakes', async () => {
      const newAppointment = await Appointment.create({
        patient_id: patientUser.id,
        nakes_id: nakesUser.id,
        appointment_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        appointment_time: '14:00',
        status: 'confirmed',
        complaint: 'Another complaint',
        type: 'consultation'
      });

      const roomData = {
        appointment_id: newAppointment.id
      };

      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment_id).toBe(newAppointment.id);
    });

    it('should reject creation by unauthorized user', async () => {
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

      const roomData = {
        appointment_id: appointment.id
      };

      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${otherToken}`)
        .send(roomData)
        .expect(403);
    });

    it('should reject duplicate chat room for same appointment', async () => {
      const roomData = {
        appointment_id: appointment.id
      };

      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(roomData)
        .expect(400);
    });

    it('should validate appointment exists', async () => {
      const roomData = {
        appointment_id: 99999
      };

      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(roomData)
        .expect(404);
    });
  });

  describe('GET /api/chat/rooms', () => {
    it('should get chat rooms for patient', async () => {
      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('Appointment');
    });

    it('should get chat rooms for nakes', async () => {
      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/chat/rooms?status=active')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(room => {
        expect(room.status).toBe('active');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/chat/rooms?page=1&limit=5')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get all rooms for admin', async () => {
      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/chat/rooms/:id', () => {
    it('should get specific chat room for participant', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(chatRoom.id);
      expect(response.body.data).toHaveProperty('Participants');
      expect(response.body.data).toHaveProperty('Appointment');
    });

    it('should reject access by non-participant', async () => {
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
        .get(`/api/chat/rooms/${chatRoom.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should allow admin access', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(chatRoom.id);
    });
  });

  describe('POST /api/chat/rooms/:id/messages', () => {
    it('should send message by participant', async () => {
      const messageData = {
        message: 'Hello, this is a test message',
        message_type: 'text'
      };

      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(messageData.message);
      expect(response.body.data.sender_id).toBe(patientUser.id);
      expect(response.body.data.chat_room_id).toBe(chatRoom.id);
    });

    it('should send message by nakes', async () => {
      const messageData = {
        message: 'Hello from nakes',
        message_type: 'text'
      };

      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(messageData.message);
      expect(response.body.data.sender_id).toBe(nakesUser.id);
    });

    it('should reject message by non-participant', async () => {
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

      const messageData = {
        message: 'Unauthorized message',
        message_type: 'text'
      };

      await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(messageData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate message type', async () => {
      const messageData = {
        message: 'Test message',
        message_type: 'invalid_type'
      };

      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle image message type', async () => {
      const messageData = {
        message: 'https://example.com/image.jpg',
        message_type: 'image'
      };

      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message_type).toBe('image');
    });

    it('should reject message to closed room', async () => {
      await chatRoom.update({ status: 'closed' });

      const messageData = {
        message: 'Message to closed room',
        message_type: 'text'
      };

      await request(app)
        .post(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(messageData)
        .expect(400);
    });
  });

  describe('GET /api/chat/rooms/:id/messages', () => {
    beforeEach(async () => {
      // Create test messages
      await Chat.create({
        chat_room_id: chatRoom.id,
        sender_id: patientUser.id,
        message: 'First message',
        message_type: 'text'
      });

      await Chat.create({
        chat_room_id: chatRoom.id,
        sender_id: nakesUser.id,
        message: 'Second message',
        message_type: 'text'
      });
    });

    it('should get messages for participant', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('Sender');
    });

    it('should reject access by non-participant', async () => {
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
        .get(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}/messages?page=1&limit=5`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should sort messages by created_at asc', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.map(m => new Date(m.created_at));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('should allow admin access', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoom.id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/chat/rooms/:id/close', () => {
    it('should close chat room by participant', async () => {
      const response = await request(app)
        .put(`/api/chat/rooms/${chatRoom.id}/close`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('closed');
    });

    it('should close chat room by nakes', async () => {
      const response = await request(app)
        .put(`/api/chat/rooms/${chatRoom.id}/close`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('closed');
    });

    it('should reject closing by non-participant', async () => {
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
        .put(`/api/chat/rooms/${chatRoom.id}/close`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should handle already closed room', async () => {
      await chatRoom.update({ status: 'closed' });

      const response = await request(app)
        .put(`/api/chat/rooms/${chatRoom.id}/close`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('closed');
    });

    it('should allow admin to close any room', async () => {
      const response = await request(app)
        .put(`/api/chat/rooms/${chatRoom.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('closed');
    });
  });

  describe('PUT /api/chat/messages/:id/read', () => {
    let message;

    beforeEach(async () => {
      message = await Chat.create({
        chat_room_id: chatRoom.id,
        sender_id: nakesUser.id,
        message: 'Test message',
        message_type: 'text',
        is_read: false
      });
    });

    it('should mark message as read by recipient', async () => {
      const response = await request(app)
        .put(`/api/chat/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });

    it('should not allow sender to mark own message as read', async () => {
      await request(app)
        .put(`/api/chat/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(400);
    });

    it('should reject access by non-participant', async () => {
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
        .put(`/api/chat/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/chat/unread-count', () => {
    beforeEach(async () => {
      // Create unread messages
      await Chat.create({
        chat_room_id: chatRoom.id,
        sender_id: nakesUser.id,
        message: 'Unread message 1',
        message_type: 'text',
        is_read: false
      });

      await Chat.create({
        chat_room_id: chatRoom.id,
        sender_id: nakesUser.id,
        message: 'Unread message 2',
        message_type: 'text',
        is_read: false
      });
    });

    it('should get unread message count for patient', async () => {
      const response = await request(app)
        .get('/api/chat/unread-count')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(2);
    });

    it('should get unread message count for nakes', async () => {
      const response = await request(app)
        .get('/api/chat/unread-count')
        .set('Authorization', `Bearer ${nakesToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});