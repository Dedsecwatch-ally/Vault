const foldersService = require('./folders.service');

/**
 * Create folder
 * POST /api/folders
 */
const create = async (req, res, next) => {
    try {
        const { name, parentId } = req.body;
        const folder = await foldersService.createFolder({
            name,
            parentId,
            ownerId: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            data: { folder },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List folders
 * GET /api/folders
 */
const list = async (req, res, next) => {
    try {
        const { parentId, page, limit } = req.query;
        const result = await foldersService.listFolders(req.user.id, {
            parentId,
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
 * Get folder
 * GET /api/folders/:id
 */
const getOne = async (req, res, next) => {
    try {
        const folder = await foldersService.getFolder(req.params.id, req.user.id);

        res.json({
            success: true,
            data: { folder },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get folder contents
 * GET /api/folders/:id/contents
 */
const getContents = async (req, res, next) => {
    try {
        const folderId = req.params.id === 'root' ? null : req.params.id;
        const { page, limit } = req.query;

        const contents = await foldersService.getFolderContents(folderId, req.user.id, {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 50,
        });

        res.json({
            success: true,
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update folder
 * PATCH /api/folders/:id
 */
const update = async (req, res, next) => {
    try {
        const { name } = req.body;
        const folder = await foldersService.updateFolder(req.params.id, req.user.id, { name });

        res.json({
            success: true,
            message: 'Folder updated successfully',
            data: { folder },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Move folder
 * POST /api/folders/:id/move
 */
const move = async (req, res, next) => {
    try {
        const { newParentId } = req.body;
        const folder = await foldersService.moveFolder(req.params.id, req.user.id, { newParentId });

        res.json({
            success: true,
            message: 'Folder moved successfully',
            data: { folder },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete folder
 * DELETE /api/folders/:id
 */
const deleteFolder = async (req, res, next) => {
    try {
        const result = await foldersService.deleteFolder(req.params.id, req.user.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, list, getOne, getContents, update, move, deleteFolder };
