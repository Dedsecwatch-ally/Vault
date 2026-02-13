const File = require('../files/file.model');
const Folder = require('../folders/folder.model');
const { Op } = require('sequelize');

/**
 * Search files and folders
 */
const search = async (ownerId, { query, type, mimeType, fromDate, toDate, page = 1, limit = 50 } = {}) => {
    if (!query || query.trim().length < 2) {
        return { results: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${query.trim()}%`;

    let files = [];
    let folders = [];

    // Search files
    if (!type || type === 'file' || type === 'all') {
        const fileWhere = {
            ownerId,
            originalName: { [Op.iLike]: searchTerm },
        };

        // Add mime type filter
        if (mimeType) {
            fileWhere.mimeType = { [Op.iLike]: `${mimeType}%` };
        }

        // Add date filters
        if (fromDate) {
            fileWhere.created_at = { ...(fileWhere.created_at || {}), [Op.gte]: new Date(fromDate) };
        }
        if (toDate) {
            fileWhere.created_at = { ...(fileWhere.created_at || {}), [Op.lte]: new Date(toDate) };
        }

        files = await File.findAll({
            where: fileWhere,
            attributes: ['id', 'originalName', 'mimeType', 'size', 'folderId', 'created_at'],
            order: [['originalName', 'ASC']],
        });
    }

    // Search folders
    if (!type || type === 'folder' || type === 'all') {
        const folderWhere = {
            ownerId,
            name: { [Op.iLike]: searchTerm },
        };

        // Add date filters
        if (fromDate) {
            folderWhere.created_at = { ...(folderWhere.created_at || {}), [Op.gte]: new Date(fromDate) };
        }
        if (toDate) {
            folderWhere.created_at = { ...(folderWhere.created_at || {}), [Op.lte]: new Date(toDate) };
        }

        folders = await Folder.findAll({
            where: folderWhere,
            attributes: ['id', 'name', 'parentId', 'created_at'],
            order: [['name', 'ASC']],
        });
    }

    // Combine results
    const results = [
        ...folders.map(f => ({
            type: 'folder',
            id: f.id,
            name: f.name,
            parentId: f.parentId,
            createdAt: f.created_at,
        })),
        ...files.map(f => ({
            type: 'file',
            id: f.id,
            name: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            folderId: f.folderId,
            createdAt: f.created_at,
        })),
    ];

    // Sort by relevance (exact match first, then alphabetical)
    results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
    });

    // Paginate
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
        results: paginatedResults,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get recent files
 */
const getRecent = async (ownerId, { limit = 20 } = {}) => {
    const files = await File.findAll({
        where: { ownerId },
        order: [['updated_at', 'DESC']],
        limit,
        attributes: ['id', 'originalName', 'mimeType', 'size', 'folderId', 'updated_at'],
    });

    return files.map(f => ({
        type: 'file',
        id: f.id,
        name: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        folderId: f.folderId,
        updatedAt: f.updated_at,
    }));
};

module.exports = {
    search,
    getRecent,
};
