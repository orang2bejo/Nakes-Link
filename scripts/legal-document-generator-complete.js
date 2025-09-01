const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  templatesDir: path.join(__dirname, '..', 'legal', 'templates'),
  outputDir: path.join(__dirname, '..', 'legal', 'generated'),
  versioning: {
    major: 1,
    minor: 0,
    patch: 0,
    format: 'semantic' // semantic, date, custom
  },
  company: {
    name: 'Nakes Link',
    legalName: 'PT Nakes Link Indonesia',
    address: 'Jakarta, Indonesia',
    email: 'legal@nakeslink.com',
    phone: '+62-21-XXXXXXX',
    website: 'https://nakeslink.com'
  },
  documentTypes: {
    privacyPolicy: {
      name: 'Privacy Policy',
      output: 'privacy-policy.md',
      approvalRequired: true,
      reviewCycle: 365 // days
    },
    termsOfService: {
      name: 'Terms of Service',
      output: 'terms-of-service.md',
      approvalRequired: true,
      reviewCycle: 365
    },
    cookiePolicy: {
      name: 'Cookie Policy',
      output: 'cookie-policy.md',
      approvalRequired: false,
      reviewCycle: 180
    },
    dataProcessingAgreement: {
      name: 'Data Processing Agreement',
      output: 'data-processing-agreement.md',
      approvalRequired: true,
      reviewCycle: 365
    },
    healthcareCompliance: {
      name: 'Healthcare Compliance',
      output: 'healthcare-compliance.md',
      approvalRequired: true,
      reviewCycle: 180
    },
    consentForms: {
      name: 'Consent Forms',
      output: 'consent-forms.md',
      approvalRequired: true,
      reviewCycle: 365
    }
  }
};

// Template variables
const templateVariables = {
  COMPANY_NAME: config.company.name,
  COMPANY_LEGAL_NAME: config.company.legalName,
  COMPANY_ADDRESS: config.company.address,
  COMPANY_EMAIL: config.company.email,
  COMPANY_PHONE: config.company.phone,
  COMPANY_WEBSITE: config.company.website,
  EFFECTIVE_DATE: new Date().toLocaleDateString('id-ID'),
  LAST_UPDATED: new Date().toLocaleDateString('id-ID'),
  DATA_RETENTION_PERIOD: '10 years / 10 tahun',
  SUPPORT_EMAIL: 'support@nakeslink.com',
  PRIVACY_EMAIL: 'privacy@nakeslink.com',
  LEGAL_EMAIL: 'legal@nakeslink.com',
  CURRENT_YEAR: new Date().getFullYear().toString()
};

// Main Legal Document Generator Class
class LegalDocumentGenerator {
  constructor() {
    this.templates = new Map();
    this.documentHistory = [];
  }

  async initialize() {
    console.log('🚀 Initializing Legal Document Generator...');
    
    // Create necessary directories
    await this.createDirectories();
    
    // Load templates
    await this.loadTemplates();
    
    // Initialize version control
    await this.initializeVersionControl();
    
    console.log('✅ Legal Document Generator initialized successfully');
  }

