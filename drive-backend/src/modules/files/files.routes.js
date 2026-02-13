const express = require('express');
const router = express.Router();

const filesController = require('./files.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const upload = require('../../config/storage');

// All routes require authentication
router.use(authenticate);

// POST /api/files/upload - Upload files
router.post('/upload', upload.array('files', 10), filesController.upload);

// GET /api/files - List user's files
router.get('/', filesController.list);

// GET /api/files/:id - Get file metadata
router.get('/:id', filesController.getOne);

// GET /api/files/:id/download - Download file
router.get('/:id/download', filesController.download);

// GET /api/files/:id/versions - Get file versions
router.get('/:id/versions', filesController.getVersions);

// POST /api/files/:id/versions/:versionId/restore - Restore version
router.post('/:id/versions/:versionId/restore', filesController.restoreVersion);

// POST /api/files/:id/move - Move file to folder
router.post('/:id/move', filesController.moveFile);

// DELETE /api/files/:id - Delete file
router.delete('/:id', filesController.deleteFile);

module.exports = router;
