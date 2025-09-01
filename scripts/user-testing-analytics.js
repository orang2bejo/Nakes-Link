#!/usr/bin/env node

/**
 * Nakes Link User Testing Analytics Script
 * 
 * This script collects and analyzes user testing data from the database,
 * generates reports, and provides insights for improving the application.
 * 
 * Usage:
 *   node user-testing-analytics.js [command] [options]
 * 
 * Commands:
 *   collect     - Collect analytics data
 *   report      - Generate comprehensive report
 *   insights    - Generate AI-powered insights
 *   export      - Export data to various formats
 *   dashboard   - Generate dashboard data
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const nodemailer = require('nodemailer');

// Configuration
const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'nakes_link',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
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
    output: {
        directory: path.join(__dirname, '..', 'user-testing', 'reports'),
        charts: path.join(__dirname, '..', 'user-testing', 'charts')
    }
};

// Database connection
const pool = new Pool(config.database);

// Chart configuration
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width: 800, 
    height: 600,
    backgroundColour: 'white'
});

class UserTestingAnalytics {
    constructor() {
        this.data = {
            participants: [],
            feedback: [],
            scenarios: [],
            summary: {}
        };
    }

    /**
     * Collect all analytics data from database
     */
    async collectData(startDate = null, endDate = null) {
        console.log('📊 Collecting user testing analytics data...');
        
        try {
            // Set default date range if not provided
            if (!startDate) {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30); // Last 30 days
            }
            if (!endDate) {
                endDate = new Date();
            }

            // Collect participants data
            await this.collectParticipants();
            
            // Collect feedback data
            await this.collectFeedback(startDate, endDate);
            
            // Collect scenarios data
            await this.collectScenarios();
            
            // Generate summary statistics
            await this.generateSummary();
            
            console.log('✅ Data collection completed');
            console.log(`📈 Collected data for ${this.data.participants.length} participants`);
            console.log(`💬 Processed ${this.data.feedback.length} feedback entries`);
            
            return this.data;
        } catch (error) {
            console.error('❌ Error collecting data:', error.message);
            throw error;
        }
    }

    /**
     * Collect participants data
     */
    async collectParticipants() {
        const query = `
            SELECT 
                id,
                name,
                email,
                phone,
                participant_type,
                demographics,
                status,
                created_at,
                updated_at
            FROM user_testing_participants
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query);
        this.data.participants = result.rows;
    }

    /**
     * Collect feedback data with date filtering
     */
    async collectFeedback(startDate, endDate) {
        const query = `
            SELECT 
                f.*,
                p.name as participant_name,
                p.participant_type,
                s.name as scenario_name,
                s.description as scenario_description
            FROM user_testing_feedback f
            JOIN user_testing_participants p ON f.participant_id = p.id
            JOIN user_testing_scenarios s ON f.scenario_id = s.id
            WHERE f.submitted_at BETWEEN $1 AND $2
            ORDER BY f.submitted_at DESC
        `;
        
        const result = await pool.query(query, [startDate, endDate]);
        this.data.feedback = result.rows;
    }

    /**
     * Collect scenarios data
     */
    async collectScenarios() {
        const query = `
            SELECT 
                id,
                name,
                description,
                user_type,
                expected_duration,
                difficulty_level,
                created_at
            FROM user_testing_scenarios
            ORDER BY user_type, name
        `;
        
        const result = await pool.query(query);
        this.data.scenarios = result.rows;
    }

    /**
     * Generate summary statistics
     */
    async generateSummary() {
        const feedback = this.data.feedback;
        const participants = this.data.participants;
        
        if (feedback.length === 0) {
            this.data.summary = {
                total_participants: participants.length,
                total_feedback: 0,
                avg_satisfaction: 0,
                avg_completion_rate: 0,
                avg_sus_score: 0,
                avg_time_to_complete: 0
            };
            return;
        }

        // Calculate averages
        const avgSatisfaction = feedback.reduce((sum, f) => sum + (f.satisfaction_score || 0), 0) / feedback.length;
        const avgCompletion = feedback.reduce((sum, f) => sum + (f.task_completion_rate || 0), 0) / feedback.length;
        const avgSusScore = feedback.reduce((sum, f) => sum + (f.sus_score || 0), 0) / feedback.length;
        const avgTime = feedback.reduce((sum, f) => sum + (f.time_to_complete || 0), 0) / feedback.length;
        
        // Count by participant type
        const patientCount = participants.filter(p => p.participant_type === 'patient').length;
        const nakesCount = participants.filter(p => p.participant_type === 'nakes').length;
        
        // Calculate error statistics
        const totalErrors = feedback.reduce((sum, f) => sum + (f.error_count || 0), 0);
        const avgErrors = totalErrors / feedback.length;
        
        // Calculate completion rate by scenario
        const scenarioStats = {};
        feedback.forEach(f => {
            if (!scenarioStats[f.scenario_id]) {
                scenarioStats[f.scenario_id] = {
                    name: f.scenario_name,
                    total: 0,
                    completed: 0,
                    totalTime: 0,
                    totalSatisfaction: 0
                };
            }
            scenarioStats[f.scenario_id].total++;
            if (f.task_completion_rate >= 80) {
                scenarioStats[f.scenario_id].completed++;
            }
            scenarioStats[f.scenario_id].totalTime += f.time_to_complete || 0;
            scenarioStats[f.scenario_id].totalSatisfaction += f.satisfaction_score || 0;
        });
        
        // Calculate scenario completion rates
        Object.keys(scenarioStats).forEach(scenarioId => {
            const stats = scenarioStats[scenarioId];
            stats.completion_rate = (stats.completed / stats.total) * 100;
            stats.avg_time = stats.totalTime / stats.total;
            stats.avg_satisfaction = stats.totalSatisfaction / stats.total;
        });

        this.data.summary = {
            total_participants: participants.length,
            patient_count: patientCount,
            nakes_count: nakesCount,
            total_feedback: feedback.length,
            avg_satisfaction: avgSatisfaction,
            avg_completion_rate: avgCompletion,
            avg_sus_score: avgSusScore,
            avg_time_to_complete: avgTime,
            avg_errors: avgErrors,
            scenario_stats: scenarioStats,
            date_range: {
                start: feedback.length > 0 ? new Date(Math.min(...feedback.map(f => new Date(f.submitted_at)))) : null,
                end: feedback.length > 0 ? new Date(Math.max(...feedback.map(f => new Date(f.submitted_at)))) : null
            }
        };
    }

    /**
     * Generate comprehensive analytics report
     */
    async generateReport(format = 'markdown') {
        console.log('📝 Generating analytics report...');
        
        if (!this.data.feedback.length) {
            await this.collectData();
        }
        
        const reportData = {
            generated_at: new Date().toISOString(),
            summary: this.data.summary,
            participants: this.data.participants,
            feedback: this.data.feedback,
            scenarios: this.data.scenarios
        };
        
        // Ensure output directory exists
        await fs.mkdir(config.output.directory, { recursive: true });
        
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch (format.toLowerCase()) {
            case 'json':
                return await this.generateJSONReport(reportData, timestamp);
            case 'csv':
                return await this.generateCSVReport(reportData, timestamp);
            case 'pdf':
                return await this.generatePDFReport(reportData, timestamp);
            case 'markdown':
            default:
                return await this.generateMarkdownReport(reportData, timestamp);
        }
    }

    /**
     * Generate JSON report
     */
    async generateJSONReport(data, timestamp) {
        const filename = `user-testing-report-${timestamp}.json`;
        const filepath = path.join(config.output.directory, filename);
        
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        console.log(`✅ JSON report generated: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate CSV report
     */
    async generateCSVReport(data, timestamp) {
        const filename = `user-testing-feedback-${timestamp}.csv`;
        const filepath = path.join(config.output.directory, filename);
        
        const csvWriter = createObjectCsvWriter({
            path: filepath,
            header: [
                { id: 'participant_name', title: 'Participant Name' },
                { id: 'participant_type', title: 'Participant Type' },
                { id: 'scenario_name', title: 'Scenario' },
                { id: 'satisfaction_score', title: 'Satisfaction Score' },
                { id: 'task_completion_rate', title: 'Completion Rate (%)' },
                { id: 'time_to_complete', title: 'Time to Complete (seconds)' },
                { id: 'error_count', title: 'Error Count' },
                { id: 'sus_score', title: 'SUS Score' },
                { id: 'feedback_text', title: 'Feedback Text' },
                { id: 'submitted_at', title: 'Submitted At' }
            ]
        });
        
        await csvWriter.writeRecords(data.feedback);
        console.log(`✅ CSV report generated: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate PDF report
     */
    async generatePDFReport(data, timestamp) {
        const filename = `user-testing-report-${timestamp}.pdf`;
        const filepath = path.join(config.output.directory, filename);
        
        const doc = new PDFDocument();
        doc.pipe(require('fs').createWriteStream(filepath));
        
        // Title
        doc.fontSize(20).text('Nakes Link User Testing Report', 50, 50);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
        
        // Summary
        doc.fontSize(16).text('Executive Summary', 50, 120);
        doc.fontSize(12)
           .text(`Total Participants: ${data.summary.total_participants}`, 50, 150)
           .text(`Average Satisfaction: ${data.summary.avg_satisfaction.toFixed(2)}/5.0`, 50, 170)
           .text(`Average Completion Rate: ${data.summary.avg_completion_rate.toFixed(1)}%`, 50, 190)
           .text(`Average SUS Score: ${data.summary.avg_sus_score.toFixed(0)}/100`, 50, 210);
        
        // Scenario Performance
        doc.fontSize(16).text('Scenario Performance', 50, 250);
        let yPos = 280;
        
        Object.values(data.summary.scenario_stats || {}).forEach(scenario => {
            doc.fontSize(12)
               .text(`${scenario.name}: ${scenario.completion_rate.toFixed(1)}% completion`, 50, yPos)
               .text(`Average time: ${(scenario.avg_time / 60).toFixed(1)} minutes`, 70, yPos + 15)
               .text(`Satisfaction: ${scenario.avg_satisfaction.toFixed(1)}/5.0`, 70, yPos + 30);
            yPos += 60;
        });
        
        doc.end();
        console.log(`✅ PDF report generated: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate Markdown report
     */
    async generateMarkdownReport(data, timestamp) {
        const filename = `user-testing-report-${timestamp}.md`;
        const filepath = path.join(config.output.directory, filename);
        
        const template = await fs.readFile(
            path.join(__dirname, '..', 'user-testing', 'report-template.md'), 
            'utf8'
        );
        
        // Replace placeholders with actual data
        let report = template
            .replace(/\[Date\]/g, new Date().toLocaleDateString())
            .replace(/\[Start Date\]/g, data.summary.date_range?.start?.toLocaleDateString() || 'N/A')
            .replace(/\[End Date\]/g, data.summary.date_range?.end?.toLocaleDateString() || 'N/A')
            .replace(/\[X\.X\]\/5\.0/g, `${data.summary.avg_satisfaction.toFixed(1)}/5.0`)
            .replace(/\[XX\]%/g, `${data.summary.avg_completion_rate.toFixed(1)}%`)
            .replace(/\[XX\]\/100/g, `${data.summary.avg_sus_score.toFixed(0)}/100`)
            .replace(/Total Participants:\] \[XX\]/g, `Total Participants:** ${data.summary.total_participants}`)
            .replace(/\[XX\] patients, \[XX\] healthcare professionals/g, 
                `${data.summary.patient_count} patients, ${data.summary.nakes_count} healthcare professionals`);
        
        await fs.writeFile(filepath, report);
        console.log(`✅ Markdown report generated: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate charts for analytics
     */
    async generateCharts() {
        console.log('📊 Generating analytics charts...');
        
        if (!this.data.feedback.length) {
            await this.collectData();
        }
        
        // Ensure charts directory exists
        await fs.mkdir(config.output.charts, { recursive: true });
        
        await Promise.all([
            this.generateSatisfactionChart(),
            this.generateCompletionChart(),
            this.generateTimeChart(),
            this.generateErrorChart()
        ]);
        
        console.log('✅ Charts generated successfully');
    }

    /**
     * Generate satisfaction trend chart
     */
    async generateSatisfactionChart() {
        const dailyData = {};
        
        this.data.feedback.forEach(f => {
            const date = new Date(f.submitted_at).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, count: 0 };
            }
            dailyData[date].total += f.satisfaction_score || 0;
            dailyData[date].count += 1;
        });
        
        const labels = Object.keys(dailyData).sort();
        const data = labels.map(date => dailyData[date].total / dailyData[date].count);
        
        const configuration = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Satisfaction Score',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'User Satisfaction Trends'
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const filepath = path.join(config.output.charts, 'satisfaction-trends.png');
        await fs.writeFile(filepath, imageBuffer);
    }

    /**
     * Generate completion rate chart
     */
    async generateCompletionChart() {
        const scenarioData = this.data.summary.scenario_stats || {};
        const labels = Object.values(scenarioData).map(s => s.name);
        const data = Object.values(scenarioData).map(s => s.completion_rate);
        
        const configuration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: data,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Task Completion Rate by Scenario'
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const filepath = path.join(config.output.charts, 'completion-rates.png');
        await fs.writeFile(filepath, imageBuffer);
    }

    /**
     * Generate time to complete chart
     */
    async generateTimeChart() {
        const scenarioData = this.data.summary.scenario_stats || {};
        const labels = Object.values(scenarioData).map(s => s.name);
        const data = Object.values(scenarioData).map(s => s.avg_time / 60); // Convert to minutes
        
        const configuration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Time (minutes)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: '#4BC0C0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Time to Complete by Scenario'
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const filepath = path.join(config.output.charts, 'completion-times.png');
        await fs.writeFile(filepath, imageBuffer);
    }

    /**
     * Generate error analysis chart
     */
    async generateErrorChart() {
        const errorData = {};
        
        this.data.feedback.forEach(f => {
            if (!errorData[f.scenario_name]) {
                errorData[f.scenario_name] = { total: 0, count: 0 };
            }
            errorData[f.scenario_name].total += f.error_count || 0;
            errorData[f.scenario_name].count += 1;
        });
        
        const labels = Object.keys(errorData);
        const data = labels.map(scenario => errorData[scenario].total / errorData[scenario].count);
        
        const configuration = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Errors by Scenario'
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const filepath = path.join(config.output.charts, 'error-analysis.png');
        await fs.writeFile(filepath, imageBuffer);
    }

    /**
     * Generate AI-powered insights
     */
    async generateInsights() {
        console.log('🧠 Generating AI-powered insights...');
        
        if (!this.data.feedback.length) {
            await this.collectData();
        }
        
        const insights = {
            performance: this.analyzePerformance(),
            usability: this.analyzeUsability(),
            satisfaction: this.analyzeSatisfaction(),
            recommendations: this.generateRecommendations()
        };
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `user-testing-insights-${timestamp}.json`;
        const filepath = path.join(config.output.directory, filename);
        
        await fs.writeFile(filepath, JSON.stringify(insights, null, 2));
        console.log(`✅ Insights generated: ${filepath}`);
        
        return insights;
    }

    /**
     * Analyze performance metrics
     */
    analyzePerformance() {
        const summary = this.data.summary;
        const insights = [];
        
        // Completion rate analysis
        if (summary.avg_completion_rate < 80) {
            insights.push({
                type: 'warning',
                category: 'completion_rate',
                message: `Average completion rate of ${summary.avg_completion_rate.toFixed(1)}% is below target (80%)`,
                priority: 'high'
            });
        }
        
        // Time analysis
        if (summary.avg_time_to_complete > 600) { // 10 minutes
            insights.push({
                type: 'warning',
                category: 'time_efficiency',
                message: `Average task completion time of ${(summary.avg_time_to_complete / 60).toFixed(1)} minutes may be too long`,
                priority: 'medium'
            });
        }
        
        // Error analysis
        if (summary.avg_errors > 2) {
            insights.push({
                type: 'warning',
                category: 'error_rate',
                message: `Average error count of ${summary.avg_errors.toFixed(1)} per task is concerning`,
                priority: 'high'
            });
        }
        
        return insights;
    }

    /**
     * Analyze usability metrics
     */
    analyzeUsability() {
        const summary = this.data.summary;
        const insights = [];
        
        // SUS Score analysis
        if (summary.avg_sus_score < 68) {
            insights.push({
                type: 'warning',
                category: 'sus_score',
                message: `SUS score of ${summary.avg_sus_score.toFixed(0)} indicates below-average usability`,
                priority: 'high'
            });
        } else if (summary.avg_sus_score >= 80) {
            insights.push({
                type: 'success',
                category: 'sus_score',
                message: `Excellent SUS score of ${summary.avg_sus_score.toFixed(0)} indicates good usability`,
                priority: 'low'
            });
        }
        
        return insights;
    }

    /**
     * Analyze satisfaction metrics
     */
    analyzeSatisfaction() {
        const summary = this.data.summary;
        const insights = [];
        
        // Satisfaction analysis
        if (summary.avg_satisfaction < 3.5) {
            insights.push({
                type: 'warning',
                category: 'satisfaction',
                message: `Low satisfaction score of ${summary.avg_satisfaction.toFixed(1)}/5.0 needs attention`,
                priority: 'high'
            });
        } else if (summary.avg_satisfaction >= 4.0) {
            insights.push({
                type: 'success',
                category: 'satisfaction',
                message: `High satisfaction score of ${summary.avg_satisfaction.toFixed(1)}/5.0 is excellent`,
                priority: 'low'
            });
        }
        
        return insights;
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const scenarioStats = this.data.summary.scenario_stats || {};
        
        // Find scenarios with low completion rates
        Object.values(scenarioStats).forEach(scenario => {
            if (scenario.completion_rate < 70) {
                recommendations.push({
                    category: 'scenario_improvement',
                    priority: 'high',
                    scenario: scenario.name,
                    issue: `Low completion rate (${scenario.completion_rate.toFixed(1)}%)`,
                    recommendation: 'Review user flow and identify friction points'
                });
            }
            
            if (scenario.avg_time > 900) { // 15 minutes
                recommendations.push({
                    category: 'efficiency',
                    priority: 'medium',
                    scenario: scenario.name,
                    issue: `Long completion time (${(scenario.avg_time / 60).toFixed(1)} minutes)`,
                    recommendation: 'Simplify user interface and reduce steps'
                });
            }
        });
        
        return recommendations;
    }

    /**
     * Send analytics report via email
     */
    async sendReport(recipients, reportPath) {
        console.log('📧 Sending analytics report via email...');
        
        const transporter = nodemailer.createTransporter(config.email);
        
        const mailOptions = {
            from: config.email.auth.user,
            to: recipients.join(', '),
            subject: `Nakes Link User Testing Analytics Report - ${new Date().toLocaleDateString()}`,
            html: `
                <h2>Nakes Link User Testing Analytics Report</h2>
                <p>Please find the attached user testing analytics report.</p>
                
                <h3>Summary</h3>
                <ul>
                    <li><strong>Total Participants:</strong> ${this.data.summary.total_participants}</li>
                    <li><strong>Average Satisfaction:</strong> ${this.data.summary.avg_satisfaction.toFixed(1)}/5.0</li>
                    <li><strong>Average Completion Rate:</strong> ${this.data.summary.avg_completion_rate.toFixed(1)}%</li>
                    <li><strong>Average SUS Score:</strong> ${this.data.summary.avg_sus_score.toFixed(0)}/100</li>
                </ul>
                
                <p>For detailed analysis and recommendations, please review the attached report.</p>
                
                <p><em>Generated automatically by Nakes Link Analytics System</em></p>
            `,
            attachments: [{
                filename: path.basename(reportPath),
                path: reportPath
            }]
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Report sent successfully');
    }

    /**
     * Export data for dashboard
     */
    async exportDashboardData() {
        console.log('📊 Exporting dashboard data...');
        
        if (!this.data.feedback.length) {
            await this.collectData();
        }
        
        const dashboardData = {
            summary: this.data.summary,
            recent_feedback: this.data.feedback.slice(0, 10),
            scenario_performance: this.data.summary.scenario_stats,
            participant_breakdown: {
                total: this.data.summary.total_participants,
                patients: this.data.summary.patient_count,
                nakes: this.data.summary.nakes_count
            },
            trends: this.calculateTrends()
        };
        
        const filepath = path.join(config.output.directory, 'dashboard-data.json');
        await fs.writeFile(filepath, JSON.stringify(dashboardData, null, 2));
        
        console.log(`✅ Dashboard data exported: ${filepath}`);
        return dashboardData;
    }

    /**
     * Calculate trends for dashboard
     */
    calculateTrends() {
        // Group feedback by week
        const weeklyData = {};
        
        this.data.feedback.forEach(f => {
            const date = new Date(f.submitted_at);
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    satisfaction: [],
                    completion: [],
                    sus_scores: []
                };
            }
            
            weeklyData[weekKey].satisfaction.push(f.satisfaction_score || 0);
            weeklyData[weekKey].completion.push(f.task_completion_rate || 0);
            weeklyData[weekKey].sus_scores.push(f.sus_score || 0);
        });
        
        // Calculate weekly averages
        const trends = Object.keys(weeklyData).sort().map(week => {
            const data = weeklyData[week];
            return {
                week,
                avg_satisfaction: data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length,
                avg_completion: data.completion.reduce((a, b) => a + b, 0) / data.completion.length,
                avg_sus_score: data.sus_scores.reduce((a, b) => a + b, 0) / data.sus_scores.length
            };
        });
        
        return trends;
    }
}

// CLI Interface
if (require.main === module) {
    const analytics = new UserTestingAnalytics();
    const command = process.argv[2];
    const options = process.argv.slice(3);
    
    async function runCommand() {
        try {
            switch (command) {
                case 'collect':
                    await analytics.collectData();
                    break;
                    
                case 'report':
                    const format = options[0] || 'markdown';
                    const reportPath = await analytics.generateReport(format);
                    console.log(`📄 Report generated: ${reportPath}`);
                    break;
                    
                case 'insights':
                    const insights = await analytics.generateInsights();
                    console.log('🧠 Key Insights:');
                    insights.performance.forEach(insight => {
                        console.log(`  ${insight.type.toUpperCase()}: ${insight.message}`);
                    });
                    break;
                    
                case 'charts':
                    await analytics.generateCharts();
                    break;
                    
                case 'dashboard':
                    await analytics.exportDashboardData();
                    break;
                    
                case 'email':
                    const recipients = options[0] ? options[0].split(',') : ['admin@nakeslink.com'];
                    const reportFormat = options[1] || 'pdf';
                    const emailReportPath = await analytics.generateReport(reportFormat);
                    await analytics.sendReport(recipients, emailReportPath);
                    break;
                    
                default:
                    console.log(`
🏥 Nakes Link User Testing Analytics

Usage: node user-testing-analytics.js [command] [options]

Commands:
  collect              Collect analytics data from database
  report [format]      Generate report (markdown|json|csv|pdf)
  insights             Generate AI-powered insights
  charts               Generate analytics charts
  dashboard            Export data for dashboard
  email [emails] [fmt] Send report via email

Examples:
  node user-testing-analytics.js collect
  node user-testing-analytics.js report pdf
  node user-testing-analytics.js email admin@example.com,team@example.com pdf
  node user-testing-analytics.js insights
`);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
    
    runCommand();
}

module.exports = UserTestingAnalytics;