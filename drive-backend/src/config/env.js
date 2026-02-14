const dotenv = require('dotenv');
const path = require('path');

// Load .env file (skip on Vercel — env vars are injected by the platform)
if (!process.env.VERCEL) {
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const env = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,

    // Database
    DATABASE_URL: process.env.DATABASE_URL || null,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    DB_NAME: process.env.DB_NAME || 'drive_db',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_SSL: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Storage
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local', // 'local' or 's3'
    UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50MB default

    // AWS S3 (optional)
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_S3_PREFIX: process.env.AWS_S3_PREFIX || 'uploads/',
    AWS_ENDPOINT: process.env.AWS_ENDPOINT,
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !env[key]);

if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Validate S3 config if provider is s3
if (env.STORAGE_PROVIDER === 's3') {
    const s3RequiredVars = ['AWS_S3_BUCKET', 'AWS_REGION'];
    const missingS3Vars = s3RequiredVars.filter((key) => !env[key]);

    if (missingS3Vars.length > 0) {
        throw new Error(`Missing S3 environment variables: ${missingS3Vars.join(', ')}`);
    }
}

module.exports = env;
