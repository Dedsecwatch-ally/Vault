const env = require('../config/env');
const logger = require('../utils/logger');

// Storage adapters
const LocalStorageAdapter = require('./storage/local.adapter');
const S3StorageAdapter = require('./storage/s3.adapter');
const GoogleDriveAdapter = require('./storage/gdrive.adapter');

/**
 * Storage Service Factory
 * Returns the appropriate storage adapter based on configuration
 */
class StorageService {
    constructor() {
        this.adapter = this.createAdapter();
        logger.info(`Storage provider initialized: ${env.STORAGE_PROVIDER || 'local'}`);
    }

    createAdapter() {
        const provider = env.STORAGE_PROVIDER || 'local';

        switch (provider) {
            case 's3':
                return new S3StorageAdapter({
                    bucket: env.AWS_S3_BUCKET,
                    region: env.AWS_REGION,
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                    prefix: env.AWS_S3_PREFIX || 'uploads/',
                    endpoint: env.AWS_ENDPOINT,
                });

            case 'gdrive':
                return new GoogleDriveAdapter({
                    clientId: env.GOOGLE_CLIENT_ID,
                    clientSecret: env.GOOGLE_CLIENT_SECRET,
                    refreshToken: env.GOOGLE_REFRESH_TOKEN,
                    folderId: env.GOOGLE_DRIVE_FOLDER_ID,
                });

            case 'local':
            default:
                return new LocalStorageAdapter({
                    uploadDir: env.UPLOAD_DIR,
                });
        }
    }

    /**
     * Get file path
     */
    getFilePath(filename) {
        return this.adapter.getFilePath(filename);
    }

    /**
     * Save file
     */
    async save(file) {
        return this.adapter.save(file);
    }

    /**
     * Delete file
     */
    async delete(filename) {
        try {
            await this.adapter.delete(filename);
            logger.info(`Deleted file: ${filename}`);
        } catch (error) {
            logger.error(`Error deleting file ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Check if file exists
     */
    async exists(filename) {
        return this.adapter.exists(filename);
    }

    /**
     * Get file buffer
     */
    async getBuffer(filename) {
        return this.adapter.getBuffer(filename);
    }

    /**
     * Get a readable stream (supports byte ranges for video seeking)
     */
    async getStream(filename, options = {}) {
        return this.adapter.getStream(filename, options);
    }

    /**
     * Get file URL
     */
    getUrl(filename) {
        return this.adapter.getUrl(filename);
    }
}

module.exports = new StorageService();
