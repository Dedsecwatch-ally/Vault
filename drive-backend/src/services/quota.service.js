const User = require('../modules/users/user.model');
const ApiError = require('../utils/ApiError');

/**
 * Quota Service
 * Manages user storage quotas
 */

/**
 * Get user with quota info
 */
const getUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw ApiError.notFound('User not found');
    }
    return user;
};

/**
 * Get storage info for user
 */
const getStorageInfo = async (userId) => {
    const user = await getUser(userId);

    return {
        used: parseInt(user.storageUsed, 10),
        quota: parseInt(user.storageQuota, 10),
        available: parseInt(user.storageQuota, 10) - parseInt(user.storageUsed, 10),
        usagePercent: user.getStorageUsagePercent(),
    };
};

/**
 * Check if user has available storage
 */
const hasAvailableStorage = async (userId, requiredBytes) => {
    const user = await getUser(userId);
    return user.hasAvailableStorage(requiredBytes);
};

/**
 * Update storage usage
 * @param {string} userId - User ID
 * @param {number} bytes - Positive to add, negative to subtract
 */
const updateUsage = async (userId, bytes) => {
    const user = await getUser(userId);

    let newUsage = parseInt(user.storageUsed, 10) + bytes;
    if (newUsage < 0) newUsage = 0;

    user.storageUsed = newUsage;
    await user.save();

    return user;
};

/**
 * Recalculate storage usage from scratch
 * Useful for fixing inconsistencies
 */
const recalculateUsage = async (userId) => {
    const File = require('../modules/files/file.model');
    const { Op } = require('sequelize');

    // Sum all non-deleted files
    const result = await File.sum('size', {
        where: { ownerId: userId },
    });

    const user = await getUser(userId);
    user.storageUsed = result || 0;
    await user.save();

    return {
        recalculatedUsage: user.storageUsed,
    };
};

/**
 * Set user quota (admin function)
 */
const setQuota = async (userId, quotaBytes) => {
    const user = await getUser(userId);
    user.storageQuota = quotaBytes;
    await user.save();

    return user;
};

module.exports = {
    getUser,
    getStorageInfo,
    hasAvailableStorage,
    updateUsage,
    recalculateUsage,
    setQuota,
};
