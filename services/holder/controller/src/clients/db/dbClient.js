const mysql = require('mysql2/promise');

let dbConnection = null; // Singleton instance

async function connectToDatabase() {
    if (!dbConnection) {
        dbConnection = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
        console.log('Database connection established');
    }
    return dbConnection;
}

module.exports = { connectToDatabase };
