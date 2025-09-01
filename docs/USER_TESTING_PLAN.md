# Nakes Link - User Testing Plan

Rencana pengujian UX dengan pengguna nyata untuk mendapatkan feedback MVP sebelum peluncuran produksi.

## Tujuan User Testing

### Objektif Utama
1. **Validasi UX/UI**: Memastikan antarmuka mudah digunakan dan intuitif
2. **Identifikasi Pain Points**: Menemukan hambatan dalam user journey
3. **Feedback Fungsionalitas**: Menguji kelengkapan dan kegunaan fitur
4. **Performance Validation**: Memastikan aplikasi responsif dan stabil
5. **Accessibility Testing**: Memastikan aplikasi dapat diakses semua pengguna

### Key Performance Indicators (KPIs)
- **Task Completion Rate**: >85% untuk task utama
- **Time to Complete**: <3 menit untuk registrasi, <2 menit untuk booking
- **User Satisfaction Score**: >4.0/5.0
- **Error Rate**: <5% untuk critical paths
- **System Usability Scale (SUS)**: >70 (Good), target >80 (Excellent)

## Target Pengguna

### Grup 1: Pasien (5-6 orang)
**Profil Demografis:**
- Usia: 25-65 tahun
- Gender: Mix (3 perempuan, 2-3 laki-laki)
- Lokasi: Urban dan suburban
- Tech Savviness: Beginner hingga intermediate
- Pengalaman telemedicine: Mix (baru dan berpengalaman)

**Kriteria Seleksi:**
- Memiliki smartphone Android/iOS
- Pernah menggunakan aplikasi mobile
- Membutuhkan layanan kesehatan
- Bersedia memberikan feedback konstruktif

### Grup 2: Tenaga Kesehatan (4-5 orang)
**Profil Demografis:**
- Profesi: Dokter umum, dokter spesialis, perawat
- Pengalaman: 2-15 tahun
- Lokasi: Klinik, rumah sakit, praktik mandiri
- Tech Savviness: Beginner hingga advanced

**Kriteria Seleksi:**
- Memiliki STR aktif
- Berpengalaman dengan sistem digital
- Tertarik dengan telemedicine
- Memiliki waktu untuk testing session

## Metodologi Testing

### 1. Pre-Testing Survey
**Durasi**: 5 menit
**Tujuan**: Memahami background dan ekspektasi pengguna

**Pertanyaan Kunci:**
- Pengalaman dengan aplikasi kesehatan
- Ekspektasi terhadap platform telemedicine
- Kekhawatiran utama terkait layanan online
- Preferensi komunikasi dengan tenaga kesehatan

### 2. Moderated Usability Testing
**Durasi**: 45-60 menit per session
**Format**: Individual session (1-on-1)
**Tools**: Screen recording, audio recording, observation notes

### 3. Post-Testing Interview
**Durasi**: 15 menit
**Tujuan**: Mendapatkan feedback kualitatif mendalam

## Skenario Testing

### Untuk Pasien

#### Skenario 1: Registrasi dan Verifikasi
**Task**: "Anda ingin mendaftar sebagai pasien baru di platform Nakes Link"

**Steps to Test:**
1. Download dan install aplikasi
2. Buat akun baru dengan email/nomor HP
3. Verifikasi OTP
4. Lengkapi profil (NIK, data diri, riwayat kesehatan)
5. Upload foto KTP
6. Verifikasi identitas

**Success Criteria:**
- Berhasil membuat akun dalam <3 menit
- Proses verifikasi berjalan lancar
- Informasi tersimpan dengan benar

#### Skenario 2: Pencarian dan Booking Nakes
**Task**: "Anda membutuhkan konsultasi dengan dokter umum untuk keluhan demam"

**Steps to Test:**
1. Login ke aplikasi
2. Cari dokter berdasarkan spesialisasi/lokasi
3. Lihat profil dan jadwal dokter
4. Pilih slot waktu yang tersedia
5. Isi keluhan dan gejala
6. Konfirmasi booking
7. Lakukan pembayaran

**Success Criteria:**
- Menemukan dokter yang sesuai dalam <2 menit
- Proses booking selesai dalam <3 menit
- Pembayaran berhasil tanpa error

#### Skenario 3: Konsultasi Video Call
**Task**: "Anda memiliki appointment dan akan melakukan konsultasi video"

**Steps to Test:**
1. Terima notifikasi appointment
2. Join video call tepat waktu
3. Komunikasi dengan dokter
4. Share dokumen/foto jika diperlukan
5. Terima resep digital
6. Berikan rating dan review

