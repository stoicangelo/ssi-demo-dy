const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config');


async function fetchPublicDID() {
    try {
        const response = await acaPyClient.get(`${config.acapyAdminBase}/wallet/did/public`);
        return response?.data?.result || null;
    } catch (error) {
        console.error('Error fetching public DID:', error.message);
        return null;
    }
}

module.exports = { fetchPublicDID };
