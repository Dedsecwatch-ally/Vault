const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const User = require('../modules/users/user.model');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        // Find user
        const user = await User.findByPk(decoded.id);

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(ApiError.unauthorized('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(ApiError.unauthorized('Token expired'));
        } else {
            next(error);
        }
    }
};

module.exports = { authenticate };