**Success Criteria:**
- Video call berjalan lancar tanpa lag
- Audio/video quality baik
- Fitur sharing berfungsi
- Resep diterima dengan benar

#### Skenario 4: Emergency SOS
**Task**: "Anda mengalami kondisi darurat dan membutuhkan bantuan segera"

**Steps to Test:**
1. Akses fitur SOS dari home screen
2. Pilih jenis emergency
3. Konfirm lokasi otomatis
4. Kirim alert ke PSC 119
5. Terima konfirmasi dan instruksi

**Success Criteria:**
- SOS dapat diakses dalam <10 detik
- Lokasi terdeteksi akurat
- Alert terkirim ke PSC 119
- Instruksi diterima dengan jelas

### Untuk Tenaga Kesehatan

#### Skenario 1: Registrasi dan Verifikasi Nakes
**Task**: "Anda ingin bergabung sebagai dokter di platform Nakes Link"

**Steps to Test:**
1. Registrasi dengan email profesional
2. Upload dokumen STR dan SIP
3. Verifikasi dengan SatuSehat
4. Lengkapi profil profesional
5. Set jadwal praktik
6. Menunggu approval admin

**Success Criteria:**
- Proses upload dokumen mudah
- Verifikasi SatuSehat berhasil
- Profil tersimpan lengkap

#### Skenario 2: Manajemen Jadwal dan Appointment
**Task**: "Anda ingin mengatur jadwal praktik dan mengelola appointment"

**Steps to Test:**
1. Login ke dashboard Nakes
2. Set availability schedule
3. Lihat incoming appointment requests
4. Approve/reject appointment
5. Reschedule jika diperlukan
6. Set break time

**Success Criteria:**
- Jadwal mudah diatur
- Notifikasi appointment real-time
- Reschedule berfungsi lancar

#### Skenario 3: Konsultasi dengan Pasien
**Task**: "Anda memiliki appointment dengan pasien dan akan melakukan konsultasi"

**Steps to Test:**
1. Review patient history sebelum konsultasi
2. Join video call tepat waktu
3. Akses medical records pasien
4. Tulis diagnosis dan treatment plan
5. Prescribe obat digital
6. Schedule follow-up jika diperlukan

**Success Criteria:**
- Patient data mudah diakses
- Video call stabil
- E-prescription system berfungsi
- Follow-up scheduling mudah

#### Skenario 4: Emergency Response
**Task**: "Anda menerima emergency alert dari PSC 119"

**Steps to Test:**
1. Terima emergency notification
2. Review patient location dan kondisi
3. Provide immediate guidance
4. Coordinate dengan emergency services
5. Document emergency response

**Success Criteria:**
- Alert diterima real-time
- Patient info lengkap
- Communication tools berfungsi
- Documentation mudah

## Metrics dan Data Collection

### Quantitative Metrics

#### Performance Metrics
- **Page Load Time**: <3 detik untuk semua halaman
- **API Response Time**: <500ms untuk operasi CRUD
- **Video Call Quality**: >720p, <100ms latency
- **App Crash Rate**: <1% per session

#### Usability Metrics
- **Task Success Rate**: Persentase task yang berhasil diselesaikan
- **Time on Task**: Waktu yang dibutuhkan untuk menyelesaikan task
- **Error Rate**: Jumlah error per task
- **Navigation Efficiency**: Jumlah klik/tap untuk mencapai tujuan

#### Engagement Metrics
- **Session Duration**: Rata-rata waktu penggunaan aplikasi
- **Feature Adoption**: Persentase pengguna yang menggunakan fitur tertentu
- **Return Rate**: Persentase pengguna yang kembali menggunakan aplikasi

### Qualitative Feedback

#### System Usability Scale (SUS) Questionnaire
1. Saya pikir saya akan sering menggunakan sistem ini
2. Saya merasa sistem ini tidak perlu rumit
3. Saya pikir sistem ini mudah digunakan
4. Saya pikir saya memerlukan bantuan teknis untuk menggunakan sistem ini
5. Saya merasa berbagai fungsi dalam sistem ini terintegrasi dengan baik
6. Saya pikir ada terlalu banyak inkonsistensi dalam sistem ini
7. Saya bayangkan kebanyakan orang akan belajar menggunakan sistem ini dengan cepat
8. Saya merasa sistem ini sangat rumit untuk digunakan
9. Saya merasa sangat percaya diri menggunakan sistem ini
10. Saya perlu belajar banyak hal sebelum bisa menggunakan sistem ini

