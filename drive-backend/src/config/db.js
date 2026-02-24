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

// Support standard Postgres connection strings
// Vercel / Neon often use POSTGRES_URL or DATABASE_URL
const connectionString = env.DATABASE_URL || process.env.POSTGRES_URL;

const sequelize = connectionString
    ? new Sequelize(connectionString, {
        dialect: 'postgres',
        dialectModule: require('pg'), // Required for Vercel/Next.js bundling
        logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false, // Essential for many serverless PG providers
            }
        },
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
        dialectModule: require('pg'),
        logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        dialectOptions: env.DB_SSL ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
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

        // Sync models in all environments so new columns (e.g. encryption_salt)
        // are added to the production database automatically.
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synced (Method: alter)');

        // Migrate existing users to 15GB quota
        const FIFTEEN_GB = 15 * 1024 * 1024 * 1024;
        await sequelize.query(
            `UPDATE users SET storage_quota = ${FIFTEEN_GB} WHERE storage_quota < ${FIFTEEN_GB}`
        );
        logger.info('✅ Quota migration check complete');
    } catch (error) {
        logger.error('❌ Unable to connect to PostgreSQL:', error);
        // Important: In serverless, we generally don't want to crash the whole container 
        // immediately as it might prevent cold start retry, but for now reporting is key.
    }
};

module.exports = { sequelize, connectDB };
