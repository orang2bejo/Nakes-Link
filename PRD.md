### **Product Requirements Document (PRD): NakesLink**

| **Nama Produk:** | NakesLink |
| :--- | :--- |
| **Versi:** | 1.0 |
| **Status:** | Draft |
| **Visi:** | Memberdayakan tenaga kesehatan non-dokter dan meningkatkan akses masyarakat terhadap layanan kesehatan preventif, promotif, dan rehabilitatif yang terpercaya dan sesuai standar. |

### **1. Pendahuluan & Visi Produk**

**1.1. Masalah yang Diselesaikan**
*   **Untuk Nakes:** Banyak tenaga kesehatan di luar dokter (Perawat, Bidan, Ahli Gizi, Kesling, Promkes, Fisioterapis) memiliki keahlian dan izin praktik namun kesulitan memasarkan layanannya secara mandiri di luar jam kerja institusional mereka, sehingga potensi pendapatan tambahan tidak maksimal.
*   **Untuk Masyarakat:** Masyarakat sulit menemukan dan mengakses layanan kesehatan pendukung yang spesifik dan terstandar (misal: perawatan luka di rumah, konsultasi gizi, fisioterapi pasca-stroke, pendampingan laktasi) dengan cepat dan terpercaya. Akses seringkali terbatas pada informasi dari mulut ke mulut atau rujukan yang memakan waktu.

**1.2. Visi Produk**
Menjadi platform digital terdepan di Indonesia yang menghubungkan masyarakat dengan tenaga kesehatan profesional terverifikasi untuk layanan kesehatan di rumah (*home care*), edukasi, dan konsultasi, dengan penekanan kuat pada keamanan, kepatuhan standar, dan integrasi ekosistem kesehatan nasional.

**1.3. Pernyataan Posisi**
Untuk **masyarakat dan keluarga** yang membutuhkan layanan kesehatan pendukung, **NakesLink** adalah aplikasi *on-demand* yang menyediakan akses ke **tenaga kesehatan (Nakes) yang identitas dan kompetensinya terintegrasi dengan SatuSehat**, menawarkan layanan sesuai SOP dengan tarif yang transparan. Berbeda dengan platform konsultasi dokter umum, NakesLink berfokus pada spektrum layanan kesehatan yang lebih luas, dari preventif hingga rehabilitatif, yang dapat dilakukan di lingkungan pasien.

### **2. Persona Pengguna**

**2.1. Pasien/Keluarga Pasien (Pengguna Jasa)**
*   **Nama:** Ibu Rina
*   **Demografi:** 40 tahun, merawat ayahnya yang baru pulang dari rumah sakit pasca-stroke.
*   **Kebutuhan:** Membutuhkan Fisioterapis untuk datang ke rumah 3x seminggu untuk melatih gerak ayahnya. Ia juga butuh edukasi dari Perawat tentang cara merawat luka baring (dekubitus) dengan benar.
*   **Frustrasi:** Bingung mencari fisioterapis privat. Rujukan dari rumah sakit memiliki daftar tunggu yang panjang.

**2.2. Nakes (Penyedia Jasa)**
*   **Nama:** Santi, A.Md.Gz
*   **Demografi:** 28 tahun, Ahli Gizi di Puskesmas.
*   **Kebutuhan:** Ingin memanfaatkan waktu luangnya di sore hari atau akhir pekan untuk memberikan konsultasi gizi privat untuk menambah penghasilan. Ia ingin platform yang membantunya mendapatkan klien, mengelola jadwal, dan memastikan pembayarannya aman.
*   **Frustrasi:** Tidak tahu cara memasarkan jasanya. Khawatir tentang aspek legalitas dan keamanan jika berpraktik mandiri tanpa naungan yang jelas.

### **3. Fitur & Fungsionalitas (Epics & User Stories)**

**Epic 1: Onboarding & Verifikasi Nakes Berbasis Kepercayaan**

