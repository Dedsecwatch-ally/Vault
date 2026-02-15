const filesService = require('./files.service');
const ApiError = require('../../utils/ApiError');

/**
 * Upload file
 * POST /api/files/upload
 */
const upload = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            throw ApiError.badRequest('No files uploaded');
        }

        const { folderId } = req.body;
        const uploadedFiles = [];

        // Process each file
        for (const fileData of req.files) {
            const file = await filesService.uploadFile(fileData, req.user.id, { folderId });
            uploadedFiles.push(file);
        }

        res.status(201).json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: { files: uploadedFiles },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List user files
 * GET /api/files
 */
const list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const folderId = req.query.folderId;

        const result = await filesService.listFiles(req.user.id, { folderId, page, limit });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get file metadata
 * GET /api/files/:id
 */
const getOne = async (req, res, next) => {
    try {
        const file = await filesService.getFile(req.params.id, req.user.id);

        res.json({
            success: true,
            data: { file },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download file
 * GET /api/files/:id/download
 */
const download = async (req, res, next) => {
    try {
        const fileData = await filesService.getFileForDownload(req.params.id, req.user.id);

        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
        res.setHeader('Content-Length', fileData.buffer.length);

        res.send(fileData.buffer);
    } catch (error) {
        console.error('Download error:', error.message, error.stack);
        next(error);
    }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res, next) => {
    try {
        const result = await filesService.deleteFile(req.params.id, req.user.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get file versions
 * GET /api/files/:id/versions
 */
const getVersions = async (req, res, next) => {
    try {
        const versions = await filesService.getVersions(req.params.id, req.user.id);

        res.json({
            success: true,
            data: { versions },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Restore file version
 * POST /api/files/:id/versions/:versionId/restore
 */
const restoreVersion = async (req, res, next) => {
    try {
        const file = await filesService.restoreVersion(
            req.params.id,
            req.params.versionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Version restored successfully',
            data: { file },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Move file
 * POST /api/files/:id/move
 */
const moveFile = async (req, res, next) => {
    try {
        const { folderId } = req.body;
        const file = await filesService.moveFile(req.params.id, req.user.id, { folderId });

        res.json({
            success: true,
            message: 'File moved successfully',
            data: { file },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, list, getOne, download, deleteFile, getVersions, restoreVersion, moveFile };
