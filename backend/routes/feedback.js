const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/emailService');

// Rate limiting for feedback submission
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Terlalu banyak feedback dikirim. Coba lagi dalam 15 menit.'
    }
});

// Submit user testing feedback
router.post('/user-testing', 
    feedbackLimiter,
    [
        body('participant_id').notEmpty().withMessage('Participant ID diperlukan'),
        body('session_type').isIn(['patient', 'nakes']).withMessage('Session type harus patient atau nakes'),
        body('scenario_id').notEmpty().withMessage('Scenario ID diperlukan'),
        body('task_completion_rate').isFloat({ min: 0, max: 100 }).withMessage('Task completion rate harus antara 0-100'),
        body('time_to_complete').isInt({ min: 0 }).withMessage('Time to complete harus angka positif'),
        body('error_count').isInt({ min: 0 }).withMessage('Error count harus angka positif'),
        body('satisfaction_score').isFloat({ min: 1, max: 5 }).withMessage('Satisfaction score harus antara 1-5'),
        body('sus_score').optional().isFloat({ min: 0, max: 100 }).withMessage('SUS score harus antara 0-100'),
        body('feedback_text').optional().isLength({ max: 2000 }).withMessage('Feedback text maksimal 2000 karakter'),
        body('issues_encountered').optional().isArray().withMessage('Issues encountered harus array'),
        body('suggestions').optional().isLength({ max: 1000 }).withMessage('Suggestions maksimal 1000 karakter')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Data tidak valid',
                    errors: errors.array()
                });
            }

            const {
                participant_id,
                session_type,
                scenario_id,
                task_completion_rate,
                time_to_complete,
                error_count,
                satisfaction_score,
                sus_score,
                feedback_text,
                issues_encountered,
                suggestions,
                device_info,
                browser_info
            } = req.body;

            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Insert feedback record
                const feedbackQuery = `
                    INSERT INTO user_testing_feedback (
                        participant_id, session_type, scenario_id, task_completion_rate,
                        time_to_complete, error_count, satisfaction_score, sus_score,
                        feedback_text, issues_encountered, suggestions, device_info,
                        browser_info, submitted_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                    RETURNING id
                `;

                const feedbackResult = await client.query(feedbackQuery, [
                    participant_id,
                    session_type,
                    scenario_id,
                    task_completion_rate,
                    time_to_complete,
                    error_count,
                    satisfaction_score,
                    sus_score,
                    feedback_text,
                    JSON.stringify(issues_encountered || []),
                    suggestions,
                    JSON.stringify(device_info || {}),
                    JSON.stringify(browser_info || {})
                ]);

                const feedbackId = feedbackResult.rows[0].id;

                // Update participant session status
                await client.query(
                    'UPDATE user_testing_participants SET last_feedback_at = NOW(), total_sessions = total_sessions + 1 WHERE participant_id = $1',
                    [participant_id]
                );

                await client.query('COMMIT');

                // Send notification to research team if critical issues found
                if (satisfaction_score <= 2 || error_count >= 5) {
                    await sendCriticalFeedbackAlert(feedbackId, participant_id, session_type, scenario_id);
                }

                logger.info('User testing feedback submitted', {
                    feedbackId,
                    participantId: participant_id,
                    sessionType: session_type,
                    scenarioId: scenario_id,
                    satisfactionScore: satisfaction_score
                });

                res.status(201).json({
                    success: true,
                    message: 'Feedback berhasil dikirim',
                    data: {
                        feedback_id: feedbackId
                    }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            logger.error('Error submitting user testing feedback:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengirim feedback'
            });
        }
    }
);

// Submit general app feedback
router.post('/general',
    auth,
    feedbackLimiter,
    [
        body('category').isIn(['bug', 'feature_request', 'improvement', 'complaint', 'compliment']).withMessage('Kategori tidak valid'),
        body('title').isLength({ min: 5, max: 100 }).withMessage('Judul harus 5-100 karakter'),
        body('description').isLength({ min: 10, max: 2000 }).withMessage('Deskripsi harus 10-2000 karakter'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority tidak valid'),
        body('page_url').optional().isURL().withMessage('Page URL tidak valid'),
        body('steps_to_reproduce').optional().isLength({ max: 1000 }).withMessage('Steps to reproduce maksimal 1000 karakter')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Data tidak valid',
                    errors: errors.array()
                });
            }

            const {
                category,
                title,
                description,
                priority = 'medium',
                page_url,
                steps_to_reproduce,
                device_info,
                browser_info
            } = req.body;

            const query = `
                INSERT INTO app_feedback (
                    user_id, category, title, description, priority,
                    page_url, steps_to_reproduce, device_info, browser_info,
                    status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW())
                RETURNING id
            `;

            const result = await pool.query(query, [
                req.user.id,
                category,
                title,
                description,
                priority,
                page_url,
                steps_to_reproduce,
                JSON.stringify(device_info || {}),
                JSON.stringify(browser_info || {})
            ]);

            const feedbackId = result.rows[0].id;

            // Send notification for high/critical priority feedback
            if (priority === 'high' || priority === 'critical') {
                await sendHighPriorityFeedbackAlert(feedbackId, req.user.id, category, title);
            }

            logger.info('General feedback submitted', {
                feedbackId,
                userId: req.user.id,
                category,
                priority
            });

            res.status(201).json({
                success: true,
                message: 'Feedback berhasil dikirim',
                data: {
                    feedback_id: feedbackId
                }
            });

        } catch (error) {
            logger.error('Error submitting general feedback:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengirim feedback'
            });
        }
    }
);

