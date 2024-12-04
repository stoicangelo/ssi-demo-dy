const express = require('express');
const {fetchPublicDIDHandler} = require('../handlers/publicDID');
const { requestProofHandler, getPresentationDetails, verifyPresentationHandler } = require('../handlers/presentation');
const { createConnectionInvitationHandler, fetchAllConnectionsHandler } = require('../handlers/connections');
 
const router = express.Router();

router.get('/did/fetch-public', fetchPublicDIDHandler);

router.post('/connections/one-time-invitation', createConnectionInvitationHandler);
router.get('/connections/fetch-all', fetchAllConnectionsHandler);

router.post('/presentation/request-proof', requestProofHandler);
router.get('/presentation/pending-verify/list', getPresentationDetails);
router.post('/presentation/verify/:presExId', verifyPresentationHandler);

module.exports = router;
