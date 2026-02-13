const Folder = require('./folder.model');
const File = require('../files/file.model');
const ApiError = require('../../utils/ApiError');
const { Op } = require('sequelize');

/**
 * Create a new folder
 */
const createFolder = async ({ name, parentId, ownerId }) => {
    // If parentId is provided, verify it exists and belongs to user
    if (parentId) {
        const parentFolder = await Folder.findOne({
            where: { id: parentId, ownerId },
        });

        if (!parentFolder) {
            throw ApiError.notFound('Parent folder not found');
        }
    }

    // Check for duplicate folder name in parent
    const existingFolder = await Folder.findOne({
        where: {
            name,
            parentId: parentId || null,
            ownerId,
        },
    });

    if (existingFolder) {
        throw ApiError.conflict('A folder with this name already exists');
    }

    // Create folder
    const folder = await Folder.create({
        name,
        parentId,
        ownerId,
    });

    // Build and save path
    folder.path = await folder.buildPath();
    await folder.save();

    return folder;
};

/**
 * List folders for a user
 */
const listFolders = async (ownerId, { parentId = null, page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;

    const where = { ownerId };
    if (parentId) {
        where.parentId = parentId;
    } else {
        where.parentId = null; // Root folders
    }

    const { count, rows: folders } = await Folder.findAndCountAll({
        where,
        limit,
        offset,
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'parentId', 'path', 'created_at', 'updated_at'],
    });

    return {
        folders,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get folder by ID
 */
const getFolder = async (folderId, ownerId) => {
    const folder = await Folder.findOne({
        where: { id: folderId, ownerId },
        include: [
            { model: Folder, as: 'children', attributes: ['id', 'name'] },
        ],
    });

    if (!folder) {
        throw ApiError.notFound('Folder not found');
    }

    return folder;
};

/**
 * Get folder contents (subfolders + files)
 */
const getFolderContents = async (folderId, ownerId, { page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;

    // Verify folder exists (null = root)
    if (folderId) {
        const folder = await Folder.findOne({
            where: { id: folderId, ownerId },
        });

        if (!folder) {
            throw ApiError.notFound('Folder not found');
        }
    }

    const folderWhere = { ownerId, parentId: folderId || null };
    const fileWhere = { ownerId, folderId: folderId || null };

    const [folders, files] = await Promise.all([
        Folder.findAll({
            where: folderWhere,
            order: [['name', 'ASC']],
            attributes: ['id', 'name', 'created_at', 'updated_at'],
        }),
        File.findAll({
            where: fileWhere,
            order: [['originalName', 'ASC']],
            attributes: ['id', 'originalName', 'mimeType', 'size', 'created_at'],
            limit,
            offset,
        }),
    ]);

    return { folders, files };
};

/**
 * Update folder
 */
const updateFolder = async (folderId, ownerId, { name }) => {
    const folder = await getFolder(folderId, ownerId);

    if (name && name !== folder.name) {
        // Check for duplicate name
        const existing = await Folder.findOne({
            where: {
                name,
                parentId: folder.parentId,
                ownerId,
                id: { [Op.ne]: folderId },
            },
        });

        if (existing) {
            throw ApiError.conflict('A folder with this name already exists');
        }

        folder.name = name;
        await folder.save();
    }

    return folder;
};

/**
 * Move folder to a new parent
 */
const moveFolder = async (folderId, ownerId, { newParentId }) => {
    const folder = await getFolder(folderId, ownerId);

    // Cannot move folder into itself or its children
    if (newParentId === folderId) {
        throw ApiError.badRequest('Cannot move folder into itself');
    }

    if (newParentId) {
        const newParent = await Folder.findOne({
            where: { id: newParentId, ownerId },
        });

        if (!newParent) {
            throw ApiError.notFound('Destination folder not found');
        }

        // Check if newParent is a child of the folder being moved
        if (newParent.path.includes(folderId)) {
            throw ApiError.badRequest('Cannot move folder into its own subfolder');
        }
    }

    // Check for duplicate name in new location
    const existing = await Folder.findOne({
        where: {
            name: folder.name,
            parentId: newParentId || null,
            ownerId,
            id: { [Op.ne]: folderId },
        },
    });

    if (existing) {
        throw ApiError.conflict('A folder with this name already exists in the destination');
    }

    // Update parent and rebuild path
    folder.parentId = newParentId || null;
    folder.path = await folder.buildPath();
    await folder.save();

    // Update paths for all children
    await updateChildPaths(folder);

    return folder;
};

/**
 * Recursively update child folder paths
 */
const updateChildPaths = async (parentFolder) => {
    const children = await Folder.findAll({
        where: { parentId: parentFolder.id },
    });

    for (const child of children) {
        child.path = `${parentFolder.path}/${child.id}`;
        await child.save();
        await updateChildPaths(child);
    }
};

/**
 * Delete folder (soft delete)
 */
const deleteFolder = async (folderId, ownerId) => {
    const folder = await getFolder(folderId, ownerId);

    // Soft delete will cascade to files and subfolders via paranoid mode
    await folder.destroy();

    return { message: 'Folder moved to trash' };
};

module.exports = {
    createFolder,
    listFolders,
    getFolder,
    getFolderContents,
    updateFolder,
    moveFolder,
    deleteFolder,
};
