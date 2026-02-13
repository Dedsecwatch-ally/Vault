const searchService = require('./search.service');
const quotaService = require('../../services/quota.service');

/**
 * Search files and folders
 * GET /api/search
 */
const search = async (req, res, next) => {
    try {
        const { q, type, mimeType, fromDate, toDate, page, limit } = req.query;

        const result = await searchService.search(req.user.id, {
            query: q,
            type,
            mimeType,
            fromDate,
            toDate,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 50,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get recent files
 * GET /api/search/recent
 */
const recent = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const results = await searchService.getRecent(req.user.id, {
            limit: parseInt(limit, 10) || 20,
        });

        res.json({
            success: true,
            data: { results },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get storage quota info
 * GET /api/search/quota (or could be a separate endpoint)
 */
const getQuota = async (req, res, next) => {
    try {
        const storageInfo = await quotaService.getStorageInfo(req.user.id);

        res.json({
            success: true,
            data: { storage: storageInfo },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { search, recent, getQuota };