// Get user testing analytics (Admin only)
router.get('/analytics/user-testing',
    adminAuth,
    [
        query('start_date').optional().isISO8601().withMessage('Start date harus format ISO8601'),
        query('end_date').optional().isISO8601().withMessage('End date harus format ISO8601'),
        query('session_type').optional().isIn(['patient', 'nakes']).withMessage('Session type tidak valid'),
        query('scenario_id').optional().notEmpty().withMessage('Scenario ID tidak boleh kosong')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter tidak valid',
                    errors: errors.array()
                });
            }

            const { start_date, end_date, session_type, scenario_id } = req.query;

            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (start_date) {
                paramCount++;
                whereClause += ` AND submitted_at >= $${paramCount}`;
                params.push(start_date);
            }

            if (end_date) {
                paramCount++;
                whereClause += ` AND submitted_at <= $${paramCount}`;
                params.push(end_date);
            }

            if (session_type) {
                paramCount++;
                whereClause += ` AND session_type = $${paramCount}`;
                params.push(session_type);
            }

            if (scenario_id) {
                paramCount++;
                whereClause += ` AND scenario_id = $${paramCount}`;
                params.push(scenario_id);
            }

            // Get overall statistics
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(task_completion_rate) as avg_completion_rate,
                    AVG(time_to_complete) as avg_time_to_complete,
                    AVG(error_count) as avg_error_count,
                    AVG(satisfaction_score) as avg_satisfaction_score,
                    AVG(sus_score) as avg_sus_score,
                    session_type
                FROM user_testing_feedback 
                ${whereClause}
                GROUP BY session_type
            `;

            const statsResult = await pool.query(statsQuery, params);

            // Get scenario breakdown
            const scenarioQuery = `
                SELECT 
                    scenario_id,
                    COUNT(*) as session_count,
                    AVG(task_completion_rate) as avg_completion_rate,
                    AVG(satisfaction_score) as avg_satisfaction_score,
                    session_type
                FROM user_testing_feedback 
                ${whereClause}
                GROUP BY scenario_id, session_type
                ORDER BY scenario_id, session_type
            `;

            const scenarioResult = await pool.query(scenarioQuery, params);

            // Get common issues
            const issuesQuery = `
                SELECT 
                    issue,
                    COUNT(*) as frequency,
                    session_type
                FROM (
                    SELECT 
                        jsonb_array_elements_text(issues_encountered::jsonb) as issue,
                        session_type
                    FROM user_testing_feedback 
                    ${whereClause}
                    AND issues_encountered IS NOT NULL
                ) issues_expanded
                GROUP BY issue, session_type
                ORDER BY frequency DESC
                LIMIT 20
            `;

            const issuesResult = await pool.query(issuesQuery, params);

            // Get satisfaction distribution
            const satisfactionQuery = `
                SELECT 
                    satisfaction_score,
                    COUNT(*) as count,
                    session_type
                FROM user_testing_feedback 
                ${whereClause}
                GROUP BY satisfaction_score, session_type
                ORDER BY satisfaction_score, session_type
            `;

            const satisfactionResult = await pool.query(satisfactionQuery, params);

            res.json({
                success: true,
                data: {
                    overall_stats: statsResult.rows,
                    scenario_breakdown: scenarioResult.rows,
                    common_issues: issuesResult.rows,
                    satisfaction_distribution: satisfactionResult.rows
                }
            });

        } catch (error) {
            logger.error('Error getting user testing analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil analytics'
            });
        }
    }
);

// Get general feedback list (Admin only)
router.get('/general',
    adminAuth,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page harus angka positif'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus 1-100'),
        query('category').optional().isIn(['bug', 'feature_request', 'improvement', 'complaint', 'compliment']).withMessage('Kategori tidak valid'),
        query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Status tidak valid'),
        query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority tidak valid')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter tidak valid',
                    errors: errors.array()
                });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const { category, status, priority } = req.query;

            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (category) {
                paramCount++;
                whereClause += ` AND category = $${paramCount}`;
                params.push(category);
            }

            if (status) {
                paramCount++;
                whereClause += ` AND status = $${paramCount}`;
                params.push(status);
            }

            if (priority) {
                paramCount++;
                whereClause += ` AND priority = $${paramCount}`;
                params.push(priority);
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) FROM app_feedback ${whereClause}`;
            const countResult = await pool.query(countQuery, params);
            const totalItems = parseInt(countResult.rows[0].count);

            // Get feedback list
            params.push(limit, offset);
            const feedbackQuery = `
                SELECT 
                    f.id,
                    f.category,
                    f.title,
                    f.description,
                    f.priority,
                    f.status,
                    f.page_url,
                    f.created_at,
                    f.updated_at,
                    u.name as user_name,
                    u.email as user_email,
                    u.role as user_role
                FROM app_feedback f
                LEFT JOIN users u ON f.user_id = u.id
                ${whereClause}
                ORDER BY 
                    CASE f.priority 
                        WHEN 'critical' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'medium' THEN 3
                        WHEN 'low' THEN 4
                    END,
                    f.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            const feedbackResult = await pool.query(feedbackQuery, params);

            res.json({
                success: true,
                data: {
                    feedback: feedbackResult.rows,
                    pagination: {
                        current_page: page,
                        total_pages: Math.ceil(totalItems / limit),
                        total_items: totalItems,
                        items_per_page: limit
                    }
                }
            });

        } catch (error) {
            logger.error('Error getting general feedback:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil feedback'
            });
        }
    }
);

// Update feedback status (Admin only)
router.patch('/:feedbackId/status',
    adminAuth,
    [
        body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Status tidak valid'),
        body('admin_notes').optional().isLength({ max: 1000 }).withMessage('Admin notes maksimal 1000 karakter')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Data tidak valid',
                    errors: errors.array()
                });
            }

            const { feedbackId } = req.params;
            const { status, admin_notes } = req.body;

            const query = `
                UPDATE app_feedback 
                SET status = $1, admin_notes = $2, updated_at = NOW(), updated_by = $3
                WHERE id = $4
                RETURNING *
            `;

            const result = await pool.query(query, [status, admin_notes, req.user.id, feedbackId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Feedback tidak ditemukan'
                });
            }

            logger.info('Feedback status updated', {
                feedbackId,
                newStatus: status,
                updatedBy: req.user.id
            });

            res.json({
                success: true,
                message: 'Status feedback berhasil diupdate',
                data: result.rows[0]
            });

        } catch (error) {
            logger.error('Error updating feedback status:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupdate status feedback'
            });
        }
    }
);

// Helper function to send critical feedback alert
async function sendCriticalFeedbackAlert(feedbackId, participantId, sessionType, scenarioId) {
    try {
        const subject = `🚨 Critical User Testing Feedback - ${sessionType.toUpperCase()}`;
        const html = `
            <h2>Critical User Testing Feedback Alert</h2>
            <p>A critical feedback has been submitted that requires immediate attention.</p>
            
            <h3>Details:</h3>
            <ul>
                <li><strong>Feedback ID:</strong> ${feedbackId}</li>
                <li><strong>Participant ID:</strong> ${participantId}</li>
                <li><strong>Session Type:</strong> ${sessionType}</li>
                <li><strong>Scenario ID:</strong> ${scenarioId}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
            
            <p>Please review this feedback immediately in the admin dashboard.</p>
            
            <a href="${process.env.ADMIN_URL}/feedback/user-testing/${feedbackId}" 
               style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Feedback
            </a>
        `;

        await sendEmail({
            to: process.env.RESEARCH_TEAM_EMAIL || 'research@nakeslink.com',
            subject,
            html
        });
    } catch (error) {
        logger.error('Error sending critical feedback alert:', error);
    }
}

// Helper function to send high priority feedback alert
async function sendHighPriorityFeedbackAlert(feedbackId, userId, category, title) {
    try {
        const subject = `⚠️ High Priority Feedback - ${category.toUpperCase()}`;
        const html = `
            <h2>High Priority Feedback Alert</h2>
            <p>A high priority feedback has been submitted.</p>
            
            <h3>Details:</h3>
            <ul>
                <li><strong>Feedback ID:</strong> ${feedbackId}</li>
                <li><strong>User ID:</strong> ${userId}</li>
                <li><strong>Category:</strong> ${category}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
            
            <a href="${process.env.ADMIN_URL}/feedback/general/${feedbackId}" 
               style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Feedback
            </a>
        `;

        await sendEmail({
            to: process.env.SUPPORT_TEAM_EMAIL || 'support@nakeslink.com',
            subject,
            html
        });
    } catch (error) {
        logger.error('Error sending high priority feedback alert:', error);
    }
}

module.exports = router;