const Share = require('./share.model');
const File = require('../files/file.model');
const Folder = require('../folders/folder.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { Op } = require('sequelize');

/**
 * Share a resource with a user
 */
const shareWithUser = async (ownerId, { resourceType, resourceId, email, permission = 'view' }) => {
    // Verify resource exists and belongs to owner
    const resource = await getResource(resourceType, resourceId, ownerId);

    // Find user to share with
    const recipient = await User.findOne({ where: { email } });
    if (!recipient) {
        throw ApiError.notFound('User not found');
    }

    if (recipient.id === ownerId) {
        throw ApiError.badRequest('Cannot share with yourself');
    }

    // Check if already shared
    const existingShare = await Share.findOne({
        where: {
            resourceType,
            resourceId,
            sharedWithId: recipient.id,
        },
    });

    if (existingShare) {
        // Update existing share
        existingShare.permission = permission;
        await existingShare.save();
        return existingShare;
    }

    // Create new share
    const share = await Share.create({
        resourceType,
        resourceId,
        sharedById: ownerId,
        sharedWithId: recipient.id,
        permission,
    });

    return share;
};

/**
 * Create a public link
 */
const createPublicLink = async (ownerId, { resourceType, resourceId, password, expiresIn }) => {
    // Verify resource exists and belongs to owner
    await getResource(resourceType, resourceId, ownerId);

    // Check if public link already exists
    let share = await Share.findOne({
        where: {
            resourceType,
            resourceId,
            sharedById: ownerId,
            publicToken: { [Op.ne]: null },
        },
    });

    if (share) {
        // Update existing link
        if (password) share.password = password;
        if (expiresIn) {
            share.expiresAt = new Date(Date.now() + expiresIn * 1000);
        }
        await share.save();
    } else {
        // Create new public link
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

        share = await Share.create({
            resourceType,
            resourceId,
            sharedById: ownerId,
            publicToken: Share.generatePublicToken(),
            password,
            expiresAt,
            permission: 'view',
        });
    }

    return {
        token: share.publicToken,
        expiresAt: share.expiresAt,
        hasPassword: !!share.password,
    };
};

/**
 * Access public share
 */
const accessPublicShare = async (token, password) => {
    const share = await Share.findOne({
        where: { publicToken: token },
    });

    if (!share) {
        throw ApiError.notFound('Share not found');
    }

    if (share.isExpired()) {
        throw ApiError.badRequest('This link has expired');
    }

    if (share.password) {
        if (!password) {
            throw ApiError.unauthorized('Password required');
        }
        const valid = await share.verifyPassword(password);
        if (!valid) {
            throw ApiError.unauthorized('Invalid password');
        }
    }

    const resource = await getResourceById(share.resourceType, share.resourceId);
    return { share, resource };
};

/**
 * List shares for a resource
 */
const listShares = async (ownerId, { resourceType, resourceId }) => {
    await getResource(resourceType, resourceId, ownerId);

    const shares = await Share.findAll({
        where: {
            resourceType,
            resourceId,
        },
        include: [
            {
                model: User,
                as: 'sharedWith',
                attributes: ['id', 'email', 'name'],
            },
        ],
    });

    return shares.map(s => ({
        id: s.id,
        sharedWith: s.sharedWith,
        permission: s.permission,
        publicToken: s.publicToken,
        expiresAt: s.expiresAt,
        hasPassword: !!s.password,
        createdAt: s.created_at,
    }));
};

/**
 * List items shared with user
 */
const listSharedWithMe = async (userId, { page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;

    const { count, rows: shares } = await Share.findAndCountAll({
        where: { sharedWithId: userId },
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [
            { model: User, as: 'sharedBy', attributes: ['id', 'email', 'name'] },
        ],
    });

    // Fetch resources
    const items = await Promise.all(shares.map(async (share) => {
        const resource = await getResourceById(share.resourceType, share.resourceId);
        return {
            id: share.id,
            resourceType: share.resourceType,
            resource: resource ? {
                id: resource.id,
                name: resource.originalName || resource.name,
                ...(share.resourceType === 'file' && { mimeType: resource.mimeType, size: resource.size }),
            } : null,
            permission: share.permission,
            sharedBy: share.sharedBy,
            createdAt: share.created_at,
        };
    }));

    return {
        items: items.filter(i => i.resource !== null),
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Revoke share
 */
const revokeShare = async (ownerId, shareId) => {
    const share = await Share.findOne({
        where: { id: shareId, sharedById: ownerId },
    });

    if (!share) {
        throw ApiError.notFound('Share not found');
    }

    await share.destroy();
    return { message: 'Share revoked successfully' };
};

/**
 * Check if user has access to resource
 */
const checkAccess = async (userId, resourceType, resourceId, requiredPermission = 'view') => {
    // Check if owner
    const resource = await getResourceById(resourceType, resourceId);
    if (!resource) return null;

    if (resource.ownerId === userId) {
        return { hasAccess: true, isOwner: true, permission: 'admin' };
    }

    // Check if shared
    const share = await Share.findOne({
        where: {
            resourceType,
            resourceId,
            sharedWithId: userId,
        },
    });

    if (!share) {
        return { hasAccess: false };
    }

    if (!share.hasPermission(requiredPermission)) {
        return { hasAccess: false, permission: share.permission };
    }

    return { hasAccess: true, isOwner: false, permission: share.permission };
};

/**
 * Helper: Get resource by type and ID, verifying ownership
 */
const getResource = async (type, id, ownerId) => {
    const Model = type === 'file' ? File : Folder;
    const resource = await Model.findOne({
        where: { id, ownerId },
    });

    if (!resource) {
        throw ApiError.notFound(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
    }

    return resource;
};

/**
 * Helper: Get resource by type and ID without ownership check
 */
const getResourceById = async (type, id) => {
    const Model = type === 'file' ? File : Folder;
    return Model.findByPk(id);
};

module.exports = {
    shareWithUser,
    createPublicLink,
    accessPublicShare,
    listShares,
    listSharedWithMe,
    revokeShare,
    checkAccess,
};
