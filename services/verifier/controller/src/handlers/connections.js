const axios = require('axios');
const acaPyClient = require('../clients/agent/acaPyClient'); // A client to interact with the ACA-Py admin API
const config = require('../utils/env/config')


/**
 * Handler to create a connection invitation
 */
async function createConnectionInvitationHandler(req, res) {
    try {
        // Validate the request body
        const { connection_alias, label } = req.body;

        if (!connection_alias || !label) {
            return res.status(400).json({ error: 'Both connection_alias and label are required' });
        }

        // ACA-Py Admin API endpoint
        const adminApiUrl = `${process.env.ACA_PY_ADMIN_URL}/out-of-band/create-invitation`;

        // Prepare the request payload for ACA-Py
        const invitationRequestBody = {
            alias: connection_alias,
            handshake_protocols: [
                "https://didcomm.org/didexchange/1.0"
            ],
            my_label: label,
        };

        // Call ACA-Py Admin API
        const response = await acaPyClient.post(adminApiUrl, invitationRequestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Extract the invitation URL from the ACA-Py response
        const invitationUrl = response.data?.invitation_url;
        console.log(response.data)
        if (!invitationUrl) {
            return res.status(500).json({ error: 'Failed to retrieve the invitation URL' });
        }
        const urlObj = new URL(invitationUrl);
        // Get the value of the 'c_i' parameter
        const outOfBandValue = urlObj.searchParams.get('oob');

        // Respond with the invitation URL
        res.status(201).json({ connection_invitation: outOfBandValue });
    } catch (error) {
        console.error('Error creating connection invitation:', error.message);

        // Handle specific errors (e.g., network errors, ACA-Py errors)
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const fetchAllConnectionsHandler = async (req, res) => {
    try {
        // Fetch the connections from ACA-Py Admin API
        const response = await acaPyClient.get(`${config.acapyAdminBase}/connections?limit=100&offset=0`);
        const connections = response?.data?.results;

        // Check if connections data exists
        if (!connections || connections.length === 0) {
            return res.status(404).json({ message: 'No connections found in the agent' });
        }

        // Transform the response to include only the required subset
        const transformedConnections = connections.map((connection) => ({
            connection_id: connection.connection_id || '',
            invitation_msg_id: connection.invitation_msg_id || '',
            rp_label: connection.their_label || '',
            state: connection.state || '',
            rfc_state: connection.rfc23_state || '',
            created_at: connection.created_at || ''
        }));

        // Send the transformed response
        res.status(200).json(transformedConnections);
    } catch (error) {
        console.error('Error fetching connections:', error.message);
        res.status(500).json({ message: 'Failed to fetch connections', error: error.message });
    }
};

module.exports = {
    createConnectionInvitationHandler,
    fetchAllConnectionsHandler,
};
