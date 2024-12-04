const dbClient = require('../clients/db/dbClient');

/**
 * Fetch credential schema records and their metadata.
 * @param {boolean} isPublicView - If true, return a public subset of the data.
 * @returns {Promise<Array>} The list of credential schema records.
 */
async function fetchCredentialSchemas(isPublicView = false) {
    const connection = await dbClient.getConnectionPool();

    // Step 1: Fetch all credential schemas
    const [schemas] = await connection.query(
        `SELECT id AS categoryId, purpose, table_name FROM credential_schemas`
    );

    if (schemas.length === 0) {
        return [];
    }

    

    // Step 3: Filter data based on view type
    if (isPublicView) {
        return schemas.map(({ categoryId, purpose, uattr }) => ({
            categoryId,
            purpose,
            uattr,
        }));
    } else {
        // Enrich with primary key only if not public view

        for (const schema of schemas) {
            const { table_name: tableName } = schema;
    
            // Fetch primary key column name
            const [primaryKeyResults] = await connection.query(
                `SELECT COLUMN_NAME
                 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
                [tableName, process.env.DB_NAME]
            );
    
            schema.uattr = primaryKeyResults.length > 0 ? primaryKeyResults[0].COLUMN_NAME : null;
        }
    }

    return schemas; // Full data for internal use
}

module.exports = { fetchCredentialSchemas }