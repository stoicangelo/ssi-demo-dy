const express = require('express');
const { consumeConnectionInvitationHandler, fetchAllConnectionsHandler } = require('../handlers/connections');
const { listCredentialsHandler } = require('../handlers/vc');

const router = express.Router();

// router.get('/did/fetch-public', fetchPublicDID);

router.post('/connections/consume-invitation', consumeConnectionInvitationHandler);
router.get('/connections/fetch-all', fetchAllConnectionsHandler);

router.get('/vc/list', listCredentialsHandler);


module.exports = router;
