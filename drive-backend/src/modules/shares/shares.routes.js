const express = require('express');
const router = express.Router();

const sharesController = require('./shares.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Public access (no auth required)
router.get('/public/:token', sharesController.accessPublicShare);

// Protected routes
router.use(authenticate);

// POST /api/shares - Share with user
router.post('/', sharesController.shareWithUser);

// POST /api/shares/public - Create public link
router.post('/public', sharesController.createPublicLink);

// GET /api/shares/shared-with-me - List items shared with me
router.get('/shared-with-me', sharesController.sharedWithMe);

// GET /api/shares?resourceType=file&resourceId=xxx - List shares for resource
router.get('/', sharesController.listShares);

// DELETE /api/shares/:id - Revoke share
router.delete('/:id', sharesController.revokeShare);

module.exports = router;
