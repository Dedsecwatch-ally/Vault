const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Folder = sequelize.define('Folder', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255],
        },
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_id',
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'owner_id',
    },
    path: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        defaultValue: '/',
    },
}, {
    tableName: 'folders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Soft delete
    deletedAt: 'deleted_at',
});

// Self-referential association for parent-child relationship
Folder.hasMany(Folder, { as: 'children', foreignKey: 'parent_id' });
Folder.belongsTo(Folder, { as: 'parent', foreignKey: 'parent_id' });

/**
 * Build materialized path for the folder
 */
Folder.prototype.buildPath = async function () {
    if (!this.parentId) {
        return `/${this.id}`;
    }

    const parent = await Folder.findByPk(this.parentId);
    if (!parent) {
        return `/${this.id}`;
    }

    return `${parent.path}/${this.id}`;
};

/**
 * Get full folder path with names
 */
Folder.prototype.getFullPath = async function () {
    const pathParts = this.path.split('/').filter(Boolean);
    const folders = await Folder.findAll({
        where: { id: pathParts },
        attributes: ['id', 'name'],
    });

    const folderMap = new Map(folders.map(f => [f.id, f.name]));
    return '/' + pathParts.map(id => folderMap.get(id) || id).join('/');
};

module.exports = Folder;