#### Open-ended Questions
- Apa yang paling Anda sukai dari aplikasi ini?
- Apa yang paling membuat frustrasi?
- Fitur apa yang menurut Anda kurang?
- Bagaimana perbandingan dengan aplikasi serupa?
- Apakah Anda akan merekomendasikan aplikasi ini?
- Saran perbaikan yang spesifik?

## Timeline dan Jadwal

### Week 1: Persiapan
- **Day 1-2**: Finalisasi test scenarios dan questions
- **Day 3-4**: Recruitment participants
- **Day 5-7**: Setup testing environment dan tools

### Week 2: Testing Execution
- **Day 1-3**: Testing dengan grup Pasien (5-6 sessions)
- **Day 4-6**: Testing dengan grup Nakes (4-5 sessions)
- **Day 7**: Buffer day untuk additional sessions

### Week 3: Analysis dan Reporting
- **Day 1-3**: Data analysis dan synthesis
- **Day 4-5**: Report writing
- **Day 6-7**: Presentation preparation dan stakeholder review

## Recruitment Strategy

### Pasien
**Channels:**
- Social media ads (Facebook, Instagram)
- Community groups dan forums
- Referral dari existing network
- Local healthcare communities

**Incentives:**
- Voucher konsultasi gratis senilai Rp 100,000
- Early access ke platform
- Certificate of participation

### Tenaga Kesehatan
**Channels:**
- Medical associations (IDI, PPNI, dll)
- Hospital networks
- Medical conferences dan events
- Professional LinkedIn groups

**Incentives:**
- Free premium account untuk 3 bulan
- Priority listing di platform
- Professional development certificate
- Networking opportunities

## Tools dan Setup

### Testing Tools
- **Screen Recording**: OBS Studio atau Loom
- **Video Conferencing**: Zoom dengan recording
- **Survey Platform**: Google Forms atau Typeform
- **Analytics**: Google Analytics, Hotjar
- **Note Taking**: Notion atau Airtable

### Testing Environment
- **Staging Server**: Dedicated testing environment
- **Test Data**: Anonymized sample data
- **Device Testing**: iOS dan Android devices
- **Network Conditions**: WiFi dan mobile data

## Risk Mitigation

### Technical Risks
- **Server Downtime**: Backup testing environment
- **App Crashes**: Real-time monitoring dan quick fixes
- **Network Issues**: Multiple internet connections

### Participant Risks
- **No-shows**: Over-recruit by 20%
- **Technical Difficulties**: Pre-session tech check
- **Bias**: Diverse participant pool

### Data Privacy
- **Consent Forms**: Explicit permission untuk recording
- **Data Anonymization**: Remove PII dari reports
- **Secure Storage**: Encrypted storage untuk recordings

## Success Criteria

### Minimum Viable Results
- **Completion Rate**: 80% participants complete all scenarios
- **SUS Score**: >70 (Good usability)
- **Critical Bugs**: <5 high-priority issues identified
- **User Satisfaction**: >4.0/5.0 average rating

### Optimal Results
- **Completion Rate**: 95% participants complete all scenarios
- **SUS Score**: >80 (Excellent usability)
- **Critical Bugs**: <2 high-priority issues identified
- **User Satisfaction**: >4.5/5.0 average rating
- **Recommendation Rate**: >80% would recommend to others

## Deliverables

### Testing Report
1. **Executive Summary**
2. **Methodology dan Participants**
3. **Quantitative Results**
4. **Qualitative Insights**
5. **Priority Issues dan Recommendations**
6. **Next Steps dan Action Items**

### Supporting Materials
- Raw data dan recordings (anonymized)
- Participant feedback compilation
- Screenshots dan video clips
- Detailed bug reports
- UX improvement recommendations

## Post-Testing Actions

### Immediate (Week 4)
- Fix critical bugs dan usability issues
- Implement quick wins (UI tweaks, copy changes)
- Update user onboarding flow

### Short-term (Month 2)
- Develop missing features identified
- Improve performance bottlenecks
- Enhance accessibility features

### Long-term (Month 3-6)
- Major UX redesigns if needed
- Advanced features based on feedback
- Continuous improvement process

---

**Contact Information:**
- **Project Manager**: [Name] - [email]
- **UX Researcher**: [Name] - [email]
- **Technical Lead**: [Name] - [email]

**Note**: Semua testing akan dilakukan sesuai dengan protokol etika penelitian dan privacy regulations yang berlaku.