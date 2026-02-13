const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate JWT token for user
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