  async createDirectories() {
    const directories = [
      config.templatesDir,
      config.outputDir,
      path.join(config.outputDir, 'drafts'),
      path.join(config.outputDir, 'approved'),
      path.join(config.outputDir, 'translations'),
      path.join(config.outputDir, 'archive')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    console.log('📁 Directories created successfully');
  }

  async loadTemplates() {
    console.log('📄 Loading document templates...');
    
    // Create default templates if they don't exist
    await this.createDefaultTemplates();
    
    // Load templates into memory
    for (const [documentType, config] of Object.entries(config.documentTypes)) {
      const templateMethod = `get${documentType.charAt(0).toUpperCase() + documentType.slice(1)}Template`;
      
      if (typeof this[templateMethod] === 'function') {
        const content = this[templateMethod]();
        this.templates.set(documentType, {
          content,
          config,
          lastModified: new Date()
        });
      }
    }
    
    console.log(`✅ Loaded ${this.templates.size} templates`);
  }

  async createDefaultTemplates() {
    // This method creates default template files if they don't exist
    // Templates are defined as methods in this class
    console.log('📝 Creating default templates...');
  }

  // Template Methods
  getPrivacyPolicyTemplate() {
    return `# Privacy Policy / Kebijakan Privasi
# {{COMPANY_NAME}}

**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}  
**Last Updated / Terakhir Diperbarui**: {{LAST_UPDATED}}

## 1. Introduction / Pengantar

Welcome to {{COMPANY_NAME}}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our telemedicine platform.

Selamat datang di {{COMPANY_NAME}}. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi Anda saat menggunakan platform telemedicine kami.

## 2. Information We Collect / Informasi yang Kami Kumpulkan

### 2.1 Personal Information / Informasi Pribadi
- Full name / Nama lengkap
- Date of birth / Tanggal lahir
- Identity number (NIK) / Nomor identitas
- Contact information / Informasi kontak
- Medical history / Riwayat medis

### 2.2 Technical Information / Informasi Teknis
- Device information / Informasi perangkat
- IP address / Alamat IP
- Usage data / Data penggunaan
- Location data / Data lokasi

## 3. How We Use Your Information / Cara Kami Menggunakan Informasi Anda

- Providing telemedicine services / Menyediakan layanan telemedicine
- Processing payments / Memproses pembayaran
- Improving our services / Meningkatkan layanan kami
- Complying with legal obligations / Mematuhi kewajiban hukum

## 4. Information Sharing / Pembagian Informasi

We may share your information with:
- Healthcare providers / Penyedia layanan kesehatan
- Payment processors / Pemroses pembayaran
- Legal authorities when required / Otoritas hukum bila diperlukan

## 5. Data Security / Keamanan Data

We implement appropriate security measures including:
- Encryption / Enkripsi
- Access controls / Kontrol akses
- Regular security audits / Audit keamanan berkala

## 6. Your Rights / Hak Anda

You have the right to:
- Access your data / Mengakses data Anda
- Correct inaccurate data / Mengoreksi data yang tidak akurat
- Delete your data / Menghapus data Anda
- Data portability / Portabilitas data

## 7. Contact Us / Hubungi Kami

For privacy-related questions, contact us at:
- Email: {{PRIVACY_EMAIL}}
- Address: {{COMPANY_ADDRESS}}

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This privacy policy complies with Indonesian data protection laws and international standards.*

*Kebijakan privasi ini mematuhi undang-undang perlindungan data Indonesia dan standar internasional.*`;
  }

  getTermsOfServiceTemplate() {
    return `# Terms of Service / Syarat Layanan
# {{COMPANY_NAME}}

**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}  
**Last Updated / Terakhir Diperbarui**: {{LAST_UPDATED}}

## 1. Acceptance of Terms / Penerimaan Syarat

By using {{COMPANY_NAME}} services, you agree to these Terms of Service.

Dengan menggunakan layanan {{COMPANY_NAME}}, Anda menyetujui Syarat Layanan ini.

## 2. Description of Service / Deskripsi Layanan

{{COMPANY_NAME}} provides telemedicine services connecting patients with licensed healthcare professionals.

{{COMPANY_NAME}} menyediakan layanan telemedicine yang menghubungkan pasien dengan tenaga kesehatan berlisensi.

## 3. User Responsibilities / Tanggung Jawab Pengguna

### 3.1 Patient Responsibilities / Tanggung Jawab Pasien
- Provide accurate medical information / Memberikan informasi medis yang akurat
- Follow medical advice / Mengikuti saran medis
- Pay for services as agreed / Membayar layanan sesuai kesepakatan

### 3.2 Healthcare Professional Responsibilities / Tanggung Jawab Tenaga Kesehatan
- Maintain valid licenses / Mempertahankan lisensi yang valid
- Provide quality care / Memberikan perawatan berkualitas
- Follow professional standards / Mengikuti standar profesional

## 4. Payment Terms / Syarat Pembayaran

- Payment is required before service delivery / Pembayaran diperlukan sebelum penyampaian layanan
- Refunds are subject to our refund policy / Pengembalian dana tunduk pada kebijakan pengembalian kami
- All fees are in Indonesian Rupiah / Semua biaya dalam Rupiah Indonesia

## 5. Limitation of Liability / Pembatasan Tanggung Jawab

{{COMPANY_NAME}} is not liable for:
- Medical malpractice by healthcare providers / Malpraktik medis oleh penyedia layanan kesehatan
- Technical failures beyond our control / Kegagalan teknis di luar kendali kami
- Emergency situations requiring immediate care / Situasi darurat yang memerlukan perawatan segera

## 6. Termination / Penghentian

We may terminate your account for:
- Violation of these terms / Pelanggaran syarat ini
- Fraudulent activity / Aktivitas penipuan
- Non-payment / Tidak membayar

## 7. Governing Law / Hukum yang Berlaku

These terms are governed by Indonesian law.

Syarat ini diatur oleh hukum Indonesia.

## 8. Contact Information / Informasi Kontak

For questions about these terms:
- Email: {{LEGAL_EMAIL}}
- Address: {{COMPANY_ADDRESS}}

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*These terms comply with Indonesian consumer protection and healthcare laws.*

*Syarat ini mematuhi undang-undang perlindungan konsumen dan kesehatan Indonesia.*`;
  }

  getCookiePolicyTemplate() {
    return `# Cookie Policy / Kebijakan Cookie
# {{COMPANY_NAME}}

**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}  
**Last Updated / Terakhir Diperbarui**: {{LAST_UPDATED}}

## 1. What Are Cookies / Apa itu Cookie

Cookies are small text files stored on your device when you visit our website.

Cookie adalah file teks kecil yang disimpan di perangkat Anda saat mengunjungi situs web kami.

## 2. Types of Cookies We Use / Jenis Cookie yang Kami Gunakan

### 2.1 Essential Cookies / Cookie Penting
- Authentication / Autentikasi
- Security / Keamanan
- Session management / Manajemen sesi

### 2.2 Analytics Cookies / Cookie Analitik
- Usage statistics / Statistik penggunaan
- Performance monitoring / Pemantauan kinerja
- User behavior analysis / Analisis perilaku pengguna

### 2.3 Functional Cookies / Cookie Fungsional
- Language preferences / Preferensi bahasa
- User settings / Pengaturan pengguna
- Accessibility features / Fitur aksesibilitas

## 3. Managing Cookies / Mengelola Cookie

You can control cookies through:
- Browser settings / Pengaturan browser
- Our cookie preference center / Pusat preferensi cookie kami
- Third-party opt-out tools / Alat opt-out pihak ketiga

## 4. Third-Party Cookies / Cookie Pihak Ketiga

We may use third-party services that set cookies:
- Google Analytics
- Payment processors / Pemroses pembayaran
- Social media platforms / Platform media sosial

## 5. Contact Us / Hubungi Kami

For cookie-related questions:
- Email: {{PRIVACY_EMAIL}}
- Address: {{COMPANY_ADDRESS}}

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This cookie policy complies with Indonesian and international privacy regulations.*

*Kebijakan cookie ini mematuhi peraturan privasi Indonesia dan internasional.*`;
  }

  getDataProcessingAgreementTemplate() {
    return `# Data Processing Agreement / Perjanjian Pemrosesan Data
# {{COMPANY_NAME}}

**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}  
**Last Updated / Terakhir Diperbarui**: {{LAST_UPDATED}}

## 1. Parties / Para Pihak

**Data Controller / Pengontrol Data**: {{COMPANY_LEGAL_NAME}}  
**Data Processor / Pemroses Data**: [To be specified / Akan ditentukan]

## 2. Purpose and Scope / Tujuan dan Ruang Lingkup

This agreement governs the processing of personal data in connection with telemedicine services.

Perjanjian ini mengatur pemrosesan data pribadi sehubungan dengan layanan telemedicine.

## 3. Categories of Data / Kategori Data

### 3.1 Personal Data / Data Pribadi
- Identity information / Informasi identitas
- Contact details / Detail kontak
- Demographic information / Informasi demografis

### 3.2 Health Data / Data Kesehatan
- Medical history / Riwayat medis
- Consultation records / Catatan konsultasi
- Prescription information / Informasi resep

### 3.3 Technical Data / Data Teknis
- Device information / Informasi perangkat
- Usage logs / Log penggunaan
- Performance metrics / Metrik kinerja

## 4. Processing Activities / Aktivitas Pemrosesan

- Collection / Pengumpulan
- Storage / Penyimpanan
- Analysis / Analisis
- Transmission / Transmisi
- Deletion / Penghapusan

## 5. Security Measures / Langkah Keamanan

### 5.1 Technical Measures / Langkah Teknis
- Encryption at rest and in transit / Enkripsi saat istirahat dan transit
- Access controls / Kontrol akses
- Regular security updates / Pembaruan keamanan berkala

### 5.2 Organizational Measures / Langkah Organisasi
- Staff training / Pelatihan staf
- Data protection policies / Kebijakan perlindungan data
- Incident response procedures / Prosedur respons insiden

## 6. Data Subject Rights / Hak Subjek Data

- Right to access / Hak akses
- Right to rectification / Hak pembetulan
- Right to erasure / Hak penghapusan
- Right to data portability / Hak portabilitas data

## 7. Data Retention / Retensi Data

Personal data will be retained for {{DATA_RETENTION_PERIOD}} or as required by law.

Data pribadi akan disimpan selama {{DATA_RETENTION_PERIOD}} atau sesuai yang disyaratkan oleh hukum.

## 8. International Transfers / Transfer Internasional

Any international data transfers will be protected by appropriate safeguards.

Setiap transfer data internasional akan dilindungi oleh perlindungan yang sesuai.

## 9. Breach Notification / Notifikasi Pelanggaran

Data breaches will be reported within 72 hours of discovery.

Pelanggaran data akan dilaporkan dalam 72 jam setelah ditemukan.

## 10. Audit Rights / Hak Audit

The data controller has the right to audit processing activities.

Pengontrol data memiliki hak untuk mengaudit aktivitas pemrosesan.

---

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This agreement complies with Indonesian data protection laws and international standards.*

*Perjanjian ini mematuhi undang-undang perlindungan data Indonesia dan standar internasional.*`;
  }

  getHealthcareComplianceTemplate() {
    return `# Healthcare Compliance Framework / Kerangka Kepatuhan Kesehatan
# {{COMPANY_NAME}} - Indonesian Healthcare Regulations

**Document Type / Jenis Dokumen**: Healthcare Compliance Framework  
**Effective Date / Tanggal Berlaku**: {{EFFECTIVE_DATE}}  
**Last Updated / Terakhir Diperbarui**: {{LAST_UPDATED}}  
**Next Review / Tinjauan Berikutnya**: [To be calculated]
- **Version / Versi**: 1.0

**{{COMPANY_LEGAL_NAME}}**  
{{COMPANY_ADDRESS}}  
Email: {{COMPANY_EMAIL}}  
Phone / Telepon: {{COMPANY_PHONE}}  
Website: {{COMPANY_WEBSITE}}

*This document establishes the healthcare compliance framework for {{COMPANY_NAME}} and ensures adherence to Indonesian healthcare regulations and international standards.*

*Dokumen ini menetapkan kerangka kepatuhan kesehatan untuk {{COMPANY_NAME}} dan memastikan kepatuhan terhadap peraturan kesehatan Indonesia dan standar internasional.*

## 1. Regulatory Framework / Kerangka Regulasi

### 1.1 Indonesian Healthcare Laws / Undang-undang Kesehatan Indonesia
- UU No. 36/2009 tentang Kesehatan
- UU No. 29/2004 tentang Praktik Kedokteran
- Permenkes No. 20/2019 tentang Penyelenggaraan Pelayanan Telemedicine

### 1.2 Data Protection Laws / Undang-undang Perlindungan Data
- UU No. 27/2022 tentang Pelindungan Data Pribadi
- PP No. 71/2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik

## 2. Healthcare Professional Requirements / Persyaratan Tenaga Kesehatan

### 2.1 License Verification / Verifikasi Lisensi
- STR (Surat Tanda Registrasi) validation
- SIP (Surat Izin Praktik) verification
- Continuing education requirements

### 2.2 Professional Standards / Standar Profesional
- Medical ethics compliance
- Professional conduct guidelines
- Quality assurance protocols

## 3. Telemedicine Standards / Standar Telemedicine

### 3.1 Service Delivery / Penyampaian Layanan
- Patient identification protocols
- Consultation documentation
- Prescription management
- Emergency procedures

### 3.2 Technology Requirements / Persyaratan Teknologi
- Platform security standards
- Data encryption protocols
- System availability requirements
- Backup and recovery procedures

## 4. Patient Safety / Keselamatan Pasien

### 4.1 Risk Management / Manajemen Risiko
- Clinical risk assessment
- Adverse event reporting
- Quality improvement processes
- Patient feedback systems

### 4.2 Emergency Protocols / Protokol Darurat
- Emergency service integration
- Crisis intervention procedures
- Referral pathways
- Follow-up care coordination

## 5. Data Security and Privacy / Keamanan dan Privasi Data

### 5.1 Medical Record Management / Manajemen Rekam Medis
- Electronic health record standards
- Data retention policies
- Access control measures
- Audit trail requirements

### 5.2 Privacy Protection / Perlindungan Privasi
- Patient consent management
- Data sharing protocols
- Third-party access controls
- Breach notification procedures

## 6. Quality Assurance / Jaminan Kualitas

### 6.1 Clinical Governance / Tata Kelola Klinis
- Clinical oversight committees
- Performance monitoring
- Outcome measurement
- Continuous improvement

### 6.2 Training and Education / Pelatihan dan Edukasi
- Staff training programs
- Competency assessments
- Continuing education
- Professional development

## 7. Compliance Monitoring / Pemantauan Kepatuhan

### 7.1 Internal Audits / Audit Internal
- Regular compliance reviews
- Risk assessments
- Corrective action plans
- Performance metrics

### 7.2 External Oversight / Pengawasan Eksternal
- Regulatory reporting
- External audits
- Accreditation requirements
- Stakeholder engagement

## 8. Incident Management / Manajemen Insiden

### 8.1 Incident Reporting / Pelaporan Insiden
- Incident classification
- Reporting procedures
- Investigation protocols
- Corrective actions

### 8.2 Crisis Management / Manajemen Krisis
- Crisis response team
- Communication protocols
- Business continuity plans
- Recovery procedures

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

*Formulir persetujuan ini mematuhi peraturan kesehatan Indonesia dan praktik terbaik internasional untuk layanan telemedicine.*`;
  }

  async initializeVersionControl() {
    console.log('🔄 Initializing version control...');
    
    const versionControl = {
      currentVersion: `${config.versioning.major}.${config.versioning.minor}.${config.versioning.patch}`,
      versionHistory: [],
      lastUpdate: new Date().toISOString(),
      updateBy: 'System',
      changeLog: []
    };
    
    const versionPath = path.join(config.outputDir, 'version-control.json');
    await fs.writeFile(versionPath, JSON.stringify(versionControl, null, 2));
    
    console.log('✅ Version control initialized');
  }

  async generateDocument(documentType, customVariables = {}) {
    console.log(`📝 Generating document: ${documentType}`);
    
    const template = this.templates.get(documentType);
    if (!template) {
      throw new Error(`Template not found for document type: ${documentType}`);
    }
    
    const variables = { ...templateVariables, ...customVariables };
    
    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
    
    const metadata = {
      documentType,
      version: this.getNextVersion(),
      generatedAt: new Date().toISOString(),
      templateVersion: template.lastModified.toISOString(),
      variables: variables,
      hash: this.generateDocumentHash(content),
      status: 'draft',
      approvalRequired: template.config.approvalRequired,
      reviewCycle: template.config.reviewCycle,
      nextReview: this.calculateNextReview(template.config.reviewCycle)
    };
    
    const outputPath = path.join(config.outputDir, 'drafts', template.config.output);
    await fs.writeFile(outputPath, content);
    
    const metadataPath = path.join(config.outputDir, 'drafts', `${documentType}-metadata.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    this.documentHistory.push({
      documentType,
      action: 'generated',
      timestamp: new Date().toISOString(),
      version: metadata.version,
      path: outputPath
    });
    
    console.log(`✅ Document generated: ${outputPath}`);
    return { content, metadata, path: outputPath };
  }

  generateDocumentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getNextVersion() {
    const { major, minor, patch } = config.versioning;
    return `${major}.${minor}.${patch + 1}`;
  }

  calculateNextReview(reviewCycleDays) {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + reviewCycleDays);
    return nextReview.toISOString();
  }

  async generateAllDocuments(customVariables = {}) {
    console.log('📚 Generating all legal documents...');
    
    const results = [];
    
    for (const documentType of Object.keys(config.documentTypes)) {
      try {
        const result = await this.generateDocument(documentType, customVariables);
        results.push({ documentType, success: true, ...result });
      } catch (error) {
        console.error(`❌ Failed to generate ${documentType}:`, error.message);
        results.push({ documentType, success: false, error: error.message });
      }
    }
    
    await this.generateSummaryReport(results);
    
    console.log('✅ All documents generation completed');
    return results;
  }

  async generateSummaryReport(results) {
    console.log('📊 Generating summary report...');
    
    const report = {
      generatedAt: new Date().toISOString(),
      totalDocuments: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      documents: results,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    
    const reportPath = path.join(config.outputDir, 'generation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Summary report generated: ${reportPath}`);
    return report;
  }
}

// CLI Interface
class LegalDocumentCLI {
  constructor() {
    this.generator = new LegalDocumentGenerator();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
      await this.generator.initialize();
      
      switch (command) {
        case 'generate':
          await this.handleGenerate(args.slice(1));
          break;
        case 'list':
          await this.handleList();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async handleGenerate(args) {
    const documentType = args[0];
    
    if (documentType && documentType !== 'all') {
      if (!config.documentTypes[documentType]) {
        throw new Error(`Unknown document type: ${documentType}`);
      }
      
      const result = await this.generator.generateDocument(documentType);
      console.log(`✅ Generated: ${result.path}`);
    } else {
      const results = await this.generator.generateAllDocuments();
      console.log(`\n📊 Generation Summary:`);
      console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
      console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
    }
  }

  async handleList() {
    console.log('\n📚 Available Document Types:');
    console.log('=' .repeat(50));
    
    for (const [type, config] of Object.entries(config.documentTypes)) {
      console.log(`📄 ${type.padEnd(25)} ${config.name}`);
    }
  }

  showHelp() {
    console.log(`\n📄 Legal Document Generator CLI\n\nUsage: node legal-document-generator-complete.js <command> [options]\n\nCommands:\n  generate [type|all]     Generate legal document(s)\n  list                    List available document types\n  help                    Show this help\n\nDocument Types:\n${Object.keys(config.documentTypes).map(type => `  - ${type}`).join('\n')}\n\nExamples:\n  node legal-document-generator-complete.js generate all\n  node legal-document-generator-complete.js generate privacyPolicy\n  node legal-document-generator-complete.js list\n`);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new LegalDocumentCLI();
  cli.run().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  LegalDocumentGenerator,
  LegalDocumentCLI,
  config,
  templateVariables
};