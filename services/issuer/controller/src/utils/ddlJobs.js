const dbClient = require('../clients/db/dbClient');

/**
 * Ensures the existence of the `credential_schemas` table.
 */
async function ensureCredentialSchemasTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS credential_schemas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            schema_id VARCHAR(255) NOT NULL,
            cred_def_id VARCHAR(255) NOT NULL,
            purpose TEXT,
            table_name VARCHAR(255) NOT NULL
        );
    `;

    try {
        const connection = await dbClient.getConnectionPool();
        await dbClient.withRetry(async () => await connection.query(query), 7);
        console.log('Ensured the `credential_schemas` table exists.');
    } catch (error) {
        console.error('Error ensuring `credential_schemas` table:', error.message);
        throw error;
    }
}

/**
 * Main function to check and prepare required data.
 */
async function checkPreparatoryData(pool) {
    try {
        console.log('Checking and preparing preparatory data...');
        await ensureCredentialSchemasTable(pool);
        console.log('Preparatory data checks complete.');
    } catch (error) {
        console.error('Error during preparatory data checks:', error.message);
        throw error;
    }
}

module.exports = {
    checkPreparatoryData,
};