*   **User Story 1.1 (Nakes):** Sebagai seorang Nakes, saya ingin bisa mendaftar menggunakan NIK saya, yang kemudian akan **terintegrasi dengan API SatuSehat** untuk secara otomatis menarik data dasar, nomor STR, dan status keaktifan saya.
*   **User Story 1.2 (Nakes):** Sebagai seorang Nakes, saya harus mengunggah dokumen wajib seperti STR, SIP yang masih berlaku, dan sertifikat kompetensi lainnya.
*   **User Story 1.3 (Nakes):** Sebagai seorang Nakes, saya ingin bisa mendefinisikan **layanan yang saya tawarkan** (misal: "Konsultasi Gizi Awal", "Kunjungan Laktasi", "Fisioterapi Muskuloskeletal") dan **menetapkan tarif standar** untuk setiap layanan tersebut.
*   **User Story 1.4 (Sistem):** Sebagai sistem, profil Nakes baru hanya akan aktif dan bisa menerima pesanan setelah tim verifikator NakesLink **memvalidasi kesesuaian dokumen** yang diunggah dengan data dari SatuSehat. Ini adalah langkah keamanan krusial untuk mencegah malpraktik.

**Epic 2: Alur Permintaan & Penjadwalan Layanan**

*   **User Story 2.1 (Pasien):** Sebagai Ibu Rina, saya ingin bisa mencari layanan "Fisioterapi" di aplikasi, melihat daftar Fisioterapis yang tersedia, beserta profil, rating, dan tarif layanan mereka.
*   **User Story 2.2 (Pasien):** Setelah memilih Nakes, sebagai Ibu Rina, saya ingin bisa **memilih jadwal kunjungan** dari slot waktu yang disediakan oleh Nakes tersebut dan melakukan pemesanan.
*   **User Story 2.3 (Nakes):** Sebagai Santi, saya ingin bisa mengatur jadwal ketersediaan saya di dalam aplikasi (misal: Senin-Jumat pukul 17.00-20.00, Sabtu pukul 09.00-15.00) agar pasien hanya bisa memesan di waktu luang saya.
*   **User Story 2.4 (Sistem):** Setelah pemesanan dibuat dan dibayar oleh pasien, sistem harus mengirimkan konfirmasi ke kedua belah pihak dan memasukkan jadwal tersebut ke dalam kalender aplikasi masing-masing.

**Epic 3: Pelaksanaan Layanan & Kepatuhan SOP**

*   **User Story 3.1 (Nakes):** Sebelum memulai setiap layanan, sebagai seorang Nakes, saya harus diperlihatkan **checklist SOP digital** yang relevan dengan layanan yang akan saya berikan (misal: SOP Perawatan Luka). Saya harus mencentang setiap langkah sebagai bagian dari rekam medis digital.
*   **User Story 3.2 (Nakes):** Setelah layanan selesai, sebagai seorang Nakes, saya harus mengisi **catatan perkembangan pasien sederhana** di dalam aplikasi, yang akan menjadi bagian dari riwayat kesehatan pasien di platform.
*   **User Story 3.3 (Nakes & Pasien):** Saya ingin bisa mengubah status kunjungan menjadi 'completed' yang kemudian akan divalidasi oleh pasien (misalnya dengan PIN atau tanda tangan digital sederhana) untuk mengkonfirmasi bahwa layanan telah diterima.

**Epic 4: Penanganan Gawat Darurat & Keamanan**

*   **User Story 4.1 (Nakes & Pasien):** Di dalam halaman detail pesanan dan chat, harus ada **tombol "SOS/Gawat Darurat"** yang terlihat jelas.
*   **User Story 4.2 (Sistem):** Ketika tombol SOS ditekan, sistem harus secara otomatis mencoba terhubung dengan **layanan emergency resmi** (misalnya, PSC 119) dengan mengirimkan data lokasi terkini pasien dan Nakes. (Integrasi ini adalah target jangka panjang, v1.0 bisa berupa menampilkan nomor telepon penting dan notifikasi ke admin).

