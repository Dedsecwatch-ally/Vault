const express = require('express');
const router = express.Router();

const foldersController = require('./folders.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// POST /api/folders - Create folder
router.post('/', foldersController.create);

// GET /api/folders - List folders
router.get('/', foldersController.list);

// GET /api/folders/:id - Get folder
router.get('/:id', foldersController.getOne);

// GET /api/folders/:id/contents - Get folder contents (files + subfolders)
router.get('/:id/contents', foldersController.getContents);

// PATCH /api/folders/:id - Update folder
router.patch('/:id', foldersController.update);

// POST /api/folders/:id/move - Move folder
router.post('/:id/move', foldersController.move);

// DELETE /api/folders/:id - Delete folder
router.delete('/:id', foldersController.deleteFolder);

module.exports = router;
