-- Migration: Create feedback tables for user testing and general feedback
-- Created: 2024-01-21
-- Description: Tables to support user testing feedback collection and general app feedback

-- Create user testing participants table
CREATE TABLE IF NOT EXISTS user_testing_participants (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('patient', 'nakes')),
    demographics JSONB,
    recruitment_source VARCHAR(100),
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    last_feedback_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped_out')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user testing feedback table
CREATE TABLE IF NOT EXISTS user_testing_feedback (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(50) NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('patient', 'nakes')),
    scenario_id VARCHAR(50) NOT NULL,
    task_completion_rate DECIMAL(5,2) NOT NULL CHECK (task_completion_rate >= 0 AND task_completion_rate <= 100),
    time_to_complete INTEGER NOT NULL CHECK (time_to_complete >= 0), -- in seconds
    error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
    satisfaction_score DECIMAL(3,2) NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    sus_score DECIMAL(5,2) CHECK (sus_score >= 0 AND sus_score <= 100),
    feedback_text TEXT,
    issues_encountered JSONB, -- Array of issues
    suggestions TEXT,
    device_info JSONB,
    browser_info JSONB,
    session_recording_url VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (participant_id) REFERENCES user_testing_participants(participant_id) ON DELETE CASCADE
);

-- Create general app feedback table
CREATE TABLE IF NOT EXISTS app_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'complaint', 'compliment')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    page_url VARCHAR(500),
    steps_to_reproduce TEXT,
    device_info JSONB,
    browser_info JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create feedback attachments table
CREATE TABLE IF NOT EXISTS feedback_attachments (
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('user_testing', 'general')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (feedback_id) REFERENCES app_feedback(id) ON DELETE CASCADE
);

