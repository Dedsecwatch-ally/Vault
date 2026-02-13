const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const FileVersion = sequelize.define('FileVersion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fileId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'file_id',
    },
    versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'version_number',
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    size: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'uploaded_at',
    },
}, {
    tableName: 'file_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { unique: true, fields: ['file_id', 'version_number'] },
    ],
});

module.exports = FileVersion;
