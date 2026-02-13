const express = require('express');
const router = express.Router();

const trashController = require('./trash.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/trash - List trashed items
router.get('/', trashController.list);

// DELETE /api/trash/empty - Empty trash
router.delete('/empty', trashController.emptyTrash);

// POST /api/trash/:type/:id/restore - Restore item
router.post('/:type/:id/restore', trashController.restore);

// DELETE /api/trash/:type/:id - Permanently delete item
router.delete('/:type/:id', trashController.permanentDelete);

module.exports = router;
