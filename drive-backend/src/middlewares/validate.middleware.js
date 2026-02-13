const { validationResult, body } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to handle validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg).join(', ');
        return next(ApiError.badRequest(messages));
    }

    next();
};

/**
 * Common validation rules
 */
const rules = {
    email: body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/\d/)
        .withMessage('Password must contain a number'),

    name: body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .trim(),
};

module.exports = { validate, rules };
