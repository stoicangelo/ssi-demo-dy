const axios = require('axios'); // For publishing DID to the ledger
const config = require('../utils/env/config');
const acaPyClient = require('../clients/agent/acaPyClient'); // A client to interact with the ACA-Py admin API
const { fetchPublicDID } = require('../common/did');

async function ensurePublicDid() {
    try {
        // Get all public DIDs
        const response = await acaPyClient.get(config.acapyAdminBase+ '/wallet/did/public');
        if (response.data && response.data.result) {
            console.log('Public DID already exists:', response.data.result.did);
            return response.data.result.did; // Return existing public DID
        }

        console.log('No public DID found. Creating a new one.');

        // Create a local DID
        const newDidResponse = await acaPyClient.post(config.acapyAdminBase+'/wallet/did/create', { method: 'sov' });
        const { did, verkey } = newDidResponse.data.result;
        console.log('New DID created:', did);

        // Publish the DID to the ledger
        const ledgerResponse = await axios.post(`${config.indyLedgerUrl}/register`, {
            did,
            verkey,
        });
        if (ledgerResponse.status !== 200) {
            throw new Error('Failed to publish DID to the ledger');
        }
        console.log('DID published to the ledger:', did);

        // Assign the DID as public for wallet
        await acaPyClient.post(config.acapyAdminBase+ '/wallet/did/public?did='+did);
        console.log('DID assigned as public:', did);

        return did;
    } catch (error) {
        console.error('Error ensuring public DID:', error);
        throw error;
    }
}

const fetchPublicDIDHandler = async (req, res) => {
    try {
      // fetch the public DID from admin API
      const publicDID = await fetchPublicDID();
  
      if (!publicDID) {
        return res.status(404).json({ message: 'No public DID assigned to the wallet' });
      }
  
      res.status(200).json({ 
        did: publicDID.did,
        method: publicDID.method
     });
    } catch (error) {
      console.error('Error fetching public DID:', error);
      res.status(500).json({ message: 'Failed to fetch public DID', error: error.message });
    }
  };
    

module.exports = { ensurePublicDid, fetchPublicDIDHandler };
