const dbClient = require('../clients/db/dbClient');

async function addRecordHandler(req, res) {
    const { categoryId } = req.params; // The primary key of the credential_schemas table
    console.log(categoryId)
    const recordData = req.body; // The record data to insert

    if (!categoryId) {
        return res.status(400).json({ error: 'Category ID is required.' });
    }

    try {
        // Step 1: Fetch the schema information
        const connection = await dbClient.getConnectionPool();
        const [schemaResults] = await connection.query(
            `SELECT table_name FROM credential_schemas WHERE id = ?`,
            [categoryId]
        );

        if (schemaResults.length === 0) {
            return res.status(404).json({ error: 'Schema not found for the provided category ID.' });
        }

        const { table_name: tableName } = schemaResults[0];

        // Step 2: Fetch the table's column names
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?`,
            [tableName, process.env.DB_NAME]
        );

        const columnNames = columns.map((col) => col.COLUMN_NAME);

        // Step 3: Validate request body
        const missingColumns = columnNames.filter(
            (col) => !(col in recordData) && col !== 'id'
        ); // Exclude 'id' from validation

        if (missingColumns.length > 0) {
            return res.status(400).json({
                error: 'Missing required attributes in request body.',
                missing_columns: missingColumns,
            });
        }

        // Step 4: Insert the record into the table
        const insertColumns = columnNames.filter((col) => col !== 'id'); // Exclude 'id' from insertion
        const insertValues = insertColumns.map((col) => recordData[col]);

        const insertQuery = `
            INSERT INTO ${tableName} (${insertColumns.join(', ')})
            VALUES (${insertColumns.map(() => '?').join(', ')})
        `;

        await connection.query(insertQuery, insertValues);

        // Step 5: Respond with success
        res.status(201).json({
            message: 'Record added successfully.',
            table_name: tableName,
            inserted_record: recordData,
        });
    } catch (error) {
        console.error('Error adding record:', error.message);
        res.status(500).json({ error: 'Failed to add record.', details: error.message });
    }
}

async function deleteRecordHandler(req, res) {
    const { categoryId, uid } = req.params;

    if (!categoryId || !uid) {
        return res.status(400).json({ error: 'Category ID and UID are required.' });
    }

    try {
        // Step 1: Fetch the schema information
        const connection = await dbClient.getConnectionPool();
        const [schemaResults] = await connection.query(
            `SELECT table_name FROM credential_schemas WHERE id = ?`,
            [categoryId]
        );

        if (schemaResults.length === 0) {
            return res.status(404).json({ error: 'Schema not found for the provided category ID.' });
        }

        const { table_name: tableName } = schemaResults[0];
        console.log(`Entry to be removed from table : ${tableName}`)

        // Step 2: Fetch the primary key column dynamically
        const [primaryKeyResults] = await connection.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
             WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
            [tableName, process.env.DB_NAME]
        );

        if (primaryKeyResults.length === 0) {
            return res.status(500).json({ error: `No primary key found for table: ${tableName}` });
        }

        const primaryKey = primaryKeyResults[0].COLUMN_NAME;
        console.log(`Removing record with ${primaryKey}=${uid}`)

        // Step 3: Delete the record
        const deleteQuery = `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`;
        const [deleteResult] = await connection.query(deleteQuery, [uid]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({
                error: `No record found with ${primaryKey} = ${uid} in table: ${tableName}`,
            });
        }
        console.log("Deleted record!")

        // Step 4: Respond with success
        res.status(200).json({
            message: `Record with ${primaryKey} = ${uid} successfully deleted from ${tableName}.`,
        });
    } catch (error) {
        console.error('Error deleting record:', error.message);
        res.status(500).json({ error: 'Failed to delete record.', details: error.message });
    }
}

module.exports = {
    addRecordHandler, deleteRecordHandler
};
