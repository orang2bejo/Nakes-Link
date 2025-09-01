#!/usr/bin/env node

/**
 * User Testing Session Management Script
 * Manages scheduling, conducting, and tracking user testing sessions
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const moment = require('moment-timezone');

// Configuration
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nakes_link',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  calendar: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl: process.env.GOOGLE_REDIRECT_URL,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  },
  zoom: {
    apiKey: process.env.ZOOM_API_KEY,
    apiSecret: process.env.ZOOM_API_SECRET,
    userId: process.env.ZOOM_USER_ID
  },
  testing: {
    timezone: 'Asia/Jakarta',
    sessionDuration: {
      patient: 45, // minutes
      nakes: 60
    },
    bufferTime: 15, // minutes between sessions
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5] // Monday to Friday
  }
};

// Database connection
const pool = new Pool(config.database);

// Email transporter
const emailTransporter = nodemailer.createTransporter(config.email);

// Google Calendar setup
const oauth2Client = new google.auth.OAuth2(
  config.calendar.clientId,
  config.calendar.clientSecret,
  config.calendar.redirectUrl
);

oauth2Client.setCredentials({
  refresh_token: config.calendar.refreshToken
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Testing session scenarios by user type
 */
const testingScenarios = {
  patient: [
    {
      id: 'patient_registration',
      title: 'Registrasi Pasien Baru',
      duration: 8, // minutes
      tasks: [
        'Download dan install aplikasi',
        'Buat akun baru dengan email/nomor HP',
        'Verifikasi OTP',
        'Lengkapi profil dan data diri',
        'Upload foto KTP',
        'Verifikasi identitas'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'patient_booking',
      title: 'Booking Konsultasi Dokter',
      duration: 12,
      tasks: [
        'Login ke aplikasi',
        'Cari dokter berdasarkan spesialisasi',
        'Lihat profil dan jadwal dokter',
        'Pilih slot waktu yang tersedia',
        'Isi keluhan dan gejala',
        'Konfirmasi booking',
        'Lakukan pembayaran'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'patient_consultation',
      title: 'Konsultasi Video Call',
      duration: 15,
      tasks: [
        'Terima notifikasi appointment',
        'Join video call tepat waktu',
        'Komunikasi dengan dokter (simulasi)',
        'Share dokumen/foto jika diperlukan',
        'Terima resep digital',
        'Berikan rating dan review'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'patient_emergency',
      title: 'Fitur SOS Darurat',
      duration: 5,
      tasks: [
        'Akses fitur SOS dari home screen',
        'Pilih jenis emergency',
        'Konfirm lokasi otomatis',
        'Kirim alert ke PSC 119 (simulasi)',
        'Terima konfirmasi dan instruksi'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    }
  ],
  
  nakes: [
    {
      id: 'nakes_registration',
      title: 'Registrasi Tenaga Kesehatan',
      duration: 15,
      tasks: [
        'Registrasi dengan email profesional',
        'Upload dokumen STR dan SIP',
        'Verifikasi dengan SatuSehat',
        'Lengkapi profil profesional',
        'Set jadwal praktik',
        'Review proses approval'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'nakes_schedule',
      title: 'Manajemen Jadwal Praktik',
      duration: 10,
      tasks: [
        'Login ke dashboard Nakes',
        'Set availability schedule',
        'Lihat incoming appointment requests',
        'Approve/reject appointment',
        'Reschedule appointment',
        'Set break time dan cuti'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'nakes_consultation',
      title: 'Konsultasi dengan Pasien',
      duration: 20,
      tasks: [
        'Review patient history sebelum konsultasi',
        'Join video call tepat waktu',
        'Akses medical records pasien',
        'Tulis diagnosis dan treatment plan',
        'Prescribe obat digital',
        'Schedule follow-up jika diperlukan'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    },
    {
      id: 'nakes_emergency',
      title: 'Respons Emergency Alert',
      duration: 10,
      tasks: [
        'Terima emergency notification',
        'Review patient location dan kondisi',
        'Provide immediate guidance',
        'Coordinate dengan emergency services',
        'Document emergency response'
      ],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_count', 'satisfaction_score']
    }
  ]
};

/**
 * Session checklist and preparation
 */
const sessionChecklist = {
  beforeSession: [
    'Konfirmasi kehadiran participant 1 hari sebelumnya',
    'Kirim reminder email dengan link Zoom',
    'Siapkan test environment dan dummy data',
    'Test recording software (OBS/Zoom)',
    'Siapkan scenario scripts dan timer',
    'Backup internet connection',
    'Siapkan consent form digital'
  ],
  
  duringSession: [
    'Welcome dan ice breaking (2 menit)',
    'Explain testing process dan consent (3 menit)',
    'Start screen recording',
    'Run scenarios sesuai script',
    'Encourage think-aloud protocol',
    'Take notes tentang user behavior',
    'Ask follow-up questions',
    'Conduct post-session interview (5 menit)'
  ],
  
  afterSession: [
    'Stop recording dan save file',
    'Send thank you email dengan voucher code',
    'Upload recording ke cloud storage',
    'Input feedback data ke database',
    'Update participant status',
    'Schedule follow-up jika diperlukan',
    'Backup session notes'
  ]
};

/**
 * Create testing session
 */
async function createTestingSession(participantId, scheduledAt, facilitator) {
  const client = await pool.connect();
  
  try {
    // Get participant info
    const participantQuery = 'SELECT * FROM user_testing_participants WHERE participant_id = $1';
    const participantResult = await client.query(participantQuery, [participantId]);
    
    if (participantResult.rows.length === 0) {
      throw new Error(`Participant ${participantId} not found`);
    }
    
    const participant = participantResult.rows[0];
    const sessionDuration = config.testing.sessionDuration[participant.participant_type];
    const endTime = moment(scheduledAt).add(sessionDuration, 'minutes').toDate();
    
    // Create session record
    const sessionQuery = `
      INSERT INTO user_testing_sessions 
      (participant_id, session_type, scheduled_at, duration_minutes, 
       facilitator, status, zoom_meeting_id, calendar_event_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const sessionValues = [
      participantId,
      participant.participant_type,
      scheduledAt,
      sessionDuration,
      facilitator,
      'scheduled',
      null, // Will be updated when Zoom meeting is created
      null  // Will be updated when calendar event is created
    ];
    
    const sessionResult = await client.query(sessionQuery, sessionValues);
    const session = sessionResult.rows[0];
    
    // Create Zoom meeting
    const zoomMeeting = await createZoomMeeting(session, participant);
    
    // Create calendar event
    const calendarEvent = await createCalendarEvent(session, participant, zoomMeeting);
    
    // Update session with meeting details
    await client.query(
      'UPDATE user_testing_sessions SET zoom_meeting_id = $1, calendar_event_id = $2 WHERE id = $3',
      [zoomMeeting.id, calendarEvent.id, session.id]
    );
    
    // Send confirmation email
    await sendSessionConfirmationEmail(participant, session, zoomMeeting);
    
    console.log(`✅ Testing session created for ${participant.name} on ${moment(scheduledAt).format('YYYY-MM-DD HH:mm')}`);
    
    return { ...session, zoom_meeting: zoomMeeting, calendar_event: calendarEvent };
    
  } finally {
    client.release();
  }
}

/**
 * Create Zoom meeting
 */
async function createZoomMeeting(session, participant) {
  // This is a mock implementation - replace with actual Zoom API calls
  const meetingData = {
    id: `zoom_${session.id}_${Date.now()}`,
    join_url: `https://zoom.us/j/123456789?pwd=abc123`,
    meeting_id: '123 456 789',
    password: 'test123',
    start_url: `https://zoom.us/s/123456789?zak=host_key`
  };
  
  console.log(`📹 Zoom meeting created: ${meetingData.meeting_id}`);
  return meetingData;
}

/**
 * Create Google Calendar event
 */
async function createCalendarEvent(session, participant, zoomMeeting) {
  const startTime = moment(session.scheduled_at).toISOString();
  const endTime = moment(session.scheduled_at).add(session.duration_minutes, 'minutes').toISOString();
  
  const event = {
    summary: `User Testing - ${participant.name} (${session.session_type})`,
    description: `
User Testing Session - Nakes Link

Participant: ${participant.name}
Type: ${session.session_type}
Email: ${participant.email}
Phone: ${participant.phone || 'N/A'}

Zoom Meeting:
Join URL: ${zoomMeeting.join_url}
Meeting ID: ${zoomMeeting.meeting_id}
Password: ${zoomMeeting.password}

Facilitator: ${session.facilitator}

Scenarios to test:
${testingScenarios[session.session_type].map(s => `- ${s.title}`).join('\n')}
    `,
    start: {
      dateTime: startTime,
      timeZone: config.testing.timezone
    },
    end: {
      dateTime: endTime,
      timeZone: config.testing.timezone
    },
    attendees: [
      { email: participant.email },
      { email: session.facilitator }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'email', minutes: 60 },      // 1 hour before
        { method: 'popup', minutes: 15 }       // 15 minutes before
      ]
    }
  };
  
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    console.log(`📅 Calendar event created: ${response.data.id}`);
    return response.data;
    
  } catch (error) {
    console.error('❌ Failed to create calendar event:', error.message);
    // Return mock data if calendar creation fails
    return {
      id: `cal_${session.id}_${Date.now()}`,
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock'
    };
  }
}

/**
 * Send session confirmation email
 */
async function sendSessionConfirmationEmail(participant, session, zoomMeeting) {
  const sessionDate = moment(session.scheduled_at).tz(config.testing.timezone);
  const scenarios = testingScenarios[session.session_type];
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🏥 Nakes Link</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">User Testing Session Confirmation</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Halo ${participant.name}! 👋</h2>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
          Terima kasih telah mendaftar sebagai participant user testing Nakes Link. 
          Sesi testing Anda telah dijadwalkan:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">📅 Detail Sesi Testing</h3>
          <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${sessionDate.format('dddd, DD MMMM YYYY')}</p>
          <p style="margin: 5px 0;"><strong>Waktu:</strong> ${sessionDate.format('HH:mm')} - ${sessionDate.add(session.duration_minutes, 'minutes').format('HH:mm')} WIB</p>
          <p style="margin: 5px 0;"><strong>Durasi:</strong> ${session.duration_minutes} menit</p>
          <p style="margin: 5px 0;"><strong>Tipe:</strong> ${session.session_type === 'patient' ? 'Pasien' : 'Tenaga Kesehatan'}</p>
          <p style="margin: 5px 0;"><strong>Facilitator:</strong> ${session.facilitator}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">📹 Zoom Meeting Details</h3>
          <p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${zoomMeeting.meeting_id}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${zoomMeeting.password}</p>
          <p style="margin: 15px 0 5px 0;"><strong>Join URL:</strong></p>
          <a href="${zoomMeeting.join_url}" style="color: #667eea; word-break: break-all;">${zoomMeeting.join_url}</a>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">📋 Yang Akan Kita Test:</h3>
          <ul style="color: #555; line-height: 1.6;">
            ${scenarios.map(scenario => `<li><strong>${scenario.title}</strong> (${scenario.duration} menit)</li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Persiapan Sebelum Sesi:</h3>
          <ul style="color: #856404; line-height: 1.6;">
            <li>Pastikan koneksi internet stabil</li>
            <li>Siapkan smartphone Android/iOS</li>
            <li>Test Zoom terlebih dahulu</li>
            <li>Siapkan lingkungan yang tenang</li>
            <li>Charge device hingga minimal 80%</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #555; margin-bottom: 15px;">Jika ada pertanyaan atau perlu reschedule:</p>
          <p style="color: #667eea; font-weight: bold;">📧 testing@nakeslink.id | 📱 0812-3456-7890</p>
        </div>
        
        <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
          Kami akan mengirim reminder 1 hari dan 1 jam sebelum sesi dimulai.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">Tim Nakes Link | testing@nakeslink.id</p>
      </div>
    </div>
  `;
  
  const mailOptions = {
    from: `"Nakes Link Testing" <${config.email.auth.user}>`,
    to: participant.email,
    cc: session.facilitator,
    subject: `✅ Konfirmasi User Testing - ${sessionDate.format('DD/MM/YYYY HH:mm')} WIB`,
    html: emailContent
  };
  
  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${participant.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send confirmation email:`, error.message);
    return false;
  }
}

/**
 * Send session reminder
 */
async function sendSessionReminder(sessionId, reminderType = '1day') {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT s.*, p.name, p.email, p.phone, p.participant_type
      FROM user_testing_sessions s
      JOIN user_testing_participants p ON s.participant_id = p.participant_id
      WHERE s.id = $1
    `;
    
    const result = await client.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const session = result.rows[0];
    const sessionDate = moment(session.scheduled_at).tz(config.testing.timezone);
    
    let subject, content;
    
    if (reminderType === '1day') {
      subject = `🔔 Reminder: User Testing Besok - ${sessionDate.format('DD/MM HH:mm')} WIB`;
      content = `
        <p>Halo ${session.name}!</p>
        <p>Mengingatkan bahwa Anda memiliki sesi user testing <strong>besok</strong>:</p>
        <p><strong>📅 ${sessionDate.format('dddd, DD MMMM YYYY')}</strong></p>
        <p><strong>⏰ ${sessionDate.format('HH:mm')} WIB</strong></p>
        <p>Jangan lupa untuk mempersiapkan smartphone dan koneksi internet yang stabil.</p>
      `;
    } else if (reminderType === '1hour') {
      subject = `⏰ User Testing dalam 1 Jam - ${sessionDate.format('HH:mm')} WIB`;
      content = `
        <p>Halo ${session.name}!</p>
        <p>Sesi user testing Anda akan dimulai dalam <strong>1 jam</strong>:</p>
        <p><strong>⏰ ${sessionDate.format('HH:mm')} WIB</strong></p>
        <p><strong>📹 Zoom Link:</strong> <a href="${session.zoom_join_url}">Join Meeting</a></p>
        <p>Silakan join 5 menit sebelum waktu dimulai.</p>
      `;
    }
    
    const mailOptions = {
      from: `"Nakes Link Testing" <${config.email.auth.user}>`,
      to: session.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">🏥 Nakes Link User Testing</h2>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            ${content}
          </div>
        </div>
      `
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ ${reminderType} reminder sent to ${session.email}`);
    
    // Update reminder status
    await client.query(
      `UPDATE user_testing_sessions SET ${reminderType}_reminder_sent = true WHERE id = $1`,
      [sessionId]
    );
    
    return true;
    
  } finally {
    client.release();
  }
}

/**
 * Get available time slots
 */
function getAvailableTimeSlots(date, participantType) {
  const targetDate = moment(date).tz(config.testing.timezone);
  const dayOfWeek = targetDate.day();
  
  // Check if it's a working day
  if (!config.testing.workingDays.includes(dayOfWeek)) {
    return [];
  }
  
  const sessionDuration = config.testing.sessionDuration[participantType];
  const bufferTime = config.testing.bufferTime;
  const totalSlotTime = sessionDuration + bufferTime;
  
  const workStart = moment(targetDate).hour(9).minute(0).second(0);
  const workEnd = moment(targetDate).hour(17).minute(0).second(0);
  
  const slots = [];
  let currentSlot = workStart.clone();
  
  while (currentSlot.clone().add(sessionDuration, 'minutes').isBefore(workEnd)) {
    slots.push({
      start: currentSlot.format('HH:mm'),
      end: currentSlot.clone().add(sessionDuration, 'minutes').format('HH:mm'),
      datetime: currentSlot.toISOString()
    });
    
    currentSlot.add(totalSlotTime, 'minutes');
  }
  
  return slots;
}

/**
 * Generate session report
 */
async function generateSessionReport(startDate, endDate) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        s.*,
        p.name,
        p.email,
        p.participant_type,
        COUNT(f.id) as feedback_count,
        AVG(f.satisfaction_score) as avg_satisfaction,
        AVG(f.task_completion_rate) as avg_completion_rate
      FROM user_testing_sessions s
      JOIN user_testing_participants p ON s.participant_id = p.participant_id
      LEFT JOIN user_testing_feedback f ON s.participant_id = f.participant_id
      WHERE s.scheduled_at BETWEEN $1 AND $2
      GROUP BY s.id, p.name, p.email, p.participant_type
      ORDER BY s.scheduled_at
    `;
    
    const result = await client.query(query, [startDate, endDate]);
    
    console.log('\n📊 USER TESTING SESSION REPORT');
    console.log('=' .repeat(60));
    console.log(`Period: ${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`);
    
    const stats = {
      total: result.rows.length,
      completed: result.rows.filter(r => r.status === 'completed').length,
      scheduled: result.rows.filter(r => r.status === 'scheduled').length,
      cancelled: result.rows.filter(r => r.status === 'cancelled').length,
      patients: result.rows.filter(r => r.participant_type === 'patient').length,
      nakes: result.rows.filter(r => r.participant_type === 'nakes').length
    };
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Total Sessions: ${stats.total}`);
    console.log(`Completed: ${stats.completed} (${(stats.completed/stats.total*100).toFixed(1)}%)`);
    console.log(`Scheduled: ${stats.scheduled}`);
    console.log(`Cancelled: ${stats.cancelled}`);
    console.log(`Patients: ${stats.patients}`);
    console.log(`Nakes: ${stats.nakes}`);
    
    if (stats.completed > 0) {
      const avgSatisfaction = result.rows
        .filter(r => r.avg_satisfaction)
        .reduce((sum, r) => sum + parseFloat(r.avg_satisfaction), 0) / stats.completed;
      
      const avgCompletion = result.rows
        .filter(r => r.avg_completion_rate)
        .reduce((sum, r) => sum + parseFloat(r.avg_completion_rate), 0) / stats.completed;
      
      console.log(`\n⭐ QUALITY METRICS:`);
      console.log(`Average Satisfaction: ${avgSatisfaction.toFixed(2)}/5.0`);
      console.log(`Average Completion Rate: ${avgCompletion.toFixed(1)}%`);
    }
    
    console.log(`\n📋 SESSION DETAILS:`);
    result.rows.forEach(session => {
      const date = moment(session.scheduled_at).format('DD/MM HH:mm');
      const status = session.status.toUpperCase();
      const type = session.participant_type.toUpperCase();
      
      console.log(`${date} | ${status.padEnd(10)} | ${type.padEnd(7)} | ${session.name}`);
    });
    
    return stats;
    
  } finally {
    client.release();
  }
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'schedule':
        const participantId = args[1];
        const datetime = args[2]; // YYYY-MM-DD HH:mm
        const facilitator = args[3] || 'testing@nakeslink.id';
        
        if (!participantId || !datetime) {
          console.log('Usage: node user-testing-sessions.js schedule <participant_id> <YYYY-MM-DD HH:mm> [facilitator_email]');
          process.exit(1);
        }
        
        const scheduledAt = moment.tz(datetime, 'YYYY-MM-DD HH:mm', config.testing.timezone).toDate();
        const session = await createTestingSession(participantId, scheduledAt, facilitator);
        
        console.log(`Session ID: ${session.id}`);
        break;
        
      case 'reminder':
        const sessionId = args[1];
        const reminderType = args[2] || '1day'; // '1day' or '1hour'
        
        if (!sessionId) {
          console.log('Usage: node user-testing-sessions.js reminder <session_id> [1day|1hour]');
          process.exit(1);
        }
        
        await sendSessionReminder(parseInt(sessionId), reminderType);
        break;
        
      case 'slots':
        const date = args[1]; // YYYY-MM-DD
        const type = args[2] || 'patient'; // 'patient' or 'nakes'
        
        if (!date) {
          console.log('Usage: node user-testing-sessions.js slots <YYYY-MM-DD> [patient|nakes]');
          process.exit(1);
        }
        
        const slots = getAvailableTimeSlots(date, type);
        
        console.log(`\n📅 Available time slots for ${date} (${type}):`);
        console.log('=' .repeat(40));
        
        if (slots.length === 0) {
          console.log('No available slots (weekend or outside working hours)');
        } else {
          slots.forEach((slot, index) => {
            console.log(`${index + 1}. ${slot.start} - ${slot.end}`);
          });
        }
        break;
        
      case 'report':
        const startDate = args[1] || moment().subtract(7, 'days').format('YYYY-MM-DD');
        const endDate = args[2] || moment().format('YYYY-MM-DD');
        
        await generateSessionReport(startDate, endDate);
        break;
        
      case 'checklist':
        console.log('\n📋 USER TESTING SESSION CHECKLIST');
        console.log('=' .repeat(50));
        
        console.log('\n🔸 BEFORE SESSION:');
        sessionChecklist.beforeSession.forEach((item, index) => {
          console.log(`${index + 1}. ${item}`);
        });
        
        console.log('\n🔸 DURING SESSION:');
        sessionChecklist.duringSession.forEach((item, index) => {
          console.log(`${index + 1}. ${item}`);
        });
        
        console.log('\n🔸 AFTER SESSION:');
        sessionChecklist.afterSession.forEach((item, index) => {
          console.log(`${index + 1}. ${item}`);
        });
        break;
        
      case 'scenarios':
        const scenarioType = args[1] || 'patient';
        
        console.log(`\n📋 TESTING SCENARIOS - ${scenarioType.toUpperCase()}`);
        console.log('=' .repeat(50));
        
        testingScenarios[scenarioType].forEach((scenario, index) => {
          console.log(`\n${index + 1}. ${scenario.title} (${scenario.duration} minutes)`);
          scenario.tasks.forEach((task, taskIndex) => {
            console.log(`   ${taskIndex + 1}. ${task}`);
          });
        });
        break;
        
      default:
        console.log(`\n🏥 Nakes Link User Testing Session Manager\n`);
        console.log('Available commands:');
        console.log('  schedule <participant_id> <datetime> [facilitator]  - Schedule new session');
        console.log('  reminder <session_id> [1day|1hour]                 - Send session reminder');
        console.log('  slots <date> [patient|nakes]                       - Show available time slots');
        console.log('  report [start_date] [end_date]                     - Generate session report');
        console.log('  checklist                                           - Show session checklist');
        console.log('  scenarios [patient|nakes]                          - Show testing scenarios');
        console.log('\nDate format: YYYY-MM-DD');
        console.log('Datetime format: YYYY-MM-DD HH:mm');
        break;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createTestingSession,
  sendSessionReminder,
  getAvailableTimeSlots,
  generateSessionReport,
  testingScenarios,
  sessionChecklist
};