const dotenv = require('dotenv');
const path = require('path');

// Load .env file (skip on Vercel — env vars are injected by the platform)
if (!process.env.VERCEL) {
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const env = {
    // Server
    NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
    PORT: parseInt(process.env.PORT, 10) || 3000,

    // Database
    DATABASE_URL: process.env.DATABASE_URL?.trim() || null,
    DB_HOST: (process.env.DB_HOST || 'localhost').trim(),
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    DB_NAME: (process.env.DB_NAME || 'drive_db').trim(),
    DB_USER: (process.env.DB_USER || 'postgres').trim(),
    DB_PASSWORD: (process.env.DB_PASSWORD || '').trim(),
    DB_SSL: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET?.trim(),
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d').trim(),

    // Storage
    STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local').trim(), // 'local', 's3', or 'gdrive'
    UPLOAD_DIR: (process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')).trim(),
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 500 * 1024 * 1024, // 500MB default (video support)

    // AWS S3 (optional)
    AWS_REGION: process.env.AWS_REGION?.trim(),
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim(),
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET?.trim(),
    AWS_S3_PREFIX: (process.env.AWS_S3_PREFIX || 'uploads/').trim(),
    AWS_ENDPOINT: process.env.AWS_ENDPOINT?.trim(),

    // Google Drive (optional — for 'gdrive' provider)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim(),
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID?.trim(),
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

// Validate Google Drive config if provider is gdrive
if (env.STORAGE_PROVIDER === 'gdrive') {
    const gdriveRequiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_DRIVE_FOLDER_ID'];
    const missingGdriveVars = gdriveRequiredVars.filter((key) => !env[key]);

    if (missingGdriveVars.length > 0) {
        throw new Error(`Missing Google Drive environment variables: ${missingGdriveVars.join(', ')}`);
    }
}

module.exports = env;
