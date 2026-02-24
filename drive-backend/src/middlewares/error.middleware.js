const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const multer = require('multer');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Multer errors (file upload limits, etc.)
    if (err instanceof multer.MulterError) {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large. Maximum upload size exceeded.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files. Maximum 10 files per upload.';
        } else {
            message = `Upload error: ${err.message}`;
        }
    }

    // Log error
    if (statusCode >= 500) {
        logger.error(err);
    } else {
        logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
    }

    // Build response
    const response = {
        success: false,
        message,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

/**
 * Handle 404 - Route not found
 */
const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFoundHandler };

