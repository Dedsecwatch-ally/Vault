const File = require('../files/file.model');
const Folder = require('../folders/folder.model');
const ApiError = require('../../utils/ApiError');
const storageService = require('../../services/storage.service');
const { Op } = require('sequelize');

/**
 * List trashed items (files and folders)
 */
const listTrash = async (ownerId, { page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;

    const [files, folders] = await Promise.all([
        File.findAll({
            where: { ownerId },
            paranoid: false, // Include soft-deleted
            order: [['deleted_at', 'DESC']],
            attributes: ['id', 'originalName', 'mimeType', 'size', 'deleted_at'],
        }).then(items => items.filter(item => item.deleted_at !== null)),

        Folder.findAll({
            where: { ownerId },
            paranoid: false,
            order: [['deleted_at', 'DESC']],
            attributes: ['id', 'name', 'deleted_at'],
        }).then(items => items.filter(item => item.deleted_at !== null)),
    ]);

    // Combine and sort by deletion date
    const items = [
        ...files.map(f => ({ type: 'file', ...f.toJSON() })),
        ...folders.map(f => ({ type: 'folder', ...f.toJSON() })),
    ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    // Paginate combined results
    const paginatedItems = items.slice(offset, offset + limit);

    return {
        items: paginatedItems,
        pagination: {
            total: items.length,
            page,
            limit,
            totalPages: Math.ceil(items.length / limit),
        },
    };
};

/**
 * Restore item from trash
 */
const restoreItem = async (ownerId, { type, id }) => {
    if (type === 'file') {
        const file = await File.findOne({
            where: { id, ownerId },
            paranoid: false,
        });

        if (!file || !file.deleted_at) {
            throw ApiError.notFound('File not found in trash');
        }

        await file.restore();
        return { message: 'File restored successfully', item: file };
    }

    if (type === 'folder') {
        const folder = await Folder.findOne({
            where: { id, ownerId },
            paranoid: false,
        });

        if (!folder || !folder.deleted_at) {
            throw ApiError.notFound('Folder not found in trash');
        }

        await folder.restore();

        // Also restore all files in this folder
        await File.restore({
            where: { folderId: id, ownerId },
        });

        // Recursively restore child folders
        await restoreChildFolders(id, ownerId);

        return { message: 'Folder restored successfully', item: folder };
    }

    throw ApiError.badRequest('Invalid item type');
};

/**
 * Recursively restore child folders
 */
const restoreChildFolders = async (parentId, ownerId) => {
    const children = await Folder.findAll({
        where: { parentId, ownerId },
        paranoid: false,
    });

    for (const child of children) {
        if (child.deleted_at) {
            await child.restore();

            // Restore files in child folder
            await File.restore({
                where: { folderId: child.id, ownerId },
            });

            // Continue recursively
            await restoreChildFolders(child.id, ownerId);
        }
    }
};

/**
 * Permanently delete item from trash
 */
const permanentDelete = async (ownerId, { type, id }) => {
    if (type === 'file') {
        const file = await File.findOne({
            where: { id, ownerId },
            paranoid: false,
        });

        if (!file) {
            throw ApiError.notFound('File not found');
        }

        // Delete from storage
        try {
            await storageService.delete(file.filename);
        } catch (error) {
            // Log but continue with DB deletion
            console.error('Storage deletion error:', error);
        }

        // Force delete from database
        await file.destroy({ force: true });
        return { message: 'File permanently deleted' };
    }

    if (type === 'folder') {
        const folder = await Folder.findOne({
            where: { id, ownerId },
            paranoid: false,
        });

        if (!folder) {
            throw ApiError.notFound('Folder not found');
        }

        // Delete all files in folder and subfolders
        await deleteFilesInFolder(id, ownerId);

        // Delete child folders recursively
        await deleteChildFolders(id, ownerId);

        // Delete the folder itself
        await folder.destroy({ force: true });
        return { message: 'Folder permanently deleted' };
    }

    throw ApiError.badRequest('Invalid item type');
};

/**
 * Delete all files in a folder (including storage)
 */
const deleteFilesInFolder = async (folderId, ownerId) => {
    const files = await File.findAll({
        where: { folderId, ownerId },
        paranoid: false,
    });

    for (const file of files) {
        try {
            await storageService.delete(file.filename);
        } catch (error) {
            console.error('Storage deletion error:', error);
        }
        await file.destroy({ force: true });
    }
};

/**
 * Recursively delete child folders
 */
const deleteChildFolders = async (parentId, ownerId) => {
    const children = await Folder.findAll({
        where: { parentId, ownerId },
        paranoid: false,
    });

    for (const child of children) {
        await deleteFilesInFolder(child.id, ownerId);
        await deleteChildFolders(child.id, ownerId);
        await child.destroy({ force: true });
    }
};

/**
 * Empty trash (delete all trashed items permanently)
 */
const emptyTrash = async (ownerId) => {
    // Get all trashed files
    const trashedFiles = await File.findAll({
        where: { ownerId },
        paranoid: false,
    }).then(items => items.filter(item => item.deleted_at !== null));

    // Delete each file from storage and database
    for (const file of trashedFiles) {
        try {
            await storageService.delete(file.filename);
        } catch (error) {
            console.error('Storage deletion error:', error);
        }
        await file.destroy({ force: true });
    }

    // Get all trashed folders
    const trashedFolders = await Folder.findAll({
        where: { ownerId },
        paranoid: false,
    }).then(items => items.filter(item => item.deleted_at !== null));

    // Delete each folder
    for (const folder of trashedFolders) {
        await folder.destroy({ force: true });
    }

    return {
        message: 'Trash emptied successfully',
        deletedFiles: trashedFiles.length,
        deletedFolders: trashedFolders.length,
    };
};

/**
 * Auto-purge items older than 30 days (to be run as scheduled job)
 */
const autoPurge = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find files older than 30 days in trash
    const oldFiles = await File.findAll({
        where: {
            deleted_at: { [Op.lt]: thirtyDaysAgo },
        },
        paranoid: false,
    });

    let purgedFiles = 0;
    for (const file of oldFiles) {
        try {
            await storageService.delete(file.filename);
            await file.destroy({ force: true });
            purgedFiles++;
        } catch (error) {
            console.error(`Error purging file ${file.id}:`, error);
        }
    }

    // Find folders older than 30 days in trash
    const oldFolders = await Folder.findAll({
        where: {
            deleted_at: { [Op.lt]: thirtyDaysAgo },
        },
        paranoid: false,
    });

    let purgedFolders = 0;
    for (const folder of oldFolders) {
        try {
            await folder.destroy({ force: true });
            purgedFolders++;
        } catch (error) {
            console.error(`Error purging folder ${folder.id}:`, error);
        }
    }

    return { purgedFiles, purgedFolders };
};

module.exports = {
    listTrash,
    restoreItem,
    permanentDelete,
    emptyTrash,
    autoPurge,
};
