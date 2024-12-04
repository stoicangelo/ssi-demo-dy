const acaPyClient = require('../clients/agent/acaPyClient');
const dbClient = require('../clients/db/dbClient');
const config = require('../utils/env/config');
const txtProcessing = require('../utils/txtProcessing');


async function registerSchemaHandler(req, res) {
    const { schema_uname, uattributes, pk_attr, purpose } = req.body;

    if (!schema_uname || !uattributes || !pk_attr || !purpose) {
        return res.status(400).json({ error: 'All fields (schema_uname, uattributes, pk_attr, purpose) are required.' });
    }

    try {
        // Step 1: Convert schema_uname to snake_case in lowercase
        const snakeCaseUname = txtProcessing.toSnakeCase(schema_uname);
        const camelCaseUname = txtProcessing.toCamelCase(schema_uname);

        // Step 2: Post schema to ACA-Py Admin API
        const schemaBody = {
            schema_name: camelCaseUname,
            schema_version: "1.0",
            attributes: uattributes,
        };

        const schemaResponse = await acaPyClient.post(config.acapyAdminBase+'/schemas', schemaBody, {
            headers: { 'Content-Type': 'application/json' },
        });
        const schemaId = schemaResponse?.data?.sent?.schema_id;
        if (!schemaId) {
            throw new Error('Failed to register schema on the ledger.');
        }
        console.log(`registered a schema on ledger. Schema ID: ${schemaId}`)

        // Step 3: Post credential definition to ACA-Py Admin API
        const credDefBody = {
            schema_id: schemaId,
            support_revocation: false,
            tag: camelCaseUname,
        };

        const credDefResponse = await acaPyClient.post(config.acapyAdminBase+'/credential-definitions', credDefBody, {
            headers: { 'Content-Type': 'application/json' },
        });

        const credDefId = credDefResponse?.data?.sent?.credential_definition_id;
        if (!credDefId) {
            throw new Error('Failed to register credential definition on the ledger.');
        }
        console.log(`registered a credential definition against schema to ledger. Cred def ID: ${credDefId}`)
        
        // const schemaId = "schemaid";
        // const credDefId = "cred_def_id";


        // Step 4: Create table for schema
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${snakeCaseUname}_records (
                ${pk_attr} VARCHAR(255) PRIMARY KEY,
                ${uattributes.filter(attr => attr !== pk_attr).map(attr => `${attr} TEXT`).join(', ')}
            );
        `;
        // console.log(`Now creating new table with the following query : `+createTableQuery)
        const connection = await dbClient.getConnectionPool();
        await connection.query(createTableQuery);
        console.log(`created a new table - ${snakeCaseUname}_records`)

        // Step 5: Insert into `credential_schemas` table
        const insertQuery = `
            INSERT INTO credential_schemas (id, schema_id, cred_def_id, purpose, table_name)
            VALUES (?, ?, ?, ?, ?)
        `;
        const uniqueId = Date.now() % 2147483646; //since the max +ve range for INT in mysql is such
        await connection.execute(insertQuery, [uniqueId, schemaId, credDefId, purpose, `${snakeCaseUname}_records`]);
        console.log("Inserted all vs schema related details with table name is credential_records tabl")

        // Step 6: Respond with success
        res.status(200).json({
            message: 'Schema and credential definition registered successfully.',
            schema_id: schemaId,
            credential_definition_id: credDefId,
            schema_record_id: uniqueId
        });
    } catch (error) {
        console.error('Error registering new vc schema and cred_def :', error.message);
        res.status(500).json({ message: 'Failed to register new vc schema ', error: error.message });
    }
}

module.exports = {
    registerSchemaHandler,
};