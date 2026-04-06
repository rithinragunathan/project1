const pool = require('../config/db');

const runMigration = async () => {
    try {
        console.log('Running migration...');

        // Add remarks column
        try {
            await pool.query("ALTER TABLE issues ADD COLUMN remarks TEXT");
            console.log('Added remarks column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('remarks column already exists');
            else console.error(e);
        }

        // Add is_escalated column
        try {
            await pool.query("ALTER TABLE issues ADD COLUMN is_escalated BOOLEAN DEFAULT FALSE");
            console.log('Added is_escalated column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('is_escalated column already exists');
            else console.error(e);
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
