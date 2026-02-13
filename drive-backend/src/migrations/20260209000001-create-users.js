'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            storage_used: {
                type: Sequelize.BIGINT,
                defaultValue: 0,
                allowNull: false,
            },
            storage_quota: {
                type: Sequelize.BIGINT,
                defaultValue: 15 * 1024 * 1024 * 1024, // 15GB
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
        });

        // Add index on email for faster lookups
        await queryInterface.addIndex('users', ['email']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('users');
    },
};
