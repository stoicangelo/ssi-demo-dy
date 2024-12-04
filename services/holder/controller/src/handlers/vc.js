const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config');

async function listCredentialsHandler(req, res) {
    try {
        // Step 1: Call the ACA-Py Admin API to fetch credentials
        const response = await acaPyClient.get(`${config.acapyAdminBase}/credentials`);
        const credentials = response?.data?.results;

        if (!credentials || credentials.length === 0) {
            return res.status(404).json({ message: 'No credentials found.' });
        }

        // Step 2: Transform the credentials data to match the required response structure
        const transformedCredentials = credentials.map((credential) => ({
            credential: credential.attrs,
            credential_id: credential.referent,
            cred_def_id: credential.cred_def_id,
        }));

        // Step 3: Respond with the transformed credentials
        res.status(200).json(transformedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error.message);
        res.status(500).json({
            error: 'Failed to fetch credentials.',
            details: error.message,
        });
    }
}

async function satisfyProofListHandler(req, res) {
    const { presExId } = req.params;

    if (!presExId) {
        return res.status(400).json({ error: 'Presentation exchange ID is required.' });
    }

    try {
        // Step 1: Fetch the presentation exchange record by presExId
        const presExRecordResponse = await acaPyClient.get(`${config.acapyAdminBase}/present-proof-2.0/records/${presExId}`);
        const presExRecord = presExRecordResponse?.data;

        if (!presExRecord || presExRecord.state !== 'request-received') {
            return res.status(404).json({ error: 'Presentation exchange record not found or not in "request-received" state.' });
        }

        const { requested_attributes, requested_predicates } = presExRecord.by_format?.pres_request?.indy || {};

        // Step 2: Determine the restriction type and value from the first attribute
        let restrictionType, restrictionValue;
        for (const attrDetails of Object.values(requested_attributes || {})) {
            const restrictions = attrDetails.restrictions || [];
            if (restrictions.length > 0) {
                restrictionType = restrictions[0].schema_id ? 'schema_id' : 'cred_def_id';
                restrictionValue = restrictions[0][restrictionType];
                break; // Use the first restriction and stop
            }
        }

        if (!restrictionType || !restrictionValue) {
            return res.status(400).json({ error: 'No valid restrictions found in the presentation request.' });
        }

        // Step 3: Fetch credentials matching the restriction
        const credentialsResponse = await acaPyClient.get(`${config.acapyAdminBase}/credentials`, {
            params: {
                [restrictionType]: restrictionValue,
            },
        });
        const matchingCreds = credentialsResponse?.data?.results || [];

        // Step 4: Transform credentials into the desired format
        const transformedCredentials = matchingCreds.map((cred) => ({
            credential_id: cred.referent,
            attributes: cred.attrs,
            [restrictionType]: restrictionValue,
        }));

        // Step 5: Respond with the transformed data
        res.status(200).json(transformedCredentials);
    } catch (error) {
        console.error('Error satisfying proof request:', error.message);
        res.status(500).json({
            error: 'Failed to satisfy proof request.',
            details: error.message,
        });
    }
}
module.exports = {
    listCredentialsHandler,
    satisfyProofListHandler
};
