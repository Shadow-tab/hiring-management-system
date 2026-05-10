// ============================================================
// FILE: backend/db.js
// PURPOSE: Oracle database connection configuration
// HOW IT WORKS: 
//   - Loads credentials from .env file (never hardcoded)
//   - Creates a connection pool (think of it as a set of 
//     pre-made DB connections ready to use, faster than 
//     making a new connection every time)
//   - Exports getConnection() so any other file can use it
// ============================================================

const oracledb = require('oracledb');
require('dotenv').config();

// Thin mode = no Oracle Instant Client needed
// This works because your Oracle is in Docker locally

// How query results come back:
// BY DEFAULT oracledb returns arrays like [[1, 'Bilal'], [2, 'Zara']]
// This setting makes it return objects like [{id:1, name:'Bilal'}]
// Much easier to work with in JavaScript
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// The connection pool — created once when server starts
let pool;

// Initialize the pool
async function initialize() {
    try {
        pool = await oracledb.createPool({
            user:             process.env.DB_USER,
            password:         process.env.DB_PASSWORD,
            connectString:    process.env.DB_CONNECT_STRING,
            poolMin:          1,
            poolMax:          10,
            poolIncrement:    1,
            poolTimeout:      60,
            queueTimeout:     10000,   // fail fast after 10s instead of 60s
            poolPingInterval: 60
        });
        console.log('✅ Oracle connection pool created successfully');
    } catch (err) {
        console.error('❌ Failed to create Oracle connection pool:', err);
        process.exit(1); // stop the server if DB fails
    }
}

// Get a connection from the pool
// Used in every route handler in server.js
async function getConnection() {
    return await pool.getConnection();
}

// Close the pool gracefully when server shuts down
async function closePool() {
    try {
        await pool.close(10);
        console.log('Oracle pool closed.');
    } catch (err) {
        console.error('Error closing pool:', err);
    }
}

module.exports = { initialize, getConnection, closePool };