const sharesService = require('./shares.service');

/**
 * Share with user
 * POST /api/shares
 */
const shareWithUser = async (req, res, next) => {
    try {
        const { resourceType, resourceId, email, permission } = req.body;
        const share = await sharesService.shareWithUser(req.user.id, {
            resourceType,
            resourceId,
            email,
            permission,
        });

        res.status(201).json({
            success: true,
            message: 'Resource shared successfully',
            data: { share },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create public link
 * POST /api/shares/public
 */
const createPublicLink = async (req, res, next) => {
    try {
        const { resourceType, resourceId, password, expiresIn } = req.body;
        const result = await sharesService.createPublicLink(req.user.id, {
            resourceType,
            resourceId,
            password,
            expiresIn,
        });

        res.status(201).json({
            success: true,
            message: 'Public link created',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Access public share
 * GET /api/shares/public/:token
 */
const accessPublicShare = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.query;
        const result = await sharesService.accessPublicShare(token, password);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List shares for a resource
 * GET /api/shares?resourceType=file&resourceId=xxx
 */
const listShares = async (req, res, next) => {
    try {
        const { resourceType, resourceId } = req.query;
        const shares = await sharesService.listShares(req.user.id, {
            resourceType,
            resourceId,
        });

        res.json({
            success: true,
            data: { shares },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List items shared with me
 * GET /api/shares/shared-with-me
 */
const sharedWithMe = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await sharesService.listSharedWithMe(req.user.id, {
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
 * Revoke share
 * DELETE /api/shares/:id
 */
const revokeShare = async (req, res, next) => {
    try {
        const result = await sharesService.revokeShare(req.user.id, req.params.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    shareWithUser,
    createPublicLink,
    accessPublicShare,
    listShares,
    sharedWithMe,
    revokeShare,
};
