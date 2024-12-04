const axios = require('axios');
const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config')


function buildInvitationObject(decodedInvitation) {
    const parsedSRC = JSON.parse(decodedInvitation)
    var formedInvObj = {
        "@type": parsedSRC["@type"],
        "@id": parsedSRC["@id"],
        "handshake_protocols": parsedSRC.handshake_protocols,
        "services": parsedSRC.services
    }
    if(parsedSRC.label) {
        formedInvObj.label = parsedSRC.label
    }
    if(parsedSRC.g) {
        formedInvObj.goal = parsedSRC.goal
    }
    return formedInvObj
}
/**
 * Handler to create a connection invitation
 */
async function consumeConnectionInvitationHandler(req, res) {
    try {
        // Validate request body
        const { connection_invitation } = req.body;

        if (!connection_invitation) {
            return res.status(400).json({ error: 'Base64-encoded connection_invitation is required.' });
        }

        // Decode the base64-encoded invitation
        let invitationObject;
        try {
            const decodedInvitation = Buffer.from(connection_invitation, 'base64').toString();
            console.log(decodedInvitation)
            // invitationObject = JSON.parse(decodedInvitation);
            invitationObject = buildInvitationObject(decodedInvitation)
            console.log(invitationObject)
        } catch (decodeError) {
            return res.status(400).json({ error: 'Invalid base64-encoded invitation.' });
        }
        console.log("here")

        // Call the ACA-Py Admin API to process the invitation
        const response = await acaPyClient.post(config.acapyAdminBase+'/out-of-band/receive-invitation', invitationObject, {
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
        });
        console.log(response)

        // Extract the relevant result from the ACA-Py response
        const connectionId = response?.data?.connection_id;

        if (!connectionId) {
            return res.status(500).json({ error: 'Failed to process the invitation.' });
        }

        // Respond with the connection ID and success message
        res.status(200).json({
            message: 'Invitation processed successfully.',
            connection_id: connectionId,
        });
    } catch (error) {
        console.error('Error processing invitation:', error.message);

        // Handle specific errors from ACA-Py
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data });
        }

        // Generic error handling
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
        });
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
        res.status(200).json(transformedConnections );
    } catch (error) {
        console.error('Error fetching connections:', error.message);
        res.status(500).json({ message: 'Failed to fetch connections', error: error.message });
    }
};

module.exports = {
    consumeConnectionInvitationHandler,
    fetchAllConnectionsHandler,
};
