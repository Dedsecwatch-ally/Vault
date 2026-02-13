'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('folders', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            parent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'folders',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
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
            path: {
                type: Sequelize.STRING(1000),
                allowNull: false,
                defaultValue: '/',
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
        await queryInterface.addIndex('folders', ['owner_id']);
        await queryInterface.addIndex('folders', ['parent_id']);
        await queryInterface.addIndex('folders', ['path']);
        await queryInterface.addIndex('folders', ['deleted_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('folders');
    },
};
