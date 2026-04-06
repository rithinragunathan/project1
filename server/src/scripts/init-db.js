const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('MYSQL_URL or DATABASE_URL is not defined in .env');
    process.exit(1);
}

// Manually parse the URL to extract connection details
// format: mysql://user:password@host:port/database
const urlMatches = dbUrl.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);

if (!urlMatches) {
    console.error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    process.exit(1);
}

const user = urlMatches[1];
const password = urlMatches[2];
const host = urlMatches[3];
const port = urlMatches[4];
const database = urlMatches[5];

async function init() {
    let connection;
    try {
        // Connect to MySQL server (no database selected) to create the DB
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
        });

        console.log(`Connected to MySQL at ${host}:${port}. Checking database "${database}"...`);

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        console.log(`Database "${database}" created or already exists.`);
        process.exit(0);

    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

init();
