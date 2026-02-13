const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const File = sequelize.define('File', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'original_name',
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'mime_type',
    },
    size: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    folderId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'folder_id',
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'owner_id',
    },
    currentVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
        field: 'current_version',
    },
}, {
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Soft delete
    deletedAt: 'deleted_at',
});

module.exports = File;
