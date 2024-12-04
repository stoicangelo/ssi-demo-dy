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

module.exports = {
    listCredentialsHandler,
};
