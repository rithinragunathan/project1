const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Environmental Reporting API is running' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const issueRoutes = require('./routes/issueRoutes');
app.use('/api/issues', issueRoutes);

const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

async function runMigrations() {
    try {
        const conn = await pool.getConnection();

        // Drop legacy image_url column if it still exists
        try {
            await conn.query('ALTER TABLE issues DROP COLUMN image_url');
            console.log('[Migration] Removed old image_url column');
        } catch (e) {
            if (e.code !== 'ER_BAD_FIELD_ERROR' && e.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('[Migration] image_url already gone or table not ready');
            }
        }

        // Add image_data LONGBLOB column
        try {
            await conn.query('ALTER TABLE issues ADD COLUMN image_data LONGBLOB');
            console.log('[Migration] Added image_data column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('[Migration] image_data:', e.message);
        }

        // Add image_mime_type column
        try {
            await conn.query('ALTER TABLE issues ADD COLUMN image_mime_type VARCHAR(50)');
            console.log('[Migration] Added image_mime_type column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('[Migration] image_mime_type:', e.message);
        }

        conn.release();
    } catch (err) {
        console.error('[Migration] Failed:', err.message);
    }
}

// Serve static files in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await runMigrations();
});