-- Create user testing scenarios table
CREATE TABLE IF NOT EXISTS user_testing_scenarios (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_user_type VARCHAR(20) NOT NULL CHECK (target_user_type IN ('patient', 'nakes', 'both')),
    steps JSONB NOT NULL, -- Array of steps
    success_criteria JSONB NOT NULL, -- Array of success criteria
    expected_duration INTEGER, -- in seconds
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create feedback analytics view
CREATE OR REPLACE VIEW feedback_analytics AS
SELECT 
    'user_testing' as feedback_type,
    session_type as category,
    COUNT(*) as total_count,
    AVG(satisfaction_score) as avg_satisfaction,
    AVG(task_completion_rate) as avg_completion_rate,
    AVG(time_to_complete) as avg_time_to_complete,
    AVG(error_count) as avg_error_count,
    DATE_TRUNC('day', submitted_at) as feedback_date
FROM user_testing_feedback
GROUP BY session_type, DATE_TRUNC('day', submitted_at)

UNION ALL

SELECT 
    'general' as feedback_type,
    category,
    COUNT(*) as total_count,
    NULL as avg_satisfaction,
    NULL as avg_completion_rate,
    NULL as avg_time_to_complete,
    NULL as avg_error_count,
    DATE_TRUNC('day', created_at) as feedback_date
FROM app_feedback
GROUP BY category, DATE_TRUNC('day', created_at);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_participant ON user_testing_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_scenario ON user_testing_feedback(scenario_id);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_session_type ON user_testing_feedback(session_type);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_submitted_at ON user_testing_feedback(submitted_at);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_satisfaction ON user_testing_feedback(satisfaction_score);

CREATE INDEX IF NOT EXISTS idx_app_feedback_user ON app_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_app_feedback_category ON app_feedback(category);
CREATE INDEX IF NOT EXISTS idx_app_feedback_status ON app_feedback(status);
CREATE INDEX IF NOT EXISTS idx_app_feedback_priority ON app_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_app_feedback_created_at ON app_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_user_testing_participants_type ON user_testing_participants(participant_type);
CREATE INDEX IF NOT EXISTS idx_user_testing_participants_status ON user_testing_participants(status);

CREATE INDEX IF NOT EXISTS idx_user_testing_scenarios_active ON user_testing_scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_user_testing_scenarios_user_type ON user_testing_scenarios(target_user_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_testing_participants_updated_at 
    BEFORE UPDATE ON user_testing_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_feedback_updated_at 
    BEFORE UPDATE ON app_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_testing_scenarios_updated_at 
    BEFORE UPDATE ON user_testing_scenarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default user testing scenarios
INSERT INTO user_testing_scenarios (scenario_id, title, description, target_user_type, steps, success_criteria, expected_duration, difficulty_level) VALUES
(
    'patient_registration',
    'Registrasi Pasien Baru',
    'Pengguna mendaftar sebagai pasien baru di platform Nakes Link',
    'patient',
    '[
        "Download dan install aplikasi",
        "Buat akun baru dengan email/nomor HP",
        "Verifikasi OTP",
        "Lengkapi profil (NIK, data diri, riwayat kesehatan)",
        "Upload foto KTP",
        "Verifikasi identitas"
    ]'::jsonb,
    '[
        "Berhasil membuat akun dalam <3 menit",
        "Proses verifikasi berjalan lancar",
        "Informasi tersimpan dengan benar"
    ]'::jsonb,
    180,
    'easy'
),
(
    'patient_booking',
    'Booking Konsultasi Dokter',
    'Pasien mencari dan memesan konsultasi dengan dokter',
    'patient',
    '[
        "Login ke aplikasi",
        "Cari dokter berdasarkan spesialisasi/lokasi",
        "Lihat profil dan jadwal dokter",
        "Pilih slot waktu yang tersedia",
        "Isi keluhan dan gejala",
        "Konfirmasi booking",
        "Lakukan pembayaran"
    ]'::jsonb,
    '[
        "Menemukan dokter yang sesuai dalam <2 menit",
        "Proses booking selesai dalam <3 menit",
        "Pembayaran berhasil tanpa error"
    ]'::jsonb,
    300,
    'medium'
),
(
    'patient_consultation',
    'Konsultasi Video Call',
    'Pasien melakukan konsultasi video call dengan dokter',
    'patient',
    '[
        "Terima notifikasi appointment",
        "Join video call tepat waktu",
        "Komunikasi dengan dokter",
        "Share dokumen/foto jika diperlukan",
        "Terima resep digital",
        "Berikan rating dan review"
    ]'::jsonb,
    '[
        "Video call berjalan lancar tanpa lag",
        "Audio/video quality baik",
        "Fitur sharing berfungsi",
        "Resep diterima dengan benar"
    ]'::jsonb,
    900,
    'medium'
),
(
    'patient_emergency',
    'Fitur SOS Darurat',
    'Pasien menggunakan fitur SOS dalam kondisi darurat',
    'patient',
    '[
        "Akses fitur SOS dari home screen",
        "Pilih jenis emergency",
        "Konfirm lokasi otomatis",
        "Kirim alert ke PSC 119",
        "Terima konfirmasi dan instruksi"
    ]'::jsonb,
    '[
        "SOS dapat diakses dalam <10 detik",
        "Lokasi terdeteksi akurat",
        "Alert terkirim ke PSC 119",
        "Instruksi diterima dengan jelas"
    ]'::jsonb,
    60,
    'high'
),
(
    'nakes_registration',
    'Registrasi Tenaga Kesehatan',
    'Tenaga kesehatan mendaftar di platform Nakes Link',
    'nakes',
    '[
        "Registrasi dengan email profesional",
        "Upload dokumen STR dan SIP",
        "Verifikasi dengan SatuSehat",
        "Lengkapi profil profesional",
        "Set jadwal praktik",
        "Menunggu approval admin"
    ]'::jsonb,
    '[
        "Proses upload dokumen mudah",
        "Verifikasi SatuSehat berhasil",
        "Profil tersimpan lengkap"
    ]'::jsonb,
    600,
    'medium'
),
(
    'nakes_schedule',
    'Manajemen Jadwal Praktik',
    'Tenaga kesehatan mengatur jadwal dan mengelola appointment',
    'nakes',
    '[
        "Login ke dashboard Nakes",
        "Set availability schedule",
        "Lihat incoming appointment requests",
        "Approve/reject appointment",
        "Reschedule jika diperlukan",
        "Set break time"
    ]'::jsonb,
    '[
        "Jadwal mudah diatur",
        "Notifikasi appointment real-time",
        "Reschedule berfungsi lancar"
    ]'::jsonb,
    420,
    'medium'
),
(
    'nakes_consultation',
    'Konsultasi dengan Pasien',
    'Tenaga kesehatan melakukan konsultasi dengan pasien',
    'nakes',
    '[
        "Review patient history sebelum konsultasi",
        "Join video call tepat waktu",
        "Akses medical records pasien",
        "Tulis diagnosis dan treatment plan",
        "Prescribe obat digital",
        "Schedule follow-up jika diperlukan"
    ]'::jsonb,
    '[
        "Patient data mudah diakses",
        "Video call stabil",
        "E-prescription system berfungsi",
        "Follow-up scheduling mudah"
    ]'::jsonb,
    1200,
    'medium'
),
(
    'nakes_emergency',
    'Respons Emergency Alert',
    'Tenaga kesehatan merespons emergency alert dari PSC 119',
    'nakes',
    '[
        "Terima emergency notification",
        "Review patient location dan kondisi",
        "Provide immediate guidance",
        "Coordinate dengan emergency services",
        "Document emergency response"
    ]'::jsonb,
    '[
        "Alert diterima real-time",
        "Patient info lengkap",
        "Communication tools berfungsi",
        "Documentation mudah"
    ]'::jsonb,
    300,
    'high'
)
ON CONFLICT (scenario_id) DO NOTHING;

