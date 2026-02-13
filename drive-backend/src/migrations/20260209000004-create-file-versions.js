'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('file_versions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            file_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'files',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            version_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            filename: {
                type: Sequelize.STRING(255),
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
            uploaded_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
        await queryInterface.addIndex('file_versions', ['file_id']);
        await queryInterface.addIndex('file_versions', ['file_id', 'version_number'], { unique: true });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('file_versions');
    },
};
