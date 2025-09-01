# NakesLink - Platform Tenaga Kesehatan Digital

## 🏥 Tentang NakesLink

NakesLink adalah platform digital yang menghubungkan masyarakat dengan tenaga kesehatan profesional terverifikasi untuk layanan kesehatan di rumah (home care), edukasi, dan konsultasi. Platform ini berfokus pada spektrum layanan kesehatan yang luas, dari preventif hingga rehabilitatif.

## 🎯 Visi

Memberdayakan tenaga kesehatan non-dokter dan meningkatkan akses masyarakat terhadap layanan kesehatan preventif, promotif, dan rehabilitatif yang terpercaya dan sesuai standar.

## 🚀 Fitur Utama

### Untuk Pasien/Keluarga
- 🔍 **Pencarian Nakes Terverifikasi** - Temukan tenaga kesehatan berdasarkan lokasi, layanan, dan rating
- 📅 **Penjadwalan Mudah** - Booking layanan dengan sistem kalender yang fleksibel
- 💬 **Chat Terenkripsi** - Komunikasi aman dengan tenaga kesehatan
- 📋 **Berkas Kesehatan Digital** - Riwayat layanan dan catatan medis terpusat
- 💳 **Pembayaran Digital** - Sistem pembayaran yang aman dan transparan
- ⭐ **Sistem Review** - Berikan ulasan dan rating untuk layanan yang diterima

### Untuk Tenaga Kesehatan (Nakes)
- ✅ **Verifikasi SatuSehat** - Integrasi dengan sistem SatuSehat untuk verifikasi kredensial
- 📊 **Dashboard Komprehensif** - Kelola jadwal, layanan, dan pendapatan
- 📝 **SOP Digital** - Checklist standar operasional untuk setiap layanan
- 💰 **Wallet Management** - Sistem wallet dan penarikan dana yang mudah
- 📈 **Analytics** - Laporan performa dan statistik layanan
- 🔗 **Link Management** - Kelola link dan referensi penting
- ✅ **Todo Management** - Sistem manajemen tugas yang terintegrasi

### Keamanan & Kepatuhan
- 🛡️ **Enkripsi End-to-End** - Semua komunikasi dan data medis terenkripsi
- 🆘 **Tombol SOS** - Akses cepat ke layanan darurat
- 📜 **Kepatuhan Regulasi** - Mematuhi regulasi kesehatan Indonesia
- 🔐 **Autentikasi Multi-Faktor** - Keamanan akun yang berlapis

## 🛠️ Teknologi Stack

### Backend
- **Node.js** dengan Express.js
- **PostgreSQL** untuk database utama
- **Sequelize** sebagai ORM
- **Socket.IO** untuk real-time communication
- **Firebase Admin** untuk autentikasi
- **Midtrans** untuk payment gateway
- **Cloudinary** untuk file storage

### Frontend
- **React 18** dengan hooks
- **Material-UI (MUI)** untuk komponen UI
- **React Router** untuk routing
- **Zustand** untuk state management
- **React Query** untuk data fetching
- **Socket.IO Client** untuk real-time features

### Integrasi
- **SatuSehat API** - Verifikasi data tenaga kesehatan
- **Midtrans/Xendit** - Payment processing
- **Twilio** - SMS notifications
- **Nodemailer** - Email services
- **Firebase** - Authentication & push notifications

## 📁 Struktur Project

```
Nakes-Link/
├── backend/                 # Backend API (Node.js)
│   ├── config/             # Konfigurasi database dan services
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models (Sequelize)
│   ├── routes/            # API routes
│   ├── services/          # External service integrations
│   ├── socket/            # Socket.IO handlers
│   ├── utils/             # Utility functions
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── frontend/               # Frontend React App
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main App component
│   └── package.json       # Frontend dependencies
├── docs/                   # Documentation
├── PRD.md                 # Product Requirements Document
├── Chat Prompt.md         # AI Assistant prompts
├── to do.md              # Development roadmap
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- PostgreSQL (v12 atau lebih tinggi)
- npm atau yarn

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/orang2bejo/Nakes-Link.git
   cd Nakes-Link
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env file dengan konfigurasi Anda
   npm run migrate
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Setup Database**
   ```bash
   # Buat database PostgreSQL
   createdb nakeslink_db
   
   # Jalankan migrasi
   cd backend
   npm run migrate
   ```

### Environment Variables

Copy `.env.example` ke `.env` dan isi dengan konfigurasi Anda:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nakeslink_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
# ... (lihat .env.example untuk lengkapnya)
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-documents` - Upload verification documents

### Services
- `GET /api/services` - Get all services
- `GET /api/services/search` - Search services
- `POST /api/services` - Create new service (Nakes only)
- `PUT /api/services/:id` - Update service

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment status

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/callback` - Payment callback
- `GET /api/payments/history` - Payment history

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Style
- Backend: ESLint + Prettier
- Frontend: ESLint + Prettier
- Commit messages: Conventional Commits

### Git Workflow
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📋 Status Pengembangan

### ✅ Completed Features
- **Frontend Dashboard Lengkap**
  - ✅ Dashboard Pasien (appointments, chat, medical records, payments, wallet)
  - ✅ Dashboard Nakes (appointments, patients, services, profile, wallet, link manager, todo manager)
  - ✅ Sistem Autentikasi (login/register untuk pasien dan nakes)
  - ✅ Chat System dengan UI real-time
  - ✅ Payment Integration (Midtrans, Xendit, Wallet Management)
  - ✅ Link Management System
  - ✅ Todo Management System

- **Backend API Structure**
  - ✅ Database models (User, Service, Appointment, Payment, Chat, dll)
  - ✅ API routes untuk semua fitur utama
  - ✅ Socket.IO untuk real-time communication
  - ✅ Middleware autentikasi dan error handling

### 🔄 In Progress (High Priority)
- **SatuSehat Integration** - Verifikasi NIK, STR, dan status keaktifan Nakes
- **Backend Testing** - Unit tests dan integration tests untuk semua API
- **Security Implementation** - Enkripsi data sensitif dan audit keamanan

### 📋 Upcoming Tasks

#### High Priority
- 🔐 **Security & Compliance**
  - Implementasi enkripsi end-to-end untuk chat dan data medis
  - Audit keamanan menggunakan OWASP ZAP
  - Finalisasi kebijakan privasi dan syarat layanan

- 🏥 **Core Integrations**
  - Integrasi SatuSehat API untuk verifikasi kredensial
  - Sistem notifikasi (email & SMS)
  - Dashboard admin untuk verifikasi dan monitoring

#### Medium Priority
- 🆘 **Emergency Features**
  - Implementasi tombol SOS dengan integrasi PSC 119
  - Protokol darurat dan notifikasi

- 🚀 **Deployment & Operations**
  - Setup production deployment
  - Monitoring dan backup system
  - Load testing dan performance optimization

#### Low Priority
- 👥 **User Experience**
  - User testing dengan 5-10 pasien & nakes
  - Feedback collection dan iterasi
  - Mobile responsiveness improvements

### 🎯 Roadmap

#### v1.0 (MVP - Target: 2-3 bulan)
- ✅ Core frontend features
- 🔄 SatuSehat integration
- 🔄 Security implementation
- 🔄 Admin dashboard
- 🔄 Emergency protocols
- 🔄 Production deployment

#### v1.1 (Enhancement - Target: +2 bulan)
- Nakes tiering system (Pratama/Madya/Utama)
- Video consultation integration
- Advanced analytics dan reporting
- Mobile app (React Native)

#### v2.0 (Scale - Target: +6 bulan)
- Insurance integration (BPJS)
- AI-powered recommendations
- Telemedicine features
- Multi-language support
- Advanced medical records integration

## 🤝 Contributing

Kami menyambut kontribusi dari komunitas! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

### Contributors
- [@orang2bejo](https://github.com/orang2bejo) - Project Lead

## 📄 License

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support

- 📧 Email: support@nakeslink.id
- 💬 Discord: [NakesLink Community](https://discord.gg/nakeslink)
- 📱 WhatsApp: +62-xxx-xxxx-xxxx

## 🙏 Acknowledgments

- Kementerian Kesehatan RI untuk SatuSehat API
- Komunitas tenaga kesehatan Indonesia
- Open source community

---

**NakesLink** - Menghubungkan Kesehatan, Memberdayakan Nakes 🏥💙