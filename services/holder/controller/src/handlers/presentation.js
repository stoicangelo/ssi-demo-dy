const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config');

async function listPendingPresentationRequestsHandler(req, res) {
    try {
        // Step 1: Fetch all presentation exchange records from ACA-Py Admin API
        const response = await acaPyClient.get(`${config.acapyAdminBase}/present-proof-2.0/records`);
        const presentationRecords = response?.data?.results || [];

        // Step 2: Filter records in the "request-received" state
        const filteredRequests = presentationRecords.filter(record => record.state === 'request-received');

        if (filteredRequests.length === 0) {
            return res.status(404).json({ message: 'No pending presentation requests in "request-received" state.' });
        }

        // Step 3: Transform records into the desired format
        const transformedRequests = filteredRequests.map(record => ({
            pres_ex_id: record.pres_ex_id,
            connection_id: record.connection_id,
            comment: record.pres_request?.comment || '',
            requested_attributes: record.by_format?.pres_request?.indy?.requested_attributes || {},
            request_predicates: record.by_format?.pres_request?.indy?.requested_predicates || {},
            created_at: record.created_at,
        }));

        // Step 4: Respond with the transformed data
        res.status(200).json(transformedRequests);
    } catch (error) {
        console.error('Error fetching pending presentation requests:', error.message);
        res.status(500).json({
            error: 'Failed to fetch pending presentation requests.',
            details: error.message,
        });
    }
}

async function sendProofHandler(req, res) {
    const { pres_ex_id, credential_id, attrs_to_reveal } = req.body;

    if (!pres_ex_id || !credential_id || !Array.isArray(attrs_to_reveal)) {
        return res.status(400).json({
            error: 'Missing required fields: pres_ex_id, credential_id, and attrs_to_reveal (array) are required.',
        });
    }

    try {
        // Step 1: Fetch the credential record using the credential_id
        const credentialResponse = await acaPyClient.get(`${config.acapyAdminBase}/credential/${credential_id}`);
        const credentialRecord = credentialResponse?.data;

        if (!credentialRecord) {
            return res.status(404).json({ error: 'Credential record not found.' });
        }

        const credentialAttributes = credentialRecord.attrs;

        // Step 2: Fetch the presentation exchange record
        const presExRecordResponse = await acaPyClient.get(`${config.acapyAdminBase}/present-proof-2.0/records/${pres_ex_id}`);
        const presExRecord = presExRecordResponse?.data;

        if (!presExRecord || presExRecord.state !== 'request-received') {
            return res.status(404).json({ error: 'Presentation exchange record not found or not in "request-received" state.' });
        }

        const { requested_attributes, requested_predicates } = presExRecord.by_format?.pres_request?.indy || {};

        if (!requested_attributes) {
            return res.status(400).json({ error: 'No requested attributes found in the proof request.' });
        }

        // Step 3: Build the requested_attributes and requested_predicates objects
        const indyRequestedAttributes = {};
        const indyRequestedPredicates = {};

        // Populate requested_attributes
        for (const [key, attr] of Object.entries(requested_attributes)) {
            indyRequestedAttributes[key] = {
                cred_id: credential_id,
                revealed: attrs_to_reveal.includes(attr.name),
            };
        }

        // Populate requested_predicates
        for (const [key] of Object.entries(requested_predicates || {})) {
            indyRequestedPredicates[key] = {
                cred_id: credential_id,
                timestamp: Math.floor(Date.now() / 1000), // Current timestamp
            };
        }

        // Step 4: Prepare the request body for the admin API
        const sendPresentationBody = {
            auto_remove: true,
            indy: {
                requested_attributes: indyRequestedAttributes,
                requested_predicates: indyRequestedPredicates,
                self_attested_attributes: {},
                trace: false,
            },
            trace: true,
        };

        // Step 5: Call the /send-presentation admin API
        const sendPresentationResponse = await acaPyClient.post(
            `${config.acapyAdminBase}/present-proof-2.0/records/${pres_ex_id}/send-presentation`,
            sendPresentationBody,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
        console.log("Presentation sent")
        console.log(sendPresentationResponse)


        // Step 6: Respond with the result
        res.status(200).json({
            message: 'Proof presentation sent successfully.'
        });
    } catch (error) {
        console.error('Error sending proof presentation:', error.message);

        if (error.status == 400) {
            res.status(500).json({
                error: 'Failed to send proof presentation.',
                details: error.response?.data || error.message,
            })
        }
        res.status(500).json({
            error: 'Failed to send proof presentation.',
            details:error.message,
        });
    }
}

module.exports = {
    listPendingPresentationRequestsHandler, sendProofHandler
};
