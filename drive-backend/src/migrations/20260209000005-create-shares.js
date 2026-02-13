'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('shares', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            resource_type: {
                type: Sequelize.ENUM('file', 'folder'),
                allowNull: false,
            },
            resource_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            shared_by_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            shared_with_id: {
                type: Sequelize.UUID,
                allowNull: true, // null for public links
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            permission: {
                type: Sequelize.ENUM('view', 'edit', 'admin'),
                defaultValue: 'view',
                allowNull: false,
            },
            public_token: {
                type: Sequelize.STRING(64),
                allowNull: true,
                unique: true,
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true,
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
        });

        // Add indexes
        await queryInterface.addIndex('shares', ['resource_type', 'resource_id']);
        await queryInterface.addIndex('shares', ['shared_by_id']);
        await queryInterface.addIndex('shares', ['shared_with_id']);
        await queryInterface.addIndex('shares', ['public_token']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('shares');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shares_resource_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shares_permission";');
    },
};