**Epic 5: Sistem Keuangan & Monetisasi**

*   **User Story 5.1 (Sistem):** Biaya layanan yang ditampilkan ke pasien adalah **tarif yang ditetapkan Nakes + biaya platform sebesar 7%**.
*   **User Story 5.2 (Pasien):** Saya ingin bisa membayar layanan di muka menggunakan berbagai metode pembayaran digital. Jika saya ingin memberi lebih (tip), harus ada opsi untuk menambahkannya setelah layanan selesai.
*   **User Story 5.3 (Sistem):** Setelah layanan dikonfirmasi selesai, sistem harus secara otomatis memasukkan pendapatan Nakes (Tarif - 7% Fee) ke dalam wallet Nakes di aplikasi.
*   **User Story 5.4 (Nakes):** Alur untuk melihat saldo wallet dan mengajukan penarikan dana ke rekening bank harus sama dengan yang ada di MitraPro.

**Epic 6: Komunikasi & Reputasi**

*   **User Story 6.1 (Pasien & Nakes):** Saya memerlukan fitur **chat yang aman dan terenkripsi** untuk berkomunikasi terkait persiapan kunjungan atau pertanyaan lanjutan pasca-layanan.
*   **User Story 6.2 (Pasien):** Setelah layanan selesai, saya ingin bisa memberikan **ulasan dan rating** yang spesifik terkait kompetensi, komunikasi, dan profesionalisme Nakes.

### **4. Metrik Keberhasilan (Success Metrics)**

*   **Kepercayaan & Keamanan:**
    *   Jumlah Nakes yang berhasil terverifikasi via SatuSehat.
    *   Tingkat kepatuhan pengisian SOP digital (persentase checklist yang dilengkapi).
    *   Jumlah laporan insiden atau keluhan malpraktik (target: mendekati nol).
*   **Engagement:**
    *   Jumlah layanan yang berhasil dipesan per minggu.
    *   Rating rata-rata Nakes di seluruh platform.
*   **Pemberdayaan Nakes:**
    *   Pendapatan rata-rata per Nakes aktif per bulan.
*   **Monetisasi:** Total nilai transaksi (GMV) dan pendapatan platform (Total GMV * 7%).

### **5. Ketergantungan & Batasan**

*   **Integrasi SatuSehat:** Fungsionalitas inti sangat bergantung pada ketersediaan dan keandalan API dari SatuSehat untuk verifikasi data Nakes.
*   **Regulasi:** Platform harus selalu patuh pada regulasi telemedisin dan praktik kesehatan yang berlaku di Indonesia yang dikeluarkan oleh Kemenkes.
*   **Aspek Hukum:** Diperlukan kajian hukum yang mendalam terkait tanggung jawab platform dalam kasus sengketa medis atau dugaan malpraktik. Pernyataan di `Terms of Service` harus sangat jelas.
*   **MVP Scope:** v1.0 tidak akan mencakup resep elektronik, integrasi lab/apotek, atau klaim asuransi.

### **6. Pertanyaan Terbuka & Item Masa Depan**

*   Bagaimana model terbaik untuk asuransi profesi bagi Nakes yang praktik melalui platform?
*   Roadmap untuk integrasi dengan sistem rekam medis elektronik (RME) yang lebih luas.
*   Pengembangan fitur konsultasi video (telekonsultasi sinkron) untuk layanan yang tidak memerlukan kehadiran fisik.
*   Implementasi sistem tingkatan (tier) untuk Nakes (Nakes Pratama, Madya, Utama) berdasarkan pengalaman, sertifikasi, dan rating.

---

PRD ini dirancang untuk menjadi pondasi yang kuat, dengan menekankan pada **keamanan dan kepercayaan** sebagai pilar utama, yang merupakan hal non-negosiabel dalam industri kesehatan.Sempurna. Keputusan-keputusan ini sangat strategis dan penting untuk memperjelas posisi hukum, fokus produk, dan roadmap jangka panjang. Ini membantu memitigasi risiko dan menjaga agar MVP tetap ramping namun kuat.

