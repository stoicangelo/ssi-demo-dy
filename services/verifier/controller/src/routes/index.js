const express = require('express');
const {fetchPublicDIDHandler} = require('../handlers/publicDID');
const { createConnectionInvitationHandler, fetchAllConnectionsHandler } = require('../handlers/connections');
 
const router = express.Router();

router.get('/did/fetch-public', fetchPublicDIDHandler);

router.post('/connections/one-time-invitation', createConnectionInvitationHandler);
router.get('/connections/fetch-all', fetchAllConnectionsHandler);

module.exports = router;
