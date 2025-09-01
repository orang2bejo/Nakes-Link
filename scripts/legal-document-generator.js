#!/usr/bin/env node

/**
 * Legal Document Generator
 * Automates creation, versioning, and maintenance of legal documents
 * for Nakes Link platform compliance
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Document templates directory
  templatesDir: './legal/templates',
  
  // Output directory for generated documents
  outputDir: './legal/generated',
  
  // Document versioning
  versioning: {
    major: 1,
    minor: 0,
    patch: 0,
    format: 'semantic' // semantic, date, incremental
  },
  
  // Legal document types
  documentTypes: {
    privacyPolicy: {
      template: 'privacy-policy-template.md',
      output: 'privacy-policy.md',
      reviewCycle: 90, // days
      approvalRequired: true,
      translations: ['id', 'en']
    },
    termsOfService: {
      template: 'terms-of-service-template.md',
      output: 'terms-of-service.md',
      reviewCycle: 180,
      approvalRequired: true,
      translations: ['id', 'en']
    },
    cookiePolicy: {
      template: 'cookie-policy-template.md',
      output: 'cookie-policy.md',
      reviewCycle: 365,
      approvalRequired: false,
      translations: ['id', 'en']
    },
    dataProcessingAgreement: {
      template: 'dpa-template.md',
      output: 'data-processing-agreement.md',
      reviewCycle: 365,
      approvalRequired: true,
      translations: ['id', 'en']
    },
    healthcareCompliance: {
      template: 'healthcare-compliance-template.md',
      output: 'healthcare-compliance.md',
      reviewCycle: 180,
      approvalRequired: true,
      translations: ['id', 'en']
    },
    consentForms: {
      template: 'consent-forms-template.md',
      output: 'consent-forms.md',
      reviewCycle: 365,
      approvalRequired: true,
      translations: ['id', 'en']
    }
  },
  
  // Company information
  company: {
    name: 'Nakes Link',
    legalName: 'PT Nakes Link Indonesia',
    address: 'Jakarta, Indonesia',
    email: 'legal@nakeslink.com',
    phone: '+62-21-XXXXXXX',
    website: 'https://nakeslink.com',
    registrationNumber: 'XXXXXXXXXXXXXXX',
    taxId: 'XXXXXXXXXXXXXXX'
  },
  
  // Regulatory information
  regulations: {
    indonesia: {
      healthMinistry: 'Kementerian Kesehatan RI',
      dataProtection: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi',
      telemedicine: 'Permenkes No. 20 Tahun 2019',
      medicalPractice: 'UU No. 29 Tahun 2004 tentang Praktik Kedokteran'
    },
    international: {
      gdpr: 'General Data Protection Regulation (EU) 2016/679',
      hipaa: 'Health Insurance Portability and Accountability Act',
      iso27001: 'ISO/IEC 27001:2013 Information Security Management'
    }
  }
};

// Document template variables
const templateVariables = {
  // Company variables
  COMPANY_NAME: config.company.name,
  COMPANY_LEGAL_NAME: config.company.legalName,
  COMPANY_ADDRESS: config.company.address,
  COMPANY_EMAIL: config.company.email,
  COMPANY_PHONE: config.company.phone,
  COMPANY_WEBSITE: config.company.website,
  COMPANY_REGISTRATION: config.company.registrationNumber,
  COMPANY_TAX_ID: config.company.taxId,
  
  // Date variables
  CURRENT_DATE: new Date().toLocaleDateString('id-ID'),
  CURRENT_YEAR: new Date().getFullYear(),
  EFFECTIVE_DATE: new Date().toLocaleDateString('id-ID'),
  
  // Legal variables
  PRIVACY_OFFICER_EMAIL: 'privacy@nakeslink.com',
  DPO_EMAIL: 'dpo@nakeslink.com',
  LEGAL_EMAIL: 'legal@nakeslink.com',
  SUPPORT_EMAIL: 'support@nakeslink.com',
  
  // Regulatory references
  INDONESIA_DATA_PROTECTION_LAW: config.regulations.indonesia.dataProtection,
  INDONESIA_TELEMEDICINE_REGULATION: config.regulations.indonesia.telemedicine,
  INDONESIA_MEDICAL_PRACTICE_LAW: config.regulations.indonesia.medicalPractice,
  
  // Technical variables
  APP_NAME: 'Nakes Link',
  PLATFORM_TYPE: 'Telemedicine Platform',
  DATA_RETENTION_PERIOD: '7 years',
  COOKIE_RETENTION_PERIOD: '12 months',
  SESSION_TIMEOUT: '30 minutes'
};

// Legal Document Generator Class
class LegalDocumentGenerator {
  constructor() {
    this.templates = new Map();
    this.generatedDocuments = new Map();
    this.documentHistory = [];
  }

  async initialize() {
    console.log('📄 Initializing Legal Document Generator...');
    
    // Create necessary directories
    await this.createDirectories();
    
    // Load document templates
    await this.loadTemplates();
    
    // Initialize version control
    await this.initializeVersionControl();
    
    console.log('✅ Legal Document Generator initialized successfully');
  }

  async createDirectories() {
    const dirs = [
      config.templatesDir,
      config.outputDir,
      path.join(config.outputDir, 'versions'),
      path.join(config.outputDir, 'translations'),
      path.join(config.outputDir, 'drafts'),
      path.join(config.outputDir, 'approved')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    console.log('📁 Document directories created');
  }

  async loadTemplates() {
    console.log('📋 Loading document templates...');
    
    // Create default templates if they don't exist
    await this.createDefaultTemplates();
    
    // Load existing templates
    for (const [docType, docConfig] of Object.entries(config.documentTypes)) {
      const templatePath = path.join(config.templatesDir, docConfig.template);
      
      try {
        const templateContent = await fs.readFile(templatePath, 'utf8');
        this.templates.set(docType, {
          content: templateContent,
          config: docConfig,
          lastModified: (await fs.stat(templatePath)).mtime
        });
        
        console.log(`✅ Loaded template: ${docType}`);
      } catch (error) {
        console.warn(`⚠️ Could not load template ${docType}:`, error.message);
      }
    }
  }

  async createDefaultTemplates() {
    const templates = {
      'privacy-policy-template.md': this.getPrivacyPolicyTemplate(),
      'terms-of-service-template.md': this.getTermsOfServiceTemplate(),
      'cookie-policy-template.md': this.getCookiePolicyTemplate(),
      'dpa-template.md': this.getDataProcessingAgreementTemplate(),
      'healthcare-compliance-template.md': this.getHealthcareComplianceTemplate(),
      'consent-forms-template.md': this.getConsentFormsTemplate()
    };

    for (const [filename, content] of Object.entries(templates)) {
      const templatePath = path.join(config.templatesDir, filename);
      
      try {
        await fs.access(templatePath);
        console.log(`📋 Template exists: ${filename}`);
      } catch {
        await fs.writeFile(templatePath, content);
        console.log(`✅ Created template: ${filename}`);
      }
    }
  }

  getPrivacyPolicyTemplate() {
    return `# Kebijakan Privasi {{COMPANY_NAME}}

**Berlaku efektif:** {{EFFECTIVE_DATE}}

## 1. Pendahuluan

{{COMPANY_LEGAL_NAME}} ("kami", "{{COMPANY_NAME}}") berkomitmen untuk melindungi privasi dan data pribadi pengguna platform telemedicine kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda sesuai dengan {{INDONESIA_DATA_PROTECTION_LAW}} dan peraturan terkait lainnya.

## 2. Informasi yang Kami Kumpulkan

### 2.1 Data Pribadi
- Nama lengkap
- Nomor Induk Kependudukan (NIK)
- Tanggal lahir
- Alamat
- Nomor telepon
- Alamat email
- Foto profil

### 2.2 Data Kesehatan
- Riwayat medis
- Keluhan kesehatan
- Diagnosis
- Resep obat
- Hasil pemeriksaan
- Catatan konsultasi

### 2.3 Data Profesional (untuk Nakes)
- Nomor STR (Surat Tanda Registrasi)
- Nomor SIP (Surat Izin Praktik)
- Spesialisasi
- Riwayat pendidikan
- Pengalaman kerja
- Sertifikasi

### 2.4 Data Teknis
- Alamat IP
- Informasi perangkat
- Log aktivitas
- Cookie dan teknologi pelacakan
- Metadata komunikasi

## 3. Dasar Hukum Pemrosesan Data

Kami memproses data pribadi Anda berdasarkan:
- Persetujuan eksplisit
- Pelaksanaan kontrak layanan
- Kewajiban hukum
- Kepentingan vital (untuk layanan darurat)
- Kepentingan sah perusahaan

## 4. Tujuan Penggunaan Data

### 4.1 Layanan Telemedicine
- Memfasilitasi konsultasi online
- Menyimpan rekam medis elektronik
- Mengelola jadwal konsultasi
- Memproses pembayaran

### 4.2 Keamanan dan Kepatuhan
- Verifikasi identitas pengguna
- Mencegah penipuan
- Mematuhi regulasi kesehatan
- Audit dan pelaporan

### 4.3 Peningkatan Layanan
- Analisis penggunaan platform
- Pengembangan fitur baru
- Personalisasi pengalaman
- Dukungan pelanggan

## 5. Pembagian Data

Kami dapat membagikan data Anda dengan:
- Tenaga kesehatan yang terlibat dalam perawatan
- Penyedia layanan teknologi (dengan perjanjian kerahasiaan)
- Otoritas regulasi (jika diwajibkan hukum)
- Mitra bisnis (dengan persetujuan Anda)

## 6. Keamanan Data

### 6.1 Enkripsi
- Data in transit: TLS 1.3
- Data at rest: AES-256
- Database: Enkripsi tingkat kolom

### 6.2 Kontrol Akses
- Autentikasi multi-faktor
- Kontrol akses berbasis peran
- Audit log akses
- Sesi timeout otomatis

### 6.3 Monitoring
- Deteksi intrusi 24/7
- Monitoring anomali
- Backup terenkripsi
- Disaster recovery plan

## 7. Retensi Data

- Data medis: {{DATA_RETENTION_PERIOD}} (sesuai regulasi)
- Data akun: Selama akun aktif + 2 tahun
- Log sistem: 1 tahun
- Data pembayaran: 10 tahun
- Cookie: {{COOKIE_RETENTION_PERIOD}}

## 8. Hak Pengguna

Sesuai dengan {{INDONESIA_DATA_PROTECTION_LAW}}, Anda memiliki hak:

### 8.1 Hak Akses
- Mengetahui data yang kami miliki
- Mendapatkan salinan data
- Informasi tujuan pemrosesan

### 8.2 Hak Koreksi
- Memperbaiki data yang tidak akurat
- Melengkapi data yang tidak lengkap
- Memperbarui informasi profil

### 8.3 Hak Penghapusan
- Menghapus data (dengan batasan hukum)
- Right to be forgotten
- Penghapusan otomatis setelah retensi

### 8.4 Hak Portabilitas
- Mengekspor data dalam format standar
- Transfer ke penyedia lain
- Backup data pribadi

### 8.5 Hak Keberatan
- Menolak pemrosesan tertentu
- Opt-out dari marketing
- Pembatasan pemrosesan

## 9. Cookie dan Teknologi Pelacakan

### 9.1 Jenis Cookie
- Cookie esensial: Fungsi dasar platform
- Cookie analitik: Analisis penggunaan
- Cookie fungsional: Preferensi pengguna
- Cookie marketing: Personalisasi konten

### 9.2 Pengelolaan Cookie
- Pengaturan cookie di browser
- Cookie consent manager
- Opt-out tools

## 10. Transfer Data Internasional

Jika data ditransfer ke luar Indonesia:
- Adequacy decision atau safeguards yang sesuai
- Standard Contractual Clauses (SCC)
- Binding Corporate Rules (BCR)
- Persetujuan eksplisit pengguna

## 11. Kepatuhan Regulasi

### 11.1 Regulasi Indonesia
- {{INDONESIA_DATA_PROTECTION_LAW}}
- {{INDONESIA_TELEMEDICINE_REGULATION}}
- {{INDONESIA_MEDICAL_PRACTICE_LAW}}
- Peraturan Menteri Kesehatan terkait

### 11.2 Standar Internasional
- ISO 27001 (Information Security)
- ISO 27799 (Health Informatics Security)
- HL7 FHIR (Health Data Interoperability)

## 12. Insiden Keamanan

Dalam hal terjadi pelanggaran data:
- Notifikasi ke otoritas dalam 72 jam
- Pemberitahuan ke pengguna yang terdampak
- Investigasi menyeluruh
- Langkah mitigasi dan pencegahan

## 13. Kebijakan untuk Anak

Untuk pengguna di bawah 18 tahun:
- Persetujuan orang tua/wali diperlukan
- Perlindungan khusus data anak
- Pembatasan pengumpulan data
- Hak khusus penghapusan

## 14. Perubahan Kebijakan

- Notifikasi 30 hari sebelum perubahan signifikan
- Publikasi di website dan aplikasi
- Email notification ke pengguna terdaftar
- Versi history tersedia

## 15. Kontak

### Data Protection Officer (DPO)
- Email: {{DPO_EMAIL}}
- Telepon: {{COMPANY_PHONE}}
- Alamat: {{COMPANY_ADDRESS}}

### Tim Legal
- Email: {{LEGAL_EMAIL}}
- Untuk keluhan dan pertanyaan privasi

### Otoritas Pengawas
- Kementerian Komunikasi dan Informatika
- Komisi Informasi Pusat
- Kementerian Kesehatan RI

## 16. Definisi

**Data Pribadi**: Informasi yang dapat mengidentifikasi individu
**Data Sensitif**: Data kesehatan, biometrik, dan kategori khusus lainnya
**Pemrosesan**: Operasi pada data pribadi
**Pengendali Data**: {{COMPANY_LEGAL_NAME}}
**Prosesor Data**: Pihak ketiga yang memproses data atas nama kami

---

*Dokumen ini dibuat pada {{CURRENT_DATE}} dan akan ditinjau secara berkala untuk memastikan kepatuhan terhadap peraturan yang berlaku.*

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Telepon: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}`;
  }

  getTermsOfServiceTemplate() {
    return `# Syarat dan Ketentuan Layanan {{COMPANY_NAME}}

**Berlaku efektif:** {{EFFECTIVE_DATE}}

## 1. Pendahuluan

Selamat datang di {{COMPANY_NAME}}, platform telemedicine yang dioperasikan oleh {{COMPANY_LEGAL_NAME}}. Dengan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut.

## 2. Definisi

- **Platform**: Aplikasi dan website {{COMPANY_NAME}}
- **Pengguna**: Pasien dan tenaga kesehatan yang menggunakan platform
- **Nakes**: Tenaga kesehatan profesional yang terdaftar
- **Layanan**: Semua fitur dan fungsi yang tersedia di platform
- **Konsultasi**: Interaksi medis antara pasien dan Nakes melalui platform

## 3. Pendaftaran dan Akun

### 3.1 Persyaratan Pendaftaran
- Berusia minimal 18 tahun atau memiliki persetujuan orang tua/wali
- Memberikan informasi yang akurat dan lengkap
- Memiliki alamat email dan nomor telepon yang valid
- Menyetujui verifikasi identitas

### 3.2 Verifikasi Akun
- Verifikasi email dan nomor telepon
- Upload dokumen identitas (KTP/Passport)
- Untuk Nakes: Verifikasi STR dan SIP melalui SatuSehat
- Proses verifikasi dapat memakan waktu 1-3 hari kerja

### 3.3 Keamanan Akun
- Menjaga kerahasiaan password
- Mengaktifkan autentikasi dua faktor
- Melaporkan aktivitas mencurigakan
- Logout dari perangkat yang tidak digunakan

## 4. Layanan Platform

### 4.1 Untuk Pasien
- Konsultasi video/chat dengan Nakes
- Booking jadwal konsultasi
- Akses rekam medis elektronik
- Resep digital dan pengiriman obat
- Layanan SOS darurat
- Reminder pengobatan

### 4.2 Untuk Nakes
- Manajemen jadwal praktik
- Konsultasi dengan pasien
- Pembuatan resep digital
- Akses rekam medis pasien
- Dashboard analitik praktik
- Sistem pembayaran terintegrasi

### 4.3 Batasan Layanan
- Tidak menggantikan pemeriksaan fisik langsung
- Tidak untuk kondisi darurat yang memerlukan penanganan segera
- Tidak untuk prosedur medis yang memerlukan intervensi fisik
- Terbatas pada konsultasi dan diagnosis awal

## 5. Kewajiban Pengguna

### 5.1 Kewajiban Umum
- Menggunakan platform sesuai tujuan yang dimaksudkan
- Tidak menyalahgunakan atau merusak sistem
- Menghormati privasi pengguna lain
- Mematuhi hukum dan regulasi yang berlaku
- Memberikan informasi yang akurat

### 5.2 Kewajiban Pasien
- Memberikan riwayat medis yang lengkap dan akurat
- Mengikuti instruksi medis yang diberikan
- Melaporkan efek samping atau komplikasi
- Membayar biaya konsultasi sesuai tarif
- Tidak membagikan akses akun kepada orang lain

### 5.3 Kewajiban Nakes
- Memiliki lisensi praktik yang valid
- Memberikan layanan sesuai standar profesi
- Menjaga kerahasiaan informasi pasien
- Melakukan rujukan jika diperlukan
- Memperbarui jadwal ketersediaan
- Merespons konsultasi dalam waktu yang wajar

## 6. Pembayaran dan Biaya

### 6.1 Struktur Tarif
- Konsultasi umum: Rp 50.000 - Rp 150.000
- Konsultasi spesialis: Rp 200.000 - Rp 500.000
- Layanan darurat: Tarif khusus berlaku
- Biaya platform: 10-15% dari tarif konsultasi

### 6.2 Metode Pembayaran
- Transfer bank
- E-wallet (GoPay, OVO, DANA)
- Kartu kredit/debit
- Virtual account
- Saldo {{COMPANY_NAME}} Wallet

### 6.3 Kebijakan Refund
- Pembatalan 24 jam sebelum konsultasi: Refund 100%
- Pembatalan 2-24 jam sebelum: Refund 50%
- Pembatalan kurang dari 2 jam: Tidak ada refund
- Masalah teknis platform: Refund penuh atau reschedule
- Ketidakhadiran Nakes: Refund penuh + kompensasi

### 6.4 Sistem Wallet
- Top-up minimum: Rp 50.000
- Saldo tidak memiliki masa kadaluarsa
- Withdrawal minimum: Rp 100.000
- Biaya withdrawal: Rp 5.000

## 7. Hak Kekayaan Intelektual

### 7.1 Kepemilikan Platform
- {{COMPANY_NAME}} memiliki semua hak atas platform
- Teknologi, algoritma, dan desain dilindungi hak cipta
- Trademark dan logo adalah milik {{COMPANY_LEGAL_NAME}}
- Pengguna tidak boleh menyalin atau mendistribusikan

### 7.2 Konten Pengguna
- Pengguna mempertahankan hak atas konten yang dibuat
- {{COMPANY_NAME}} mendapat lisensi untuk menggunakan konten
- Konten tidak boleh melanggar hak pihak ketiga
- {{COMPANY_NAME}} dapat menghapus konten yang melanggar

### 7.3 Penggunaan yang Diizinkan
- Penggunaan personal dan non-komersial
- Tidak boleh melakukan reverse engineering
- Tidak boleh membuat aplikasi kompetitor
- Tidak boleh menggunakan data untuk tujuan lain

## 8. Privasi dan Keamanan Data

### 8.1 Perlindungan Data
- Enkripsi end-to-end untuk komunikasi
- Penyimpanan data sesuai standar ISO 27001
- Akses data terbatas dan teraudit
- Backup data terenkripsi

### 8.2 Kerahasiaan Medis
- Informasi medis dijaga kerahasiaan
- Akses hanya untuk Nakes yang terlibat
- Tidak dibagikan tanpa persetujuan
- Audit trail untuk semua akses data

### 8.3 Pelaporan Insiden
- Notifikasi segera untuk pelanggaran data
- Investigasi menyeluruh
- Langkah mitigasi dan pencegahan
- Laporan ke otoritas yang berwenang

## 9. Tanggung Jawab dan Batasan

### 9.1 Tanggung Jawab {{COMPANY_NAME}}
- Menyediakan platform yang aman dan reliable
- Memfasilitasi komunikasi antara pasien dan Nakes
- Melindungi data pengguna
- Memberikan dukungan teknis

### 9.2 Batasan Tanggung Jawab
- Tidak bertanggung jawab atas diagnosis atau treatment
- Tidak menjamin hasil medis tertentu
- Tidak bertanggung jawab atas malpraktik Nakes
- Batasan ganti rugi sesuai hukum yang berlaku

### 9.3 Force Majeure
- Bencana alam
- Gangguan internet atau listrik
- Perubahan regulasi pemerintah
- Pandemi atau wabah penyakit

## 10. Penyelesaian Sengketa

### 10.1 Mediasi
- Upaya penyelesaian melalui mediasi terlebih dahulu
- Mediator independen yang disepakati
- Proses mediasi maksimal 60 hari

### 10.2 Arbitrase
- Jika mediasi gagal, sengketa diselesaikan melalui arbitrase
- Arbitrase dilakukan di Jakarta
- Menggunakan aturan BANI (Badan Arbitrase Nasional Indonesia)
- Keputusan arbitrase bersifat final dan mengikat

### 10.3 Hukum yang Berlaku
- Tunduk pada hukum Republik Indonesia
- Yurisdiksi Pengadilan Negeri Jakarta Pusat
- Bahasa resmi: Bahasa Indonesia

## 11. Kepatuhan Regulasi

### 11.1 Regulasi Kesehatan
- {{INDONESIA_TELEMEDICINE_REGULATION}}
- {{INDONESIA_MEDICAL_PRACTICE_LAW}}
- Standar profesi kedokteran
- Peraturan farmasi dan obat

### 11.2 Regulasi Teknologi
- {{INDONESIA_DATA_PROTECTION_LAW}}
- UU ITE dan perubahannya
- Peraturan fintech dan pembayaran
- Standar keamanan siber

### 11.3 Regulasi Keuangan
- Peraturan Bank Indonesia
- Anti money laundering (AML)
- Know Your Customer (KYC)
- Pelaporan transaksi keuangan

## 12. Pemutusan dan Penangguhan

### 12.1 Pemutusan oleh Pengguna
- Dapat mengakhiri akun kapan saja
- Data akan dihapus sesuai kebijakan retensi
- Saldo wallet dapat ditarik
- Konsultasi yang sudah dibayar tetap berlaku

### 12.2 Penangguhan oleh {{COMPANY_NAME}}
- Pelanggaran syarat dan ketentuan
- Aktivitas mencurigakan atau ilegal
- Keluhan berulang dari pengguna lain
- Masalah verifikasi identitas atau lisensi

### 12.3 Konsekuensi Pemutusan
- Kehilangan akses ke platform
- Penghapusan data sesuai kebijakan
- Penyelesaian kewajiban finansial
- Tidak ada refund untuk layanan yang sudah digunakan

## 13. Ketentuan Khusus

### 13.1 Layanan Darurat
- SOS button untuk kondisi darurat
- Integrasi dengan PSC 119
- Respons time maksimal 5 menit
- Tidak menggantikan ambulans atau IGD

### 13.2 Telemedicine
- Konsultasi jarak jauh sesuai regulasi
- Batasan diagnosis dan treatment
- Kewajiban rujukan untuk kasus kompleks
- Dokumentasi lengkap setiap konsultasi

### 13.3 Resep Digital
- Resep elektronik yang sah secara hukum
- Integrasi dengan apotek partner
- Verifikasi obat dan dosis
- Tracking pengiriman obat

### 13.4 Pengguna Internasional
- Layanan terbatas untuk WNI di luar negeri
- Verifikasi tambahan untuk pengguna asing
- Compliance dengan regulasi negara asal
- Batasan layanan sesuai lisensi Nakes

## 14. Teknologi dan Kompatibilitas

### 14.1 Persyaratan Sistem
- Android 8.0+ atau iOS 12.0+
- Koneksi internet stabil minimum 1 Mbps
- Kamera dan mikrofon untuk video call
- Browser modern untuk web access

### 14.2 Pembaruan Aplikasi
- Update otomatis untuk fitur keamanan
- Notifikasi untuk update major
- Backward compatibility 2 versi
- Dukungan teknis untuk versi lama terbatas

### 14.3 Downtime dan Maintenance
- Scheduled maintenance diumumkan 48 jam sebelumnya
- Emergency maintenance tanpa pemberitahuan
- SLA uptime 99.5%
- Kompensasi untuk downtime berkepanjangan

## 15. Kontak dan Dukungan

### 15.1 Customer Support
- Email: {{SUPPORT_EMAIL}}
- Telepon: {{COMPANY_PHONE}}
- Live chat: 24/7 di aplikasi
- FAQ dan knowledge base

### 15.2 Tim Legal
- Email: {{LEGAL_EMAIL}}
- Untuk pertanyaan hukum dan compliance
- Pelaporan pelanggaran
- Permintaan informasi legal

### 15.3 Kantor Pusat
{{COMPANY_LEGAL_NAME}}  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Telepon: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

---

*Syarat dan Ketentuan ini berlaku efektif sejak {{EFFECTIVE_DATE}} dan dapat diubah sewaktu-waktu dengan pemberitahuan yang sesuai.*

**Dengan menggunakan layanan {{COMPANY_NAME}}, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan di atas.**`;
  }

  getCookiePolicyTemplate() {
    return `# Kebijakan Cookie {{COMPANY_NAME}}

**Berlaku efektif:** {{EFFECTIVE_DATE}}

## 1. Apa itu Cookie?

Cookie adalah file teks kecil yang disimpan di perangkat Anda ketika mengunjungi website atau menggunakan aplikasi {{COMPANY_NAME}}. Cookie membantu kami memberikan pengalaman yang lebih baik dan personal.

## 2. Jenis Cookie yang Kami Gunakan

### 2.1 Cookie Esensial
**Tujuan**: Fungsi dasar platform  
**Durasi**: {{SESSION_TIMEOUT}}  
**Dapat ditolak**: Tidak

- Session management
- Autentikasi pengguna
- Keamanan platform
- Load balancing

### 2.2 Cookie Fungsional
**Tujuan**: Meningkatkan pengalaman pengguna  
**Durasi**: {{COOKIE_RETENTION_PERIOD}}  
**Dapat ditolak**: Ya

- Preferensi bahasa
- Pengaturan tampilan
- Riwayat pencarian
- Bookmark konsultasi

### 2.3 Cookie Analitik
**Tujuan**: Memahami penggunaan platform  
**Durasi**: {{COOKIE_RETENTION_PERIOD}}  
**Dapat ditolak**: Ya

- Google Analytics
- Heatmap analysis
- Performance monitoring
- User behavior tracking

### 2.4 Cookie Marketing
**Tujuan**: Personalisasi konten dan iklan  
**Durasi**: {{COOKIE_RETENTION_PERIOD}}  
**Dapat ditolak**: Ya

- Targeted advertising
- Social media integration
- Email marketing tracking
- Conversion tracking

## 3. Teknologi Pelacakan Lainnya

### 3.1 Web Beacons
- Pixel tracking untuk email
- Analisis engagement
- Conversion measurement

### 3.2 Local Storage
- Penyimpanan preferensi
- Cache data aplikasi
- Offline functionality

### 3.3 Device Fingerprinting
- Fraud prevention
- Security monitoring
- Device identification

## 4. Pengelolaan Cookie

### 4.1 Pengaturan Browser
- Chrome: Settings > Privacy and Security > Cookies
- Firefox: Options > Privacy & Security > Cookies
- Safari: Preferences > Privacy > Cookies
- Edge: Settings > Cookies and site permissions

### 4.2 Cookie Consent Manager
- Akses melalui banner cookie
- Pengaturan granular per kategori
- Withdraw consent kapan saja
- Cookie preference center

### 4.3 Opt-out Tools
- Google Analytics Opt-out
- Facebook Pixel Opt-out
- Industry opt-out tools
- Do Not Track signals

## 5. Cookie Pihak Ketiga

### 5.1 Google Services
- Google Analytics
- Google Ads
- Google Maps
- reCAPTCHA

### 5.2 Social Media
- Facebook Pixel
- Twitter Analytics
- LinkedIn Insights
- WhatsApp Business

### 5.3 Payment Providers
- Midtrans
- Xendit
- GoPay
- OVO

## 6. Dampak Menonaktifkan Cookie

### 6.1 Cookie Esensial
- Platform tidak dapat berfungsi dengan baik
- Tidak dapat login atau mengakses akun
- Fitur keamanan terganggu

### 6.2 Cookie Fungsional
- Kehilangan preferensi personal
- Pengalaman pengguna menurun
- Perlu setting ulang setiap kunjungan

### 6.3 Cookie Analitik
- Tidak mempengaruhi fungsi platform
- Membantu kami meningkatkan layanan
- Data anonim untuk analisis

### 6.4 Cookie Marketing
- Iklan kurang relevan
- Konten tidak personal
- Tracking conversion terbatas

## 7. Keamanan Cookie

### 7.1 Secure Cookies
- Transmisi hanya melalui HTTPS
- Enkripsi data cookie
- Protection against interception

### 7.2 HttpOnly Cookies
- Tidak dapat diakses via JavaScript
- Protection against XSS attacks
- Server-side only access

### 7.3 SameSite Attribute
- CSRF protection
- Cross-site request limitation
- Enhanced security

## 8. Retensi dan Penghapusan

### 8.1 Periode Retensi
- Session cookies: Sampai browser ditutup
- Persistent cookies: {{COOKIE_RETENTION_PERIOD}}
- Analytics cookies: 26 bulan
- Marketing cookies: 13 bulan

### 8.2 Penghapusan Otomatis
- Expired cookies dihapus otomatis
- Cleanup routine harian
- User-initiated deletion

## 9. Perubahan Kebijakan

- Notifikasi melalui banner cookie
- Email notification untuk perubahan material
- Update consent requirements
- Grace period untuk adjustment

## 10. Kontak

Untuk pertanyaan tentang kebijakan cookie:

**Privacy Officer**  
Email: {{DPO_EMAIL}}  
Telepon: {{COMPANY_PHONE}}

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Website: {{COMPANY_WEBSITE}}

---

*Kebijakan Cookie ini terakhir diperbarui pada {{CURRENT_DATE}}*`;
  }

  getDataProcessingAgreementTemplate() {
    return `# Data Processing Agreement (DPA)
# Perjanjian Pemrosesan Data

**Effective Date / Tanggal Berlaku:** {{EFFECTIVE_DATE}}

## 1. Introduction / Pendahuluan

This Data Processing Agreement ("DPA") forms part of the Terms of Service between {{COMPANY_LEGAL_NAME}} ("Company", "Data Controller") and healthcare professionals ("Data Processor") using the {{COMPANY_NAME}} platform.

Perjanjian Pemrosesan Data ("DPA") ini merupakan bagian dari Syarat dan Ketentuan Layanan antara {{COMPANY_LEGAL_NAME}} ("Perusahaan", "Pengendali Data") dan tenaga kesehatan ("Prosesor Data") yang menggunakan platform {{COMPANY_NAME}}.

## 2. Definitions / Definisi

**Personal Data / Data Pribadi**: Any information relating to an identified or identifiable natural person / Informasi apa pun yang berkaitan dengan orang perseorangan yang teridentifikasi atau dapat diidentifikasi

**Processing / Pemrosesan**: Any operation performed on personal data / Operasi apa pun yang dilakukan pada data pribadi

**Data Subject / Subjek Data**: The person whose personal data is being processed / Orang yang data pribadinya sedang diproses

**Data Controller / Pengendali Data**: {{COMPANY_LEGAL_NAME}}

**Data Processor / Prosesor Data**: Healthcare professional using the platform / Tenaga kesehatan yang menggunakan platform

## 3. Scope of Processing / Ruang Lingkup Pemrosesan

### 3.1 Categories of Data Subjects / Kategori Subjek Data
- Patients using telemedicine services / Pasien yang menggunakan layanan telemedicine
- Healthcare professionals / Tenaga kesehatan profesional
- Platform users / Pengguna platform

### 3.2 Categories of Personal Data / Kategori Data Pribadi
- Identity data (name, ID number) / Data identitas (nama, nomor ID)
- Contact information / Informasi kontak
- Health data / Data kesehatan
- Medical records / Rekam medis
- Consultation history / Riwayat konsultasi
- Payment information / Informasi pembayaran

### 3.3 Purpose of Processing / Tujuan Pemrosesan
- Providing telemedicine services / Menyediakan layanan telemedicine
- Medical consultation and diagnosis / Konsultasi dan diagnosis medis
- Electronic medical records management / Manajemen rekam medis elektronik
- Treatment planning and follow-up / Perencanaan pengobatan dan tindak lanjut

## 4. Data Processor Obligations / Kewajiban Prosesor Data

### 4.1 Processing Instructions / Instruksi Pemrosesan
The Data Processor shall process personal data only on documented instructions from the Data Controller.
Prosesor Data hanya boleh memproses data pribadi berdasarkan instruksi terdokumentasi dari Pengendali Data.

### 4.2 Confidentiality / Kerahasiaan
- Ensure confidentiality of personal data / Memastikan kerahasiaan data pribadi
- Implement appropriate technical and organizational measures / Menerapkan langkah-langkah teknis dan organisasi yang sesuai
- Train staff on data protection / Melatih staf tentang perlindungan data

### 4.3 Security Measures / Langkah-langkah Keamanan
- Encryption of data in transit and at rest / Enkripsi data dalam transit dan saat istirahat
- Access controls and authentication / Kontrol akses dan autentikasi
- Regular security assessments / Penilaian keamanan berkala
- Incident response procedures / Prosedur respons insiden

### 4.4 Data Subject Rights / Hak Subjek Data
Assist the Data Controller in responding to data subject requests:
Membantu Pengendali Data dalam merespons permintaan subjek data:

- Right of access / Hak akses
- Right to rectification / Hak untuk pembetulan
- Right to erasure / Hak untuk penghapusan
- Right to data portability / Hak portabilitas data
- Right to object / Hak untuk keberatan

## 5. Data Transfers / Transfer Data

### 5.1 International Transfers / Transfer Internasional
Personal data may only be transferred outside Indonesia with appropriate safeguards:
Data pribadi hanya boleh ditransfer ke luar Indonesia dengan perlindungan yang sesuai:

- Adequacy decisions / Keputusan kecukupan
- Standard Contractual Clauses / Klausul Kontrak Standar
- Binding Corporate Rules / Aturan Korporat yang Mengikat
- Explicit consent / Persetujuan eksplisit

### 5.2 Sub-processors / Sub-prosesor
Any engagement of sub-processors requires:
Setiap keterlibatan sub-prosesor memerlukan:

- Prior written authorization / Otorisasi tertulis sebelumnya
- Appropriate contractual obligations / Kewajiban kontraktual yang sesuai
- Regular monitoring and auditing / Pemantauan dan audit berkala

## 6. Data Retention / Retensi Data

### 6.1 Retention Periods / Periode Retensi
- Medical records: {{DATA_RETENTION_PERIOD}} / Rekam medis: {{DATA_RETENTION_PERIOD}}
- Consultation data: 7 years / Data konsultasi: 7 tahun
- Payment records: 10 years / Catatan pembayaran: 10 tahun
- System logs: 1 year / Log sistem: 1 tahun

### 6.2 Secure Deletion / Penghapusan Aman
- Secure deletion procedures / Prosedur penghapusan aman
- Certificate of destruction / Sertifikat penghancuran
- Verification of deletion / Verifikasi penghapusan

## 7. Data Breach Notification / Notifikasi Pelanggaran Data

### 7.1 Notification Timeline / Timeline Notifikasi
- Immediate notification to Data Controller / Notifikasi segera ke Pengendali Data
- Within 24 hours of discovery / Dalam 24 jam setelah penemuan
- Detailed incident report within 72 hours / Laporan insiden rinci dalam 72 jam

### 7.2 Breach Response / Respons Pelanggaran
- Immediate containment measures / Langkah-langkah penahanan segera
- Impact assessment / Penilaian dampak
- Remediation actions / Tindakan remediasi
- Prevention measures / Langkah-langkah pencegahan

## 8. Audits and Compliance / Audit dan Kepatuhan

### 8.1 Regular Audits / Audit Berkala
- Annual compliance audits / Audit kepatuhan tahunan
- Technical security assessments / Penilaian keamanan teknis
- Process reviews / Tinjauan proses
- Documentation reviews / Tinjauan dokumentasi

### 8.2 Compliance Monitoring / Pemantauan Kepatuhan
- Continuous monitoring systems / Sistem pemantauan berkelanjutan
- Regular compliance reports / Laporan kepatuhan berkala
- Key performance indicators / Indikator kinerja utama
- Corrective action plans / Rencana tindakan korektif

## 9. Liability and Indemnification / Tanggung Jawab dan Ganti Rugi

### 9.1 Liability Allocation / Alokasi Tanggung Jawab
- Data Controller liable for lawful processing / Pengendali Data bertanggung jawab atas pemrosesan yang sah
- Data Processor liable for unauthorized processing / Prosesor Data bertanggung jawab atas pemrosesan yang tidak sah
- Joint liability for certain violations / Tanggung jawab bersama untuk pelanggaran tertentu

### 9.2 Indemnification / Ganti Rugi
- Mutual indemnification for breaches / Ganti rugi timbal balik untuk pelanggaran
- Third-party claims / Klaim pihak ketiga
- Regulatory fines and penalties / Denda dan sanksi regulasi

## 10. Term and Termination / Jangka Waktu dan Pengakhiran

### 10.1 Term / Jangka Waktu
This DPA remains in effect for the duration of the Terms of Service.
DPA ini berlaku selama durasi Syarat dan Ketentuan Layanan.

### 10.2 Termination Obligations / Kewajiban Pengakhiran
Upon termination:
Setelah pengakhiran:

- Return or delete all personal data / Mengembalikan atau menghapus semua data pribadi
- Provide certification of deletion / Memberikan sertifikasi penghapusan
- Maintain confidentiality obligations / Mempertahankan kewajiban kerahasiaan

## 11. Governing Law / Hukum yang Berlaku

This DPA is governed by Indonesian law and regulations:
DPA ini diatur oleh hukum dan peraturan Indonesia:

- {{INDONESIA_DATA_PROTECTION_LAW}}
- {{INDONESIA_TELEMEDICINE_REGULATION}}
- {{INDONESIA_MEDICAL_PRACTICE_LAW}}
- Applicable ministerial regulations / Peraturan menteri yang berlaku

## 12. Contact Information / Informasi Kontak

### Data Protection Officer / Petugas Perlindungan Data
**{{COMPANY_LEGAL_NAME}}**  
Email: {{DPO_EMAIL}}  
Phone / Telepon: {{COMPANY_PHONE}}  
Address / Alamat: {{COMPANY_ADDRESS}}

### Legal Department / Departemen Hukum
Email: {{LEGAL_EMAIL}}  
For legal inquiries and compliance matters / Untuk pertanyaan hukum dan masalah kepatuhan

---

**Signatures / Tanda Tangan**

**Data Controller / Pengendali Data:**  
{{COMPANY_LEGAL_NAME}}  

Name / Nama: _________________  
Title / Jabatan: _________________  
Date / Tanggal: {{CURRENT_DATE}}  
Signature / Tanda Tangan: _________________

**Data Processor / Prosesor Data:**  

Name / Nama: _________________  
Title / Jabatan: _________________  
License Number / Nomor Lisensi: _________________  
Date / Tanggal: _________________  
Signature / Tanda Tangan: _________________

---

*This DPA was last updated on {{CURRENT_DATE}} and forms an integral part of the {{COMPANY_NAME}} Terms of Service.*

*DPA ini terakhir diperbarui pada {{CURRENT_DATE}} dan merupakan bagian integral dari Syarat dan Ketentuan Layanan {{COMPANY_NAME}}.*`;
  }

  getHealthcareComplianceTemplate() {
    return `# Healthcare Compliance Framework
# Kerangka Kepatuhan Kesehatan {{COMPANY_NAME}}

**Effective Date / Tanggal Berlaku:** {{EFFECTIVE_DATE}}

## 1. Regulatory Framework / Kerangka Regulasi

### 1.1 Indonesian Healthcare Regulations / Regulasi Kesehatan Indonesia

#### Primary Laws / Hukum Utama
- {{INDONESIA_MEDICAL_PRACTICE_LAW}}
- {{INDONESIA_TELEMEDICINE_REGULATION}}
- UU No. 36 Tahun 2009 tentang Kesehatan
- UU No. 44 Tahun 2009 tentang Rumah Sakit

#### Ministerial Regulations / Peraturan Menteri
- Permenkes No. 20 Tahun 2019 tentang Penyelenggaraan Pelayanan Telemedicine
- Permenkes No. 24 Tahun 2022 tentang Rekam Medis
- Permenkes No. 4 Tahun 2018 tentang Kewajiban Rumah Sakit dan Kewajiban Pasien
- Permenkes No. 269 Tahun 2008 tentang Rekam Medis

#### Professional Council Regulations / Peraturan Konsil Profesi
- Peraturan Konsil Kedokteran Indonesia (KKI)
- Standar Kompetensi Dokter Indonesia (SKDI)
- Kode Etik Kedokteran Indonesia (KODEKI)
- Pedoman Praktik Kedokteran (PPK)

### 1.2 International Standards / Standar Internasional

#### Health Information Standards / Standar Informasi Kesehatan
- HL7 FHIR (Fast Healthcare Interoperability Resources)
- ICD-10 (International Classification of Diseases)
- SNOMED CT (Systematized Nomenclature of Medicine Clinical Terms)
- DICOM (Digital Imaging and Communications in Medicine)

#### Security and Privacy Standards / Standar Keamanan dan Privasi
- ISO 27001:2013 (Information Security Management)
- ISO 27799:2016 (Health Informatics Security Management)
- ISO 13606 (Health Informatics - Electronic Health Record Communication)
- HIPAA (Health Insurance Portability and Accountability Act) - for reference

## 2. Telemedicine Practice Standards / Standar Praktik Telemedicine

### 2.1 Definition and Scope / Definisi dan Ruang Lingkup

#### Telemedicine Services / Layanan Telemedicine
- **Teleconsultation / Telekonsultasi**: Remote consultation between healthcare provider and patient
- **Telediagnosis / Telediagnosis**: Remote diagnosis based on patient data and symptoms
- **Telemonitoring / Telemonitoring**: Remote monitoring of patient health parameters
- **Telerehabilitation / Telerehabilitasi**: Remote rehabilitation services

#### Service Categories / Kategori Layanan
- **Synchronous / Sinkron**: Real-time video/audio consultation
- **Asynchronous / Asinkron**: Store-and-forward consultation
- **Remote Monitoring / Pemantauan Jarak Jauh**: Continuous health parameter monitoring
- **Mobile Health / Kesehatan Mobile**: Health services via mobile applications

### 2.2 Healthcare Professional Requirements / Persyaratan Tenaga Kesehatan

#### Licensing Requirements / Persyaratan Lisensi
- Valid STR (Surat Tanda Registrasi) from Indonesian Medical Council
- Valid SIP (Surat Izin Praktik) from local health authority
- Telemedicine certification (if required by regulation)
- Continuing medical education (CME) compliance

#### Competency Requirements / Persyaratan Kompetensi
- Digital health literacy
- Telemedicine communication skills
- Remote diagnosis capabilities
- Technology proficiency
- Patient safety awareness

#### Verification Process / Proses Verifikasi
- STR verification through SatuSehat integration
- SIP verification with issuing authority
- Background check and credential verification
- Regular license renewal monitoring
- Competency assessment and training

### 2.3 Consultation Guidelines / Pedoman Konsultasi

#### Pre-Consultation / Pra-Konsultasi
- Patient identity verification
- Medical history review
- Informed consent for telemedicine
- Technology readiness check
- Emergency contact information

#### During Consultation / Selama Konsultasi
- Clear communication protocols
- Comprehensive patient assessment
- Appropriate use of diagnostic tools
- Documentation requirements
- Patient education and counseling

#### Post-Consultation / Pasca-Konsultasi
- Treatment plan documentation
- Prescription management
- Follow-up scheduling
- Referral coordination
- Patient satisfaction feedback

### 2.4 Practice Limitations / Batasan Praktik

#### Conditions Suitable for Telemedicine / Kondisi yang Sesuai untuk Telemedicine
- Routine follow-up consultations
- Chronic disease management
- Mental health counseling
- Medication management
- Health education and prevention

#### Conditions Requiring In-Person Care / Kondisi yang Memerlukan Perawatan Langsung
- Emergency medical conditions
- Complex diagnostic procedures
- Physical examinations requiring palpation
- Surgical procedures
- Acute psychiatric conditions

#### Referral Requirements / Persyaratan Rujukan
- Clear referral criteria
- Timely referral process
- Referral documentation
- Follow-up coordination
- Patient notification

## 3. Electronic Medical Record Standards / Standar Rekam Medis Elektronik

### 3.1 EMR Requirements / Persyaratan RME

#### Content Standards / Standar Konten
- Patient demographics and identification
- Medical history and chief complaints
- Physical examination findings
- Diagnostic test results
- Treatment plans and medications
- Progress notes and follow-up

#### Documentation Standards / Standar Dokumentasi
- Structured data entry
- Standardized medical terminology
- Time-stamped entries
- Digital signatures
- Audit trails

#### Interoperability / Interoperabilitas
- HL7 FHIR compliance
- Standard data formats
- API integration capabilities
- Cross-platform compatibility
- Data exchange protocols

### 3.2 Data Security / Keamanan Data

#### Encryption Standards / Standar Enkripsi
- Data at rest: AES-256 encryption
- Data in transit: TLS 1.3 encryption
- Database encryption: Column-level encryption
- Backup encryption: Full backup encryption
- Key management: Hardware Security Modules (HSM)

#### Access Control / Kontrol Akses
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management and timeout
- Privileged access management
- Regular access reviews

#### Audit and Monitoring / Audit dan Pemantauan
- Comprehensive audit logging
- Real-time monitoring
- Anomaly detection
- Regular security assessments
- Incident response procedures

### 3.3 Data Retention / Retensi Data

#### Retention Periods / Periode Retensi
- Adult medical records: {{DATA_RETENTION_PERIOD}}
- Pediatric records: Until age 25 or 7 years after last treatment
- Mental health records: 10 years
- Radiology images: 5 years
- Laboratory results: 5 years

#### Archival and Disposal / Pengarsipan dan Pembuangan
- Secure archival procedures
- Data migration protocols
- Secure disposal methods
- Certificate of destruction
- Legal hold procedures

## 4. Data Security and Privacy / Keamanan dan Privasi Data

### 4.1 Privacy Framework / Kerangka Privasi

#### Privacy Principles / Prinsip Privasi
- Lawfulness, fairness, and transparency
- Purpose limitation
- Data minimization
- Accuracy
- Storage limitation
- Integrity and confidentiality
- Accountability

#### Consent Management / Manajemen Persetujuan
- Informed consent procedures
- Granular consent options
- Consent withdrawal mechanisms
- Consent documentation
- Regular consent reviews

#### Patient Rights / Hak Pasien
- Right to access medical records
- Right to correct inaccurate information
- Right to data portability
- Right to restrict processing
- Right to object to processing

### 4.2 Security Controls / Kontrol Keamanan

#### Technical Safeguards / Perlindungan Teknis
- Network security controls
- Endpoint protection
- Application security
- Database security
- Cloud security

#### Administrative Safeguards / Perlindungan Administratif
- Security policies and procedures
- Staff training and awareness
- Access management
- Incident response
- Business continuity planning

#### Physical Safeguards / Perlindungan Fisik
- Data center security
- Equipment protection
- Media controls
- Workstation security
- Device management

## 5. Quality Assurance / Jaminan Kualitas

### 5.1 Clinical Quality Metrics / Metrik Kualitas Klinis

#### Patient Safety Indicators / Indikator Keselamatan Pasien
- Medication error rates
- Diagnostic accuracy
- Patient satisfaction scores
- Adverse event reporting
- Near-miss incidents

#### Clinical Effectiveness / Efektivitas Klinis
- Treatment outcome measures
- Patient adherence rates
- Follow-up compliance
- Referral appropriateness
- Clinical guideline adherence

#### Access and Timeliness / Akses dan Ketepatan Waktu
- Appointment availability
- Response time metrics
- Wait time measurements
- Service accessibility
- Geographic coverage

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone / Telepon: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This healthcare compliance framework ensures {{COMPANY_NAME}} adheres to Indonesian healthcare regulations and international standards.*

*Kerangka kepatuhan kesehatan ini memastikan {{COMPANY_NAME}} mematuhi peraturan kesehatan Indonesia dan standar internasional.*`;
  }

  getConsentFormsTemplate() {
    return `# Consent Forms / Formulir Persetujuan
# {{COMPANY_NAME}} Telemedicine Services

**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}

## 1. Telemedicine Consent / Persetujuan Telemedicine

### Patient Information / Informasi Pasien

**Full Name / Nama Lengkap**: ________________  
**Date of Birth / Tanggal Lahir**: ________________  
**ID Number / Nomor Identitas**: ________________  
**Phone / Telepon**: ________________  
**Email**: ________________

### Consent Statement / Pernyataan Persetujuan

I, the undersigned patient, hereby give my informed consent for telemedicine services provided by {{COMPANY_NAME}}.

Saya, pasien yang bertanda tangan di bawah ini, dengan ini memberikan persetujuan untuk layanan telemedicine yang disediakan oleh {{COMPANY_NAME}}.

#### Understanding of Telemedicine / Pemahaman tentang Telemedicine
☐ I understand that telemedicine involves the use of electronic communications to enable healthcare providers to diagnose, consult, treat, and educate patients using information from patient medical history, examination, and other diagnostic tests.

☐ Saya memahami bahwa telemedicine melibatkan penggunaan komunikasi elektronik untuk memungkinkan penyedia layanan kesehatan mendiagnosis, berkonsultasi, mengobati, dan mendidik pasien menggunakan informasi dari riwayat medis pasien, pemeriksaan, dan tes diagnostik lainnya.

#### Benefits and Risks / Manfaat dan Risiko
☐ I understand the potential benefits of telemedicine, including improved access to care, convenience, and cost-effectiveness.

☐ Saya memahami manfaat potensial telemedicine, termasuk peningkatan akses ke perawatan, kenyamanan, dan efektivitas biaya.

☐ I understand the potential risks, including technical difficulties, limitations in physical examination, and potential for misdiagnosis.

☐ Saya memahami risiko potensial, termasuk kesulitan teknis, keterbatasan dalam pemeriksaan fisik, dan potensi kesalahan diagnosis.

#### Privacy and Security / Privasi dan Keamanan
☐ I understand that my medical information will be transmitted electronically and that {{COMPANY_NAME}} will take reasonable steps to protect the privacy and security of this information.

☐ Saya memahami bahwa informasi medis saya akan ditransmisikan secara elektronik dan bahwa {{COMPANY_NAME}} akan mengambil langkah-langkah yang wajar untuk melindungi privasi dan keamanan informasi ini.

#### Alternative Options / Pilihan Alternatif
☐ I understand that I have the right to withhold or withdraw consent for telemedicine services at any time and that alternative in-person care is available.

☐ Saya memahami bahwa saya memiliki hak untuk menahan atau menarik persetujuan untuk layanan telemedicine kapan saja dan bahwa perawatan langsung alternatif tersedia.

**Patient Signature / Tanda Tangan Pasien**: ________________  
**Date / Tanggal**: ________________

**Guardian Signature (if applicable) / Tanda Tangan Wali (jika berlaku)**: ________________  
**Date / Tanggal**: ________________

## 2. Data Processing Consent / Persetujuan Pemrosesan Data

### Data Collection and Use / Pengumpulan dan Penggunaan Data

☐ I consent to the collection, processing, and use of my personal data for the following purposes:
- Providing telemedicine services
- Maintaining electronic medical records
- Processing payments
- Improving service quality
- Complying with legal requirements

☐ Saya menyetujui pengumpulan, pemrosesan, dan penggunaan data pribadi saya untuk tujuan berikut:
- Menyediakan layanan telemedicine
- Memelihara rekam medis elektronik
- Memproses pembayaran
- Meningkatkan kualitas layanan
- Mematuhi persyaratan hukum

### Data Sharing / Pembagian Data

☐ I consent to sharing my medical information with:
- Healthcare providers involved in my care
- Laboratory and diagnostic services
- Pharmacy services
- Insurance providers (if applicable)
- Emergency services (when necessary)

☐ Saya menyetujui pembagian informasi medis saya dengan:
- Penyedia layanan kesehatan yang terlibat dalam perawatan saya
- Layanan laboratorium dan diagnostik
- Layanan farmasi
- Penyedia asuransi (jika berlaku)
- Layanan darurat (bila diperlukan)

### Data Retention / Retensi Data

☐ I understand that my medical records will be retained for {{DATA_RETENTION_PERIOD}} as required by Indonesian law.

☐ Saya memahami bahwa rekam medis saya akan disimpan selama {{DATA_RETENTION_PERIOD}} sesuai yang disyaratkan oleh hukum Indonesia.

### Data Rights / Hak Data

☐ I understand my rights regarding my personal data, including the right to access, correct, delete, and port my data.

☐ Saya memahami hak-hak saya terkait data pribadi saya, termasuk hak untuk mengakses, mengoreksi, menghapus, dan memindahkan data saya.

**Patient Signature / Tanda Tangan Pasien**: ________________  
**Date / Tanggal**: ________________

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone / Telepon: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This consent form complies with Indonesian healthcare regulations and international best practices for telemedicine services.*

*Formulir persetujuan ini mematuhi peraturan kesehatan Indonesia dan praktik terbaik internasional untuk layanan telemedicine.*`