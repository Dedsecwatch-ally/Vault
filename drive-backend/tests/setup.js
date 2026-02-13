const { sequelize } = require('../src/config/db');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

/**
 * Global test setup
 */
beforeAll(async () => {
    // Wait for database connection
    try {
        await sequelize.authenticate();
        // Sync database (create tables)
        await sequelize.sync({ force: true });
    } catch (error) {
        console.error('Test database setup failed:', error);
        throw error;
    }
});

/**
 * Clean up after each test
 */
afterEach(async () => {
    // Clean up test data if needed
});

/**
 * Global test teardown
 */
afterAll(async () => {
    // Close database connection
    await sequelize.close();
});

/**
 * Helper to create test user
 */
global.createTestUser = async (overrides = {}) => {
    const User = require('../src/modules/users/user.model');
    const { generateToken } = require('../src/utils/jwt');

    const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123',
        name: 'Test User',
        ...overrides,
    };

    const user = await User.create(userData);
    const token = generateToken({ id: user.id, email: user.email });

    return { user, token };
};

/**
 * Helper to clean test data
 */
global.cleanTestData = async () => {
    const User = require('../src/modules/users/user.model');
    const File = require('../src/modules/files/file.model');
    const Folder = require('../src/modules/folders/folder.model');
    const Share = require('../src/modules/shares/share.model');

    await Share.destroy({ where: {}, force: true });
    await File.destroy({ where: {}, force: true });
    await Folder.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
};
