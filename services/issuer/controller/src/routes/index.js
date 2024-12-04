const express = require('express');
const {fetchPublicDIDHandler} = require('../handlers/publicDID');
const { registerSchemaHandler } = require('../handlers/vc');
const { createConnectionInvitationHandler, fetchAllConnectionsHandler } = require('../handlers/connections');
const { addRecordHandler, deleteRecordHandler } = require('../handlers/records')
const { listCategoriesHandler } = require('../handlers/categories')
const { listPublicCategoriesHandler, getSchemaDetailsHandler, requestIssuanceHandler } = require('../handlers/open');
 
const router = express.Router();

router.get('/did/fetch-public', fetchPublicDIDHandler);

router.post('/connections/one-time-invitation', createConnectionInvitationHandler);
router.get('/connections/fetch-all', fetchAllConnectionsHandler);

router.post('/vc/register-schema', registerSchemaHandler)

router.get('/records/category/list', listCategoriesHandler)
router.put('/records/add/:categoryId', addRecordHandler)
router.delete('/records/remove/:categoryId/:uid', deleteRecordHandler)

router.get('/open/category/list', listPublicCategoriesHandler)
router.get('/open/vc/schema/:categoryId', getSchemaDetailsHandler)
router.post('/open/vc/request-issuance/:categoryId', requestIssuanceHandler)

module.exports = router;
