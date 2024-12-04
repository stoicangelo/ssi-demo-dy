const express = require('express');
const { consumeConnectionInvitationHandler, fetchAllConnectionsHandler } = require('../handlers/connections');
const { listCredentialsHandler, satisfyProofListHandler } = require('../handlers/vc');
const { listPendingPresentationRequestsHandler, sendProofHandler } = require('../handlers/presentation');

const router = express.Router();

// router.get('/did/fetch-public', fetchPublicDID);

router.post('/connections/consume-invitation', consumeConnectionInvitationHandler);
router.get('/connections/fetch-all', fetchAllConnectionsHandler);

router.get('/vc/list', listCredentialsHandler);
router.get('/vc/satisfy-proof/:presExId/list', satisfyProofListHandler);

router.get('/presentation/pending-requests/list', listPendingPresentationRequestsHandler);
router.post('/presentation/send-proof', sendProofHandler);

module.exports = router;
