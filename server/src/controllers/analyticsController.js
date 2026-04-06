const pool = require('../config/db');

const getAnalytics = async (req, res) => {
    try {
        // Total stats
        const [totalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_issues,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_issues,
                SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned_issues,
                SUM(CASE WHEN is_escalated = 1 THEN 1 ELSE 0 END) as escalated_issues
            FROM issues
        `);

        // Stats by category
        const [categoryStats] = await pool.query(`
            SELECT category, COUNT(*) as count 
            FROM issues 
            GROUP BY category
        `);

        // Recent activity (optional, using audit logs if implemented or just recent issues)
        const [recentIssues] = await pool.query(`
            SELECT id, title, status, created_at 
            FROM issues 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.json({
            summary: totalStats[0],
            byCategory: categoryStats,
            recentActivity: recentIssues
        });

    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAnalytics };
