const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Default to 500 if no status code
    if (!statusCode) {
        statusCode = 500;
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
