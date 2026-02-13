const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(ApiError.tooManyRequests(options.message.message));
    },
});

/**
 * Auth route rate limiter (stricter)
 * 10 requests per 15 minutes for login/register
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(ApiError.tooManyRequests(options.message.message));
    },
});

/**
 * Upload rate limiter
 * 50 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: { success: false, message: 'Upload limit reached, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(ApiError.tooManyRequests(options.message.message));
    },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter };
