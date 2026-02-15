const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    storageUsed: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
        field: 'storage_used',
    },
    storageQuota: {
        type: DataTypes.BIGINT,
        defaultValue: 1024 * 1024 * 1024, // 1GB
        allowNull: false,
        field: 'storage_quota',
    },
    encryptionSalt: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'encryption_salt',
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        },
    },
});

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return safe user object (no password)
User.prototype.toSafeObject = function () {
    const { id, email, name, storageUsed, storageQuota, created_at } = this.toJSON();
    return { id, email, name, storageUsed, storageQuota, created_at };
};

// Check if user has available storage
User.prototype.hasAvailableStorage = function (requiredBytes) {
    const used = parseInt(this.storageUsed, 10) || 0;
    const quota = parseInt(this.storageQuota, 10) || 0;
    return (used + requiredBytes) <= quota;
};

// Get storage usage percentage
User.prototype.getStorageUsagePercent = function () {
    const used = parseInt(this.storageUsed, 10) || 0;
    const quota = parseInt(this.storageQuota, 10) || 1;
    return Math.round((used / quota) * 100);
};

module.exports = User;
