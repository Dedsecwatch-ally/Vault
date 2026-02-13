const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

// Import models to ensure associations are set up
require('./models');

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start server
        app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();
