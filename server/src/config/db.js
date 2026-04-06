const mysql = require('mysql2/promise');
require('dotenv').config();

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('MYSQL_URL or DATABASE_URL is not defined in .env');
    process.exit(1);
}

// Parse the database URL: mysql://user:password@host:port/database
const urlMatches = dbUrl.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);

if (!urlMatches) {
    console.error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    process.exit(1);
}

const config = {
    host: urlMatches[3],
    port: parseInt(urlMatches[4]),
    user: urlMatches[1],
    password: urlMatches[2],
    database: urlMatches[5],
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

const pool = mysql.createPool(config);

module.exports = pool;