-- Create function to calculate SUS score
CREATE OR REPLACE FUNCTION calculate_sus_score(
    q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER, q5 INTEGER,
    q6 INTEGER, q7 INTEGER, q8 INTEGER, q9 INTEGER, q10 INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2);
BEGIN
    -- SUS scoring: odd questions (1,3,5,7,9) subtract 1, even questions (2,4,6,8,10) subtract from 5
    -- Then multiply total by 2.5
    score := (
        (q1 - 1) + (5 - q2) + (q3 - 1) + (5 - q4) + (q5 - 1) +
        (5 - q6) + (q7 - 1) + (5 - q8) + (q9 - 1) + (5 - q10)
    ) * 2.5;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create function to get feedback summary
CREATE OR REPLACE FUNCTION get_feedback_summary(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    feedback_type VARCHAR,
    category VARCHAR,
    total_count BIGINT,
    avg_satisfaction DECIMAL,
    critical_issues BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_testing'::VARCHAR as feedback_type,
        utf.session_type::VARCHAR as category,
        COUNT(*)::BIGINT as total_count,
        AVG(utf.satisfaction_score)::DECIMAL as avg_satisfaction,
        COUNT(*) FILTER (WHERE utf.satisfaction_score <= 2 OR utf.error_count >= 5)::BIGINT as critical_issues
    FROM user_testing_feedback utf
    WHERE (start_date IS NULL OR utf.submitted_at::DATE >= start_date)
      AND (end_date IS NULL OR utf.submitted_at::DATE <= end_date)
    GROUP BY utf.session_type
    
    UNION ALL
    
    SELECT 
        'general'::VARCHAR as feedback_type,
        af.category::VARCHAR as category,
        COUNT(*)::BIGINT as total_count,
        NULL::DECIMAL as avg_satisfaction,
        COUNT(*) FILTER (WHERE af.priority IN ('high', 'critical'))::BIGINT as critical_issues
    FROM app_feedback af
    WHERE (start_date IS NULL OR af.created_at::DATE >= start_date)
      AND (end_date IS NULL OR af.created_at::DATE <= end_date)
    GROUP BY af.category;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_testing_participants IS 'Stores information about user testing participants';
COMMENT ON TABLE user_testing_feedback IS 'Stores feedback from user testing sessions';
COMMENT ON TABLE app_feedback IS 'Stores general feedback from app users';
COMMENT ON TABLE feedback_attachments IS 'Stores file attachments for feedback';
COMMENT ON TABLE user_testing_scenarios IS 'Defines user testing scenarios and tasks';

COMMENT ON COLUMN user_testing_feedback.task_completion_rate IS 'Percentage of tasks completed successfully (0-100)';
COMMENT ON COLUMN user_testing_feedback.time_to_complete IS 'Time taken to complete the scenario in seconds';
COMMENT ON COLUMN user_testing_feedback.satisfaction_score IS 'User satisfaction rating (1-5 scale)';
COMMENT ON COLUMN user_testing_feedback.sus_score IS 'System Usability Scale score (0-100)';
COMMENT ON COLUMN user_testing_feedback.issues_encountered IS 'JSON array of issues encountered during testing';

COMMENT ON FUNCTION calculate_sus_score IS 'Calculates SUS score from 10 questionnaire responses';
COMMENT ON FUNCTION get_feedback_summary IS 'Returns summary statistics for feedback data';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_testing_participants TO nakes_app;
GRANT SELECT, INSERT, UPDATE ON user_testing_feedback TO nakes_app;
GRANT SELECT, INSERT, UPDATE ON app_feedback TO nakes_app;
GRANT SELECT, INSERT, UPDATE ON feedback_attachments TO nakes_app;
GRANT SELECT ON user_testing_scenarios TO nakes_app;
GRANT SELECT ON feedback_analytics TO nakes_app;

GRANT USAGE ON SEQUENCE user_testing_participants_id_seq TO nakes_app;
GRANT USAGE ON SEQUENCE user_testing_feedback_id_seq TO nakes_app;
GRANT USAGE ON SEQUENCE app_feedback_id_seq TO nakes_app;
GRANT USAGE ON SEQUENCE feedback_attachments_id_seq TO nakes_app;
GRANT USAGE ON SEQUENCE user_testing_scenarios_id_seq TO nakes_app;

GRANT EXECUTE ON FUNCTION calculate_sus_score TO nakes_app;
GRANT EXECUTE ON FUNCTION get_feedback_summary TO nakes_app;