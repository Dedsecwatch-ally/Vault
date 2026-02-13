const trashService = require('./trash.service');

/**
 * List trash
 * GET /api/trash
 */
const list = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await trashService.listTrash(req.user.id, {
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
 * Restore item from trash
 * POST /api/trash/:type/:id/restore
 */
const restore = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const result = await trashService.restoreItem(req.user.id, { type, id });

        res.json({
            success: true,
            message: result.message,
            data: { item: result.item },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Permanently delete item
 * DELETE /api/trash/:type/:id
 */
const permanentDelete = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const result = await trashService.permanentDelete(req.user.id, { type, id });

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Empty trash
 * DELETE /api/trash/empty
 */
const emptyTrash = async (req, res, next) => {
    try {
        const result = await trashService.emptyTrash(req.user.id);

        res.json({
            success: true,
            message: result.message,
            data: {
                deletedFiles: result.deletedFiles,
                deletedFolders: result.deletedFolders,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { list, restore, permanentDelete, emptyTrash };
