'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('files', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            original_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            filename: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            mime_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            size: {
                type: Sequelize.BIGINT,
                allowNull: false,
            },
            path: {
                type: Sequelize.STRING(500),
                allowNull: false,
            },
            folder_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'folders',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            owner_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            current_version: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        // Add indexes
        await queryInterface.addIndex('files', ['owner_id']);
        await queryInterface.addIndex('files', ['folder_id']);
        await queryInterface.addIndex('files', ['deleted_at']);
        await queryInterface.addIndex('files', ['original_name']); // For search
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('files');
    },
};
