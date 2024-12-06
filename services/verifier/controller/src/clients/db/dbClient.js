const mysql = require('mysql2/promise');

// Singleton connection pool instance
let dbPool = null;

/**
 * Establish a connection pool to the database (Singleton initialization).
 */
async function connectToDatabase() {
    if (!dbPool) {
        dbPool = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
        console.log('Database connection pool established');
    }
    return dbPool;
}

/**
 * Get the initialized connection pool instance.
 * Ensures the connection pool is initialized before returning it.
 */
async function getConnectionPool() {
    if (!dbPool) {
        await connectToDatabase();
    }
    return dbPool;
}

async function withRetry(queryFunction, retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await queryFunction();
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.warn(`Retrying database query (${attempt}/${retries})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}


module.exports = { connectToDatabase, getConnectionPool, withRetry };
