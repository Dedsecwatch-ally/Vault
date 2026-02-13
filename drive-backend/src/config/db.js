const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

// Build Sequelize options
const dialectOptions = {};

if (env.DB_SSL) {
    dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false, // Neon uses self-signed certs
    };
}

// Support DATABASE_URL (Neon, Render, Railway provide this)
const sequelize = env.DATABASE_URL
    ? new Sequelize(env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: require('pg'), // Required for Vercel/Next.js bundling
        logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        dialectOptions,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    })

    : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        dialectModule: require('pg'), // Required for Vercel/Next.js bundling
        logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        dialectOptions,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    });

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ PostgreSQL connected successfully');

        // Sync models in development (use migrations in production)
        if (env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('✅ Database synced');
        }
    } catch (error) {
        logger.error('❌ Unable to connect to PostgreSQL:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
