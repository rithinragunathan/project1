const pool = require('../config/db');

const createIssue = async (req, res) => {
    const { title, description, category, latitude, longitude, priority } = req.body;
    const userId = req.user.id;
    const imageBuffer = req.file ? req.file.buffer : null;
    const imageMimeType = req.file ? req.file.mimetype : null;

    try {
        // Parse latitude and longitude as floats for validation
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: 'Invalid latitude or longitude' });
        }

        const query = `
            INSERT INTO issues (title, description, category, location, priority, image_data, image_mime_type, user_id)
            VALUES (?, ?, ?, ST_GeomFromText(?), ?, ?, ?, ?)
        `;
        const point = `POINT(${lng} ${lat})`;
        
        const [result] = await pool.query(query, [
            title, description, category, point, priority || 'Low', imageBuffer, imageMimeType, userId
        ]);
        
        res.status(201).json({ message: 'Issue reported successfully', issueId: result.insertId });
    } catch (error) {
        console.error('createIssue error:', error.message);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getIssues = async (req, res) => {
    try {
        const query = `
            SELECT id, title, description, category, status, priority, created_at, remarks, is_escalated,
            CAST(ST_X(location) AS DECIMAL(10,6)) as longitude, 
            CAST(ST_Y(location) AS DECIMAL(10,6)) as latitude, 
            user_id,
            CASE WHEN image_data IS NOT NULL THEN true ELSE false END as has_image
            FROM issues
            ORDER BY created_at DESC
        `;
        
        const [issues] = await pool.query(query);
        res.json(issues);
    } catch (error) {
        console.error('getIssues error:', error.message);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const updateIssueStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    try {
        let query = 'UPDATE issues SET status = ?';
        const params = [status];

        if (remarks !== undefined && remarks !== '') {
            query += ', remarks = ?';
            params.push(remarks);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'Issue status updated' });
    } catch (error) {
        console.error('updateIssueStatus error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const escalateIssue = async (req, res) => {
    const { id } = req.params;

    try {
        // Check the issue exists first
        const [rows] = await pool.query('SELECT id, is_escalated FROM issues WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        if (rows[0].is_escalated) {
            return res.status(400).json({ message: 'Issue is already escalated' });
        }

        await pool.query('UPDATE issues SET is_escalated = 1 WHERE id = ?', [id]);
        res.json({ message: 'Issue escalated successfully' });
    } catch (error) {
        console.error('escalateIssue error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getIssueImage = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT image_data, image_mime_type FROM issues WHERE id = ?', [id]);
        
        if (rows.length === 0 || !rows[0].image_data) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const imageData = rows[0].image_data;
        const mimeType = rows[0].image_mime_type || 'image/jpeg';

        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(imageData);
    } catch (error) {
        console.error('getIssueImage error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = { createIssue, getIssues, updateIssueStatus, escalateIssue, getIssueImage };