Saya akan mengintegrasikan semua keputusan ini ke dalam PRD "NakesLink", menjadikannya lebih tajam dan siap untuk dieksekusi.

---

### **Pembaruan Final PRD: NakesLink v1.0 (Berdasarkan Keputusan Anda)**

Ini adalah revisi dan tambahan final untuk PRD NakesLink, yang mencerminkan model bisnis dan keputusan strategis Anda.

#### **Revisi Kunci pada Bagian 1: Pendahuluan & Visi Produk**

**1.4. Model Bisnis & Posisi Hukum (BARU)**
*   **Model Platform:** NakesLink beroperasi sebagai **platform marketplace teknologi (penyedia jasa aplikasi)** yang menghubungkan penyedia jasa independen (Mitra Nakes) dengan pengguna jasa (Pasien/Keluarga).
*   **Status Kemitraan:** Mitra Nakes yang terdaftar adalah **pekerja lepas (freelancer)**, bukan karyawan, agen, atau perwakilan dari NakesLink. Hubungan yang terjalin adalah kemitraan, di mana NakesLink menyediakan platform dan Mitra Nakes menyediakan layanan profesional mereka.
*   **Tanggung Jawab:** Tanggung jawab profesional dan medis atas layanan yang diberikan sepenuhnya berada pada masing-masing Mitra Nakes. NakesLink bertanggung jawab untuk menyediakan platform yang aman, proses verifikasi yang ketat, dan memfasilitasi komunikasi serta transaksi. Hal ini harus dinyatakan dengan sangat jelas dalam Syarat & Ketentuan layanan.

#### **Revisi pada Bagian 3: Fitur & Fungsionalitas**

Kita akan menambahkan **Epic baru** yang sangat penting berdasarkan keputusan Anda tentang rekam medis terintegrasi.

**Epic 7: Kontinuitas Perawatan & Rekam Medis Terintegrasi (BARU)**

*   **Latar Belakang:** Untuk memastikan perawatan yang holistik dan berkelanjutan, setiap Nakes yang menangani seorang pasien harus dapat melihat riwayat layanan sebelumnya yang diberikan oleh Nakes lain melalui platform ini.
*   **User Story 7.1 (Sistem):** Untuk setiap pasien, sistem harus membuat sebuah **"Berkas Kesehatan Digital"** terpusat yang aman.
*   **User Story 7.2 (Nakes):** Sebelum memulai layanan, sebagai seorang Nakes, saya harus bisa mengakses Berkas Kesehatan Digital pasien (dengan persetujuan pasien) untuk melihat riwayat catatan perkembangan dan SOP yang telah diisi oleh Nakes lain sebelumnya (misalnya, Fisioterapis bisa melihat catatan dari Perawat Perawatan Luka).
*   **User Story 7.3 (Pasien):** Sebagai pasien, saya ingin memiliki satu halaman di profil saya di mana saya bisa melihat seluruh riwayat layanan dan catatan perkembangan dari semua Nakes yang pernah menangani saya melalui NakesLink.
*   **User Story 7.4 (Sistem):** Akses ke Berkas Kesehatan Digital ini harus dilindungi dengan ketat dan hanya dapat diakses oleh Nakes yang memiliki pesanan aktif dengan pasien tersebut, dan log akses harus dicatat.

#### **Revisi pada Bagian 5: Ketergantungan & Batasan**

*   **DIHAPUS:** Batasan `v1.0 tidak akan mencakup ... rekam medis elektronik (RME)`.
*   **DITAMBAHKAN:** **Rekam Medis Internal:** v1.0 akan mencakup sistem rekam medis internal yang terintegrasi antar Nakes di dalam platform. Integrasi dengan sistem RME eksternal atau fasilitas kesehatan lain adalah target jangka panjang.

#### **Revisi pada Bagian 6: Pertanyaan Terbuka & Item Masa Depan**

