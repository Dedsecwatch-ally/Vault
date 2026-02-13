const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { generateToken } = require('../../utils/jwt');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} User and token
 */
const register = async ({ email, password, name }) => {
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
        throw ApiError.conflict('Email already registered');
    }

    // Create user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    return {
        user: user.toSafeObject(),
        token,
    };
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Object} User and token
 */
const login = async ({ email, password }) => {
    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    return {
        user: user.toSafeObject(),
        token,
    };
};

/**
 * Get current user profile
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
const getMe = async (userId) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    return user.toSafeObject();
};

module.exports = { register, login, getMe };
