const pool = require('../config/db');

async function migrateAddImageBlob() {
    try {
        const connection = await pool.getConnection();
        console.log('Running migration to add image_data BLOB column...');

        // Replace image_url with image_data BLOB column
        try {
            // First, drop the old image_url column if it exists
            await connection.query(`
                ALTER TABLE issues DROP COLUMN image_url;
            `);
            console.log('✓ Removed old image_url column');
        } catch (e) {
            if (e.code === 'ER_BAD_FIELD_ERROR' || e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('ℹ image_url column doesn\'t exist (this is fine on fresh install)');
            } else {
                console.log('⚠ Skipping drop:', e.message.substring(0, 50));
            }
        }

        // Now add the image_data BLOB column
        try {
            await connection.query(`
                ALTER TABLE issues ADD COLUMN image_data LONGBLOB;
            `);
            console.log('✓ Added image_data BLOB column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ image_data column already exists');
            } else {
                throw e;
            }
        }

        // Add image_mime_type to store the file type
        try {
            await connection.query(`
                ALTER TABLE issues ADD COLUMN image_mime_type VARCHAR(50);
            `);
            console.log('✓ Added image_mime_type column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ image_mime_type column already exists');
            } else {
                throw e;
            }
        }

        connection.release();
        console.log('✓ Migration completed successfully');
        console.log('All images are now stored in the database as BLOB data');
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateAddImageBlob();
