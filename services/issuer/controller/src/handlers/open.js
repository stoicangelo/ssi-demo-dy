const { fetchCredentialSchemas } = require("../common/category");
const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config')
const dbClient = require('../clients/db/dbClient')
const { fetchPublicDID } = require('../common/did');

async function requestIssuanceHandler(req, res) {
    const { categoryId } = req.params;
    const { uid, inv_msg_id, comment } = req.body;

    if (!categoryId || !uid || !inv_msg_id || !comment) {
        return res.status(400).json({ error: 'Category ID, uid, inv_msg_id, and comment are required.' });
    }

    try {
        // Step 1: Fetch the schema details and table name
        const connection = await dbClient.getConnectionPool();
        const [schemaResults] = await connection.query(
            `SELECT schema_id, cred_def_id, table_name 
             FROM credential_schemas 
             WHERE id = ?`,
            [categoryId]
        );

        if (schemaResults.length === 0) {
            return res.status(404).json({ error: 'Schema not found for the provided category ID.' });
        }

        const { schema_id: schemaId, cred_def_id: credDefId, table_name: tableName } = schemaResults[0];
        console.log(`Pulling vc record from ${tableName}`)

         // Step 2: Fetch the primary key column of the table
         const [primaryKeyResults] = await connection.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
            [tableName, process.env.DB_NAME]
        );

        if (primaryKeyResults.length === 0) {
            return res.status(500).json({ error: `No primary key found for table: ${tableName}` });
        }

        const pkColumn = primaryKeyResults[0].COLUMN_NAME;

        // Step 3: Fetch the record using the UID and the PK column
        const [recordResults] = await connection.query(
            `SELECT * FROM ${tableName} WHERE ${pkColumn} = ?`,
            [uid]
        );

        if (recordResults.length === 0) {
            return res.status(404).json({
                error: `Record with UID: ${uid} not found in table: ${tableName}.`,
            });
        }

        const record = recordResults[0];
        console.log(`Now issuing with data : ${JSON.stringify(record)}`)
        

        // Step 3: Fetch all connections and find the one matching the `inv_msg_id`
        const connectionsResponse = await acaPyClient.get(`${config.acapyAdminBase}/connections`);
        const connections = connectionsResponse?.data?.results || [];
        const conn = connections.find(conn => conn.invitation_msg_id === inv_msg_id);

        if (!conn) {
            return res.status(404).json({
                error: `No connection found for invitation message ID: ${inv_msg_id}`,
            });
        }

        // Step 4: Validate the RFC23 state of the connection
        if (conn.rfc23_state !== 'completed') {
            return res.status(400).json({
                error: `Connection is not in a completed state. Current state: ${connection.rfc23_state}`,
            });
        }

        const connId = conn.connection_id;
        console.log(`Issuing to connection : ${connId}`)

        // Step 5: Fetch the public DID
        const issuerDID = await fetchPublicDID();
        if (!issuerDID) {
            return res.status(500).json({ error: 'Issuer public DID could not be retrieved.' });
        }
        console.log(`Issuing Public DID : ${issuerDID.did}`)

        // Step 6: Prepare the credential preview
        const credentialPreviewAttributes = Object.entries(record).map(([key, value]) => ({
            'mime-type': 'text/plain',
            name: key,
            value,
        }));

        // Step 7: Construct the request body for the send-offer admin API
        const offerRequestBody = {
            auto_issue: true,
            auto_remove: true,
            comment,
            connection_id: connId,
            credential_preview: {
                '@type': 'issue-credential/2.0/credential-preview',
                attributes: credentialPreviewAttributes,
            },
            filter: {
                indy: {
                    cred_def_id: credDefId,
                    issuer_did: issuerDID.did,
                },
            },
        };

        // Step 8: Call the ACA-Py Admin API to send the credential offer
        const response = await acaPyClient.post(
            `${config.acapyAdminBase}/issue-credential-2.0/send-offer`,
            offerRequestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log("credentail offer sent by issuer")

        // Step 9: Respond with success
        res.status(200).json({
            message: 'Credential issuance request sent successfully.',
            offer_response: response.data,
        });
    } catch (error) {
        console.error('Error processing credential issuance request:', error.message);
        res.status(500).json({
            error: 'Failed to process credential issuance request.',
            details: error.message,
        });
    }
}
async function listPublicCategoriesHandler(req, res) {
    try {
        const credentialSchemas = await fetchCredentialSchemas(true); // true coz only public accessible subset view 
        if (credentialSchemas.length === 0) {
            return res.status(404).json({ message: 'No credential schemas found.' });
        }
        res.status(200).json(credentialSchemas);
    } catch (error) {
        console.error('Error fetching public credential schema list:', error.message);
        res.status(500).json({ error: 'Failed to fetch public credential schema list.', details: error.message });
    }
}


async function getSchemaDetailsHandler(req, res) {
    const { categoryId } = req.params;

    if (!categoryId) {
        return res.status(400).json({ error: 'Category ID is required.' });
    }

    try {
        // Step 1: Fetch the schema ID and table name from the database
        const connection = await dbClient.getConnectionPool();
        const [schemaResults] = await connection.query(
            `SELECT schema_id, table_name 
             FROM credential_schemas 
             WHERE id = ?`,
            [categoryId]
        );

        if (schemaResults.length === 0) {
            return res.status(404).json({ error: 'Schema not found for the provided category ID.' });
        }

        const { schema_id: schemaId, table_name: tableName, cred_def_id: credDefId } = schemaResults[0];
        // const schemaId = "WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0"

        // Step 2: Query the ACA-Py Admin API for schema details
        const schemaResponse = await acaPyClient.get(`${config.acapyAdminBase}/schemas/${schemaId}`);
        const schemaData = schemaResponse?.data?.schema;
        console.log(schemaResponse)
        if (!schemaData) {
            throw new Error('Failed to fetch schema details from ACA-Py.');
        }

        // Step 3: Fetch the primary key (uattr) for the table
        const [primaryKeyResults] = await connection.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
             WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
            [tableName, process.env.DB_NAME]
        );

        const uattr = primaryKeyResults.length > 0 ? primaryKeyResults[0].COLUMN_NAME : null;

        // Step 4: Construct the response
        const response = {
            schema_id: schemaId,
            attributes: schemaData.attrNames || [],
            uattr,
            cred_def_id: credDefId,
        };

        // Step 5: Send the response
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching schema details:', error.message);
        if (error.status == 404) {
        res.status(500).json({ error: 'Schema not found on ledger', details: error.message });

        }
        res.status(500).json({ error: 'Failed to fetch schema details.', details: error.message });
    }
}
module.exports = { listPublicCategoriesHandler , getSchemaDetailsHandler, requestIssuanceHandler };