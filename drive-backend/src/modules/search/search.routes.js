const express = require('express');
const router = express.Router();

const searchController = require('./search.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/search?q=term&type=file&mimeType=image&fromDate=&toDate=
router.get('/', searchController.search);

// GET /api/search/recent - Get recently accessed files
router.get('/recent', searchController.recent);

// GET /api/search/quota - Get storage quota info
router.get('/quota', searchController.getQuota);

module.exports = router;
