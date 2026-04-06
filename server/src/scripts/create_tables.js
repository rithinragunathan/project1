const pool = require('../config/db');

async function createTables() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to database to create tables...');

        // Users Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('citizen', 'staff', 'admin') DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
        console.log('Users table created/verified.');

        // Issues Table
        // Using POINT for location (latitude, longitude)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        location POINT NOT NULL,
        status ENUM('Open', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
        image_url VARCHAR(255),
        remarks TEXT,
        is_escalated BOOLEAN DEFAULT FALSE,
        user_id INT,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        SPATIAL INDEX(location)
      );
    `);
        console.log('Issues table created/verified.');

        // Audit Logs Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        user_id INT,
        issue_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
      );
    `);
        console.log('Audit Logs table created/verified.');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
}

createTables();