Pembaruan ini mengubah "pertanyaan" menjadi "keputusan roadmap".

*   **Bagaimana model terbaik untuk asuransi profesi bagi Nakes yang praktik melalui platform?**
    *   **Keputusan:** NakesLink akan menjajaki kemitraan dengan penyedia asuransi profesi untuk menawarkan paket khusus bagi Mitra Nakes sebagai fitur opsional di masa depan. Untuk v1.0, kepemilikan asuransi profesi adalah tanggung jawab masing-masing Mitra.

*   **Roadmap untuk integrasi dengan sistem rekam medis elektronik (RME) yang lebih luas.**
    *   **Keputusan:** Integrasi dengan **asuransi (BPJS dan swasta)** akan menjadi prioritas setelah platform stabil dan memiliki basis pengguna yang kuat (target: **v2.0**). Ini akan memungkinkan klaim langsung dari aplikasi.

*   **Pengembangan fitur konsultasi video (telekonsultasi sinkron).**
    *   **Keputusan:** Untuk menjaga fokus dan efisiensi MVP, fitur video akan diimplementasikan menggunakan **integrasi dengan penyedia layanan pihak ketiga**. Tombol "Mulai Konsultasi Video" di dalam aplikasi akan mengarahkan pengguna ke platform video conference (seperti Google Meet atau layanan khusus telemedisin) melalui tautan unik yang di-generate oleh sistem. Pengembangan solusi video internal bukan prioritas untuk v1.0.

*   **Implementasi sistem tingkatan (tier) untuk Nakes (Nakes Pratama, Madya, Utama).**
    *   **Keputusan:** Akan dimasukkan ke dalam roadmap untuk rilis **v1.1 (sekitar 2-3 bulan setelah peluncuran)**. Sistem tier akan memberikan diferensiasi dan jalur karir bagi Mitra Nakes di dalam platform.

---

### **Ringkasan Roadmap Produk NakesLink yang Dihasilkan**

Ini adalah cerminan dari semua keputusan strategis Anda.

*   **NakesLink v1.0 (Fokus Peluncuran):**
    *   ✅ **Model Platform Freelance yang Jelas.**
    *   ✅ Onboarding & Verifikasi Nakes (Integrasi SatuSehat).
    *   ✅ Alur Permintaan & Penjadwalan Layanan Berbasis Tarif.
    *   ✅ Pelaksanaan Layanan dengan Checklist SOP Digital.
    *   ✅ **Rekam Medis Internal Terintegrasi antar Nakes.**
    *   ✅ Tombol & Alur Penanganan Gawat Darurat (Dasar).
    *   ✅ Sistem Wallet & Penarikan Dana (Fee Flat 7%).
    *   ✅ Fitur Chat Aman per Pesanan.
    *   ✅ Sistem Ulasan & Reputasi Nakes.
    *   ✅ Sistem Tiket Dukungan untuk Fasilitasi Sengketa.

*   **NakesLink v1.1 (Roadmap: +2-3 Bulan):**
    *   Implementasi Sistem Tiering Nakes (Pratama, Madya, Utama).

*   **NakesLink v1.2 (Roadmap: +6-9 Bulan):**
    *   Integrasi dengan **Penyedia Layanan Video Call Pihak Ketiga.**
    *   Eksplorasi kemitraan dengan penyedia Asuransi Profesi.

*   **NakesLink v2.0 (Roadmap Jangka Panjang):**
    *   Integrasi dengan **Asuransi (BPJS & Swasta)** untuk proses klaim.
    *   Eksplorasi integrasi dengan RME eksternal.

PRD ini sekarang sangat solid, fokus, dan secara strategis menunda fitur-fitur mahal atau kompleks (seperti membangun video call sendiri) demi peluncuran yang lebih cepat, sambil tetap mempertahankan fitur inti yang paling bernilai bagi pengguna. Ini adalah pendekatan yang sangat baik. buat aplikasi full stack based dari PRD diatas. 