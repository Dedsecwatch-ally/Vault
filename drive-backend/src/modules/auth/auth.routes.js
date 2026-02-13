const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate, rules } = require('../../middlewares/validate.middleware');

// POST /api/auth/register
router.post(
    '/register',
    [rules.email, rules.password, rules.name, validate],
    authController.register
);

// POST /api/auth/login
router.post(
    '/login',
    [rules.email, rules.password, validate],
    authController.login
);

// GET /api/auth/me (protected)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
