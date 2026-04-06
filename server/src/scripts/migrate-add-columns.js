const pool = require('../config/db');

async function migrateAddColumns() {
    try {
        const connection = await pool.getConnection();
        console.log('Running migration to add missing columns...');

        // Add remarks column if it doesn't exist
        try {
            await connection.query(`
                ALTER TABLE issues ADD COLUMN remarks TEXT;
            `);
            console.log('✓ Added remarks column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ remarks column already exists');
            } else {
                throw e;
            }
        }

        // Add is_escalated column if it doesn't exist
        try {
            await connection.query(`
                ALTER TABLE issues ADD COLUMN is_escalated BOOLEAN DEFAULT FALSE;
            `);
            console.log('✓ Added is_escalated column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ is_escalated column already exists');
            } else {
                throw e;
            }
        }

        connection.release();
        console.log('✓ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateAddColumns();
