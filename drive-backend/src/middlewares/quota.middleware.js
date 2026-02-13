const quotaService = require('../services/quota.service');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check quota before file upload
 * Must be placed AFTER multer middleware
 */
const checkQuota = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const hasSpace = await quotaService.hasAvailableStorage(
            req.user.id,
            req.file.size
        );

        if (!hasSpace) {
            // Delete the uploaded file since we're rejecting
            const fs = require('fs').promises;
            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                // Ignore unlink errors
            }

            throw ApiError.badRequest(
                'Storage quota exceeded. Please delete some files or upgrade your plan.'
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Pre-upload quota check (before file is uploaded)
 * Checks Content-Length header
 */
const preCheckQuota = async (req, res, next) => {
    try {
        const contentLength = parseInt(req.headers['content-length'], 10);

        if (contentLength && contentLength > 0) {
            const hasSpace = await quotaService.hasAvailableStorage(
                req.user.id,
                contentLength
            );

            if (!hasSpace) {
                throw ApiError.badRequest(
                    'Storage quota exceeded. Please delete some files or upgrade your plan.'
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { checkQuota, preCheckQuota };
