const authService = require('./auth.service');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.register({ email, password, name });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });

        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.id);

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
