#!/usr/bin/env node

/**
 * User Testing Recruitment Script
 * Automates participant recruitment and onboarding for Nakes Link user testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

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
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER
  },
  recruitment: {
    targetParticipants: {
      patients: 8,
      nakes: 7
    },
    incentive: {
      patients: 'Voucher belanja Rp 100.000',
      nakes: 'Sertifikat CPD 2 SKP + Voucher Rp 150.000'
    },
    sessionDuration: {
      patients: 45, // minutes
      nakes: 60
    }
  }
};

// Database connection
const pool = new Pool(config.database);

// Email transporter
const emailTransporter = nodemailer.createTransporter(config.email);

// SMS client
const smsClient = twilio(config.sms.accountSid, config.sms.authToken);

/**
 * Generate unique participant ID
 */
function generateParticipantId(type) {
  const prefix = type === 'patient' ? 'PT' : 'NK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Recruitment email templates
 */
const emailTemplates = {
  patient: {
    subject: '🏥 Bantu Kembangkan Aplikasi Kesehatan Nakes Link - Dapatkan Voucher!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🏥 Nakes Link</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Platform Konsultasi Kesehatan Digital</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Halo! Kami Butuh Bantuan Anda 👋</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Kami sedang mengembangkan <strong>Nakes Link</strong>, aplikasi yang memudahkan Anda berkonsultasi dengan tenaga kesehatan secara online. Untuk memastikan aplikasi ini mudah digunakan, kami membutuhkan feedback dari calon pengguna seperti Anda.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">🎁 Apa yang Anda Dapatkan?</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li><strong>Voucher belanja Rp 100.000</strong> sebagai apresiasi</li>
              <li>Akses gratis ke platform Nakes Link</li>
              <li>Berkontribusi untuk kemajuan kesehatan digital Indonesia</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📋 Apa yang Perlu Anda Lakukan?</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Sesi testing online selama <strong>45 menit</strong></li>
              <li>Mencoba fitur-fitur aplikasi (registrasi, booking, konsultasi)</li>
              <li>Memberikan feedback tentang pengalaman Anda</li>
              <li>Mengisi kuesioner singkat</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">✅ Syarat Partisipasi:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Berusia 18-65 tahun</li>
              <li>Memiliki smartphone Android/iOS</li>
              <li>Pernah atau tertarik menggunakan layanan kesehatan online</li>
              <li>Bersedia memberikan feedback jujur</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{registration_link}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">📝 DAFTAR SEKARANG</a>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
            Sesi testing akan dilakukan secara online melalui video call.<br>
            Jadwal fleksibel sesuai ketersediaan Anda.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Tim Nakes Link | Email: testing@nakeslink.id | WA: 0812-3456-7890</p>
        </div>
      </div>
    `
  },
  
  nakes: {
    subject: '👩‍⚕️ Uji Coba Platform Nakes Link - Dapatkan SKP + Voucher!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">👩‍⚕️ Nakes Link</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Platform Telemedicine untuk Tenaga Kesehatan</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Selamat Pagi, Dokter/Nakes! 👋</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Kami mengundang Anda untuk berpartisipasi dalam user testing <strong>Nakes Link</strong>, platform telemedicine yang dirancang khusus untuk memudahkan praktik tenaga kesehatan di era digital.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e;">
            <h3 style="color: #11998e; margin-top: 0;">🎁 Benefit untuk Anda:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li><strong>Sertifikat CPD 2 SKP</strong> dari IDI/organisasi profesi</li>
              <li><strong>Voucher Rp 150.000</strong> sebagai apresiasi</li>
              <li>Early access ke platform Nakes Link</li>
              <li>Networking dengan sesama tenaga kesehatan</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📋 Aktivitas Testing (60 menit):</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Registrasi dan verifikasi STR/SIP</li>
              <li>Setup profil dan jadwal praktik</li>
              <li>Simulasi konsultasi dengan pasien</li>
              <li>Penggunaan fitur e-prescription</li>
              <li>Respons emergency alert PSC 119</li>
              <li>Feedback dan diskusi improvement</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">✅ Kriteria Partisipan:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Tenaga kesehatan dengan STR aktif</li>
              <li>Berpengalaman praktik minimal 1 tahun</li>
              <li>Familiar dengan teknologi digital</li>
              <li>Tertarik dengan telemedicine</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{registration_link}}" style="background: #11998e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">👩‍⚕️ DAFTAR SEBAGAI TESTER</a>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
            Sesi dilakukan online via Zoom/Google Meet.<br>
            Jadwal disesuaikan dengan ketersediaan praktik Anda.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Tim Nakes Link | Email: nakes@nakeslink.id | WA: 0812-3456-7890</p>
        </div>
      </div>
    `
  }
};

/**
 * SMS templates
 */
const smsTemplates = {
  patient: `🏥 Nakes Link: Bantu kami test aplikasi kesehatan & dapatkan voucher Rp100rb! Sesi 45 menit online. Daftar: {{registration_link}}`,
  nakes: `👩‍⚕️ Nakes Link: Uji coba platform telemedicine & dapatkan 2 SKP + voucher Rp150rb! Info: {{registration_link}}`
};

/**
 * Recruitment channels and strategies
 */
const recruitmentChannels = {
  patients: [
    {
      channel: 'social_media',
      platforms: ['Facebook', 'Instagram', 'Twitter', 'TikTok'],
      strategy: 'Targeted ads untuk usia 25-55, interest: kesehatan, teknologi',
      budget: 'Rp 2.000.000',
      expectedReach: '50.000 impressions, 500 clicks'
    },
    {
      channel: 'community_groups',
      platforms: ['WhatsApp Groups', 'Telegram', 'Facebook Groups'],
      strategy: 'Posting di grup ibu-ibu, komunitas kesehatan, grup RT/RW',
      budget: 'Gratis',
      expectedReach: '20 grup x 500 members = 10.000 reach'
    },
    {
      channel: 'healthcare_facilities',
      platforms: ['Puskesmas', 'Klinik', 'RS'],
      strategy: 'Flyer dan poster di ruang tunggu, kerjasama dengan admin',
      budget: 'Rp 500.000 (printing)',
      expectedReach: '50 fasilitas x 100 pasien/hari = 5.000 reach'
    },
    {
      channel: 'referral_program',
      platforms: ['Word of mouth'],
      strategy: 'Bonus Rp 25.000 untuk setiap referral yang berpartisipasi',
      budget: 'Rp 1.000.000',
      expectedReach: 'Target 40 referrals'
    }
  ],
  
  nakes: [
    {
      channel: 'professional_associations',
      platforms: ['IDI', 'PPNI', 'IAI', 'IAKMI'],
      strategy: 'Email blast ke member, posting di grup WhatsApp organisasi',
      budget: 'Gratis (kerjasama)',
      expectedReach: '5.000 members'
    },
    {
      channel: 'medical_conferences',
      platforms: ['Webinar', 'Seminar', 'Workshop'],
      strategy: 'Sponsorship dan recruitment booth di acara medis',
      budget: 'Rp 3.000.000',
      expectedReach: '500 attendees per event'
    },
    {
      channel: 'hospital_networks',
      platforms: ['RS Swasta', 'RS Pemerintah', 'Klinik'],
      strategy: 'Kerjasama dengan HRD untuk internal communication',
      budget: 'Rp 1.000.000 (admin fee)',
      expectedReach: '20 RS x 50 nakes = 1.000 reach'
    },
    {
      channel: 'online_medical_communities',
      platforms: ['Alomedika', 'Medical groups', 'LinkedIn'],
      strategy: 'Posting di forum diskusi, grup LinkedIn dokter',
      budget: 'Gratis',
      expectedReach: '10 grup x 1.000 members = 10.000 reach'
    }
  ]
};

/**
 * Register new participant
 */
async function registerParticipant(data) {
  const client = await pool.connect();
  
  try {
    const participantId = generateParticipantId(data.participant_type);
    
    const query = `
      INSERT INTO user_testing_participants 
      (participant_id, name, email, phone, participant_type, demographics, 
       recruitment_source, consent_given, consent_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      participantId,
      data.name,
      data.email,
      data.phone,
      data.participant_type,
      JSON.stringify(data.demographics || {}),
      data.recruitment_source || 'direct',
      data.consent_given || false,
      data.consent_given ? new Date() : null,
      'active'
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
    
  } finally {
    client.release();
  }
}

/**
 * Send recruitment email
 */
async function sendRecruitmentEmail(email, participantType, customData = {}) {
  const template = emailTemplates[participantType];
  const registrationLink = `https://nakeslink.id/user-testing/register?type=${participantType}&ref=email`;
  
  const htmlContent = template.html.replace(/{{registration_link}}/g, registrationLink);
  
  const mailOptions = {
    from: `"Nakes Link Testing" <${config.email.auth.user}>`,
    to: email,
    subject: template.subject,
    html: htmlContent
  };
  
  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return false;
  }
}

/**
 * Send recruitment SMS
 */
async function sendRecruitmentSMS(phone, participantType) {
  const template = smsTemplates[participantType];
  const registrationLink = `https://nakeslink.id/user-testing/register?type=${participantType}&ref=sms`;
  
  const message = template.replace(/{{registration_link}}/g, registrationLink);
  
  try {
    const result = await smsClient.messages.create({
      body: message,
      from: config.sms.fromNumber,
      to: phone
    });
    
    console.log(`✅ SMS sent to ${phone}: ${result.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
    return false;
  }
}

/**
 * Generate recruitment report
 */
async function generateRecruitmentReport() {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        participant_type,
        status,
        recruitment_source,
        COUNT(*) as count,
        AVG(total_sessions) as avg_sessions
      FROM user_testing_participants 
      GROUP BY participant_type, status, recruitment_source
      ORDER BY participant_type, status, count DESC
    `;
    
    const result = await client.query(query);
    
    console.log('\n📊 RECRUITMENT REPORT');
    console.log('=' .repeat(50));
    
    const report = {
      patients: { total: 0, active: 0, completed: 0, dropped: 0 },
      nakes: { total: 0, active: 0, completed: 0, dropped: 0 },
      sources: {}
    };
    
    result.rows.forEach(row => {
      const type = row.participant_type;
      report[type].total += parseInt(row.count);
      report[type][row.status] += parseInt(row.count);
      
      if (!report.sources[row.recruitment_source]) {
        report.sources[row.recruitment_source] = { patients: 0, nakes: 0 };
      }
      report.sources[row.recruitment_source][type] += parseInt(row.count);
    });
    
    console.log(`\n👥 PARTICIPANTS SUMMARY:`);
    console.log(`Patients: ${report.patients.total} total (${report.patients.active} active, ${report.patients.completed} completed, ${report.patients.dropped} dropped)`);
    console.log(`Nakes: ${report.nakes.total} total (${report.nakes.active} active, ${report.nakes.completed} completed, ${report.nakes.dropped} dropped)`);
    
    console.log(`\n📈 RECRUITMENT SOURCES:`);
    Object.entries(report.sources).forEach(([source, counts]) => {
      console.log(`${source}: ${counts.patients} patients, ${counts.nakes} nakes`);
    });
    
    // Progress towards target
    const patientProgress = (report.patients.total / config.recruitment.targetParticipants.patients * 100).toFixed(1);
    const nakesProgress = (report.nakes.total / config.recruitment.targetParticipants.nakes * 100).toFixed(1);
    
    console.log(`\n🎯 PROGRESS TOWARDS TARGET:`);
    console.log(`Patients: ${patientProgress}% (${report.patients.total}/${config.recruitment.targetParticipants.patients})`);
    console.log(`Nakes: ${nakesProgress}% (${report.nakes.total}/${config.recruitment.targetParticipants.nakes})`);
    
    return report;
    
  } finally {
    client.release();
  }
}

/**
 * Bulk recruitment campaign
 */
async function runRecruitmentCampaign(type, contacts) {
  console.log(`\n🚀 Starting recruitment campaign for ${type}`);
  console.log(`Target: ${contacts.length} contacts`);
  
  const results = {
    emailsSent: 0,
    smsSent: 0,
    errors: []
  };
  
  for (const contact of contacts) {
    try {
      // Send email if available
      if (contact.email) {
        const emailSent = await sendRecruitmentEmail(contact.email, type);
        if (emailSent) results.emailsSent++;
      }
      
      // Send SMS if available
      if (contact.phone) {
        const smsSent = await sendRecruitmentSMS(contact.phone, type);
        if (smsSent) results.smsSent++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.errors.push({ contact, error: error.message });
    }
  }
  
  console.log(`\n✅ Campaign completed:`);
  console.log(`📧 Emails sent: ${results.emailsSent}`);
  console.log(`📱 SMS sent: ${results.smsSent}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  return results;
}

/**
 * Generate recruitment materials
 */
function generateRecruitmentMaterials() {
  const materials = {
    socialMediaPosts: {
      facebook: {
        patients: `🏥 Bantu kami kembangkan aplikasi kesehatan Nakes Link!

✅ Sesi testing 45 menit (online)
🎁 Voucher belanja Rp 100.000
📱 Coba fitur konsultasi dokter digital

Syarat: Usia 18-65 tahun, punya smartphone

Daftar: https://nakeslink.id/user-testing

#NakesLink #KesehatanDigital #UserTesting #Voucher`,
        
        nakes: `👩‍⚕️ Calling all Healthcare Professionals!

Bantu kami sempurnakan platform telemedicine Nakes Link

✅ Sesi testing 60 menit
🏆 Sertifikat CPD 2 SKP
🎁 Voucher Rp 150.000
📋 Test fitur e-prescription, video call, emergency response

Syarat: STR aktif, pengalaman praktik min. 1 tahun

Daftar: https://nakeslink.id/user-testing/nakes

#NakesLink #Telemedicine #CPD #TenagaKesehatan`
      },
      
      instagram: {
        patients: `🏥 CALLING ALL PATIENTS! 📱

Mau coba aplikasi konsultasi dokter terbaru? 
Dapatkan VOUCHER Rp 100K! 💰

✨ Yang kamu lakukan:
• Test aplikasi 45 menit
• Kasih feedback jujur
• Terima voucher belanja

📝 Syarat mudah:
• Usia 18-65 tahun
• Punya smartphone
• Tertarik layanan kesehatan online

Link di bio! 👆

#NakesLink #KesehatanDigital #Voucher #UserTesting #Gratis`,
        
        nakes: `👩‍⚕️ HEALTHCARE HEROES! 🩺

Join our telemedicine platform testing!

🏆 Get 2 CPD Credits + Rp 150K voucher
⏰ 60-minute online session
🔬 Test cutting-edge medical features

✅ Requirements:
• Active STR license
• 1+ years experience
• Tech-savvy

Swipe for details! Register via link in bio 👆

#NakesLink #Telemedicine #CPD #MedTech #HealthcareInnovation`
      }
    },
    
    whatsappMessages: {
      patients: `🏥 *Nakes Link User Testing*

Halo! Kami mengundang Anda untuk mencoba aplikasi konsultasi kesehatan terbaru.

*Benefit:*
✅ Voucher belanja Rp 100.000
✅ Akses gratis platform
✅ Sesi online 45 menit

*Syarat:*
• Usia 18-65 tahun
• Memiliki smartphone
• Bersedia memberikan feedback

Daftar sekarang: https://nakeslink.id/user-testing

Terima kasih! 🙏`,
      
      nakes: `👩‍⚕️ *Undangan User Testing - Nakes Link*

Selamat pagi, Dokter/Nakes!

Kami mengundang Anda untuk menguji platform telemedicine Nakes Link.

*Benefit:*
🏆 Sertifikat CPD 2 SKP
💰 Voucher Rp 150.000
🚀 Early access platform

*Aktivitas (60 menit):*
• Test fitur konsultasi
• Coba e-prescription
• Simulasi emergency response

Info & daftar: https://nakeslink.id/user-testing/nakes

Terima kasih atas kontribusinya! 🙏`
    },
    
    emailSignatures: {
      patients: `
---
🏥 Nakes Link User Testing
Bantu kami kembangkan aplikasi kesehatan digital
Voucher Rp 100K menanti! 🎁
Daftar: https://nakeslink.id/user-testing
      `,
      
      nakes: `
---
👩‍⚕️ Nakes Link - Platform Telemedicine
Uji coba & dapatkan 2 SKP + Voucher Rp 150K
Daftar: https://nakeslink.id/user-testing/nakes
      `
    }
  };
  
  // Save materials to files
  const materialsDir = path.join(__dirname, '../user-testing/materials');
  if (!fs.existsSync(materialsDir)) {
    fs.mkdirSync(materialsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(materialsDir, 'recruitment-materials.json'),
    JSON.stringify(materials, null, 2)
  );
  
  console.log(`✅ Recruitment materials saved to ${materialsDir}`);
  return materials;
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'register':
        const type = args[1]; // 'patient' or 'nakes'
        const name = args[2];
        const email = args[3];
        const phone = args[4];
        
        if (!type || !name || !email) {
          console.log('Usage: node user-testing-recruitment.js register <patient|nakes> <name> <email> [phone]');
          process.exit(1);
        }
        
        const participant = await registerParticipant({
          participant_type: type,
          name,
          email,
          phone,
          consent_given: true
        });
        
        console.log(`✅ Participant registered: ${participant.participant_id}`);
        break;
        
      case 'send-email':
        const emailType = args[1];
        const targetEmail = args[2];
        
        if (!emailType || !targetEmail) {
          console.log('Usage: node user-testing-recruitment.js send-email <patient|nakes> <email>');
          process.exit(1);
        }
        
        await sendRecruitmentEmail(targetEmail, emailType);
        break;
        
      case 'send-sms':
        const smsType = args[1];
        const targetPhone = args[2];
        
        if (!smsType || !targetPhone) {
          console.log('Usage: node user-testing-recruitment.js send-sms <patient|nakes> <phone>');
          process.exit(1);
        }
        
        await sendRecruitmentSMS(targetPhone, smsType);
        break;
        
      case 'campaign':
        const campaignType = args[1];
        const contactsFile = args[2];
        
        if (!campaignType || !contactsFile) {
          console.log('Usage: node user-testing-recruitment.js campaign <patient|nakes> <contacts.json>');
          process.exit(1);
        }
        
        const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
        await runRecruitmentCampaign(campaignType, contacts);
        break;
        
      case 'report':
        await generateRecruitmentReport();
        break;
        
      case 'materials':
        generateRecruitmentMaterials();
        break;
        
      case 'channels':
        console.log('\n📢 RECRUITMENT CHANNELS & STRATEGIES');
        console.log('=' .repeat(50));
        
        console.log('\n👥 PATIENTS:');
        recruitmentChannels.patients.forEach((channel, index) => {
          console.log(`\n${index + 1}. ${channel.channel.toUpperCase()}`);
          console.log(`   Platforms: ${channel.platforms.join(', ')}`);
          console.log(`   Strategy: ${channel.strategy}`);
          console.log(`   Budget: ${channel.budget}`);
          console.log(`   Expected Reach: ${channel.expectedReach}`);
        });
        
        console.log('\n👩‍⚕️ NAKES:');
        recruitmentChannels.nakes.forEach((channel, index) => {
          console.log(`\n${index + 1}. ${channel.channel.toUpperCase()}`);
          console.log(`   Platforms: ${channel.platforms.join(', ')}`);
          console.log(`   Strategy: ${channel.strategy}`);
          console.log(`   Budget: ${channel.budget}`);
          console.log(`   Expected Reach: ${channel.expectedReach}`);
        });
        break;
        
      default:
        console.log(`
🏥 Nakes Link User Testing Recruitment Tool
`);
        console.log('Available commands:');
        console.log('  register <type> <name> <email> [phone]  - Register new participant');
        console.log('  send-email <type> <email>              - Send recruitment email');
        console.log('  send-sms <type> <phone>                - Send recruitment SMS');
        console.log('  campaign <type> <contacts.json>        - Run bulk recruitment campaign');
        console.log('  report                                  - Generate recruitment report');
        console.log('  materials                               - Generate recruitment materials');
        console.log('  channels                                - Show recruitment channels');
        console.log('\nTypes: patient, nakes');
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
  registerParticipant,
  sendRecruitmentEmail,
  sendRecruitmentSMS,
  runRecruitmentCampaign,
  generateRecruitmentReport,
  generateRecruitmentMaterials,
  recruitmentChannels
};