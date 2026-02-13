const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const Share = sequelize.define('Share', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    resourceType: {
        type: DataTypes.ENUM('file', 'folder'),
        allowNull: false,
        field: 'resource_type',
    },
    resourceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'resource_id',
    },
    sharedById: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'shared_by_id',
    },
    sharedWithId: {
        type: DataTypes.UUID,
        allowNull: true, // null for public links
        field: 'shared_with_id',
    },
    permission: {
        type: DataTypes.ENUM('view', 'edit', 'admin'),
        defaultValue: 'view',
        allowNull: false,
    },
    publicToken: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
        field: 'public_token',
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
    },
}, {
    tableName: 'shares',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (share) => {
            if (share.password) {
                share.password = await bcrypt.hash(share.password, 12);
            }
        },
    },
});

/**
 * Generate a public token
 */
Share.generatePublicToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify password
 */
Share.prototype.verifyPassword = async function (candidatePassword) {
    if (!this.password) return true;
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if share is expired
 */
Share.prototype.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
};

/**
 * Check if user has specific permission
 */
Share.prototype.hasPermission = function (requiredPermission) {
    const permissions = {
        'view': 1,
        'edit': 2,
        'admin': 3,
    };
    return permissions[this.permission] >= permissions[requiredPermission];
};

module.exports = Share;
