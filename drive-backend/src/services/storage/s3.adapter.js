const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

/**
 * S3 Storage Adapter
 * Implements the storage interface for AWS S3
 */
class S3StorageAdapter {
    constructor(config) {
        this.bucket = config.bucket;
        this.region = config.region;
        this.prefix = config.prefix || 'uploads/';

        this.client = new S3Client({
            region: config.region,
            endpoint: config.endpoint,
            credentials: config.accessKeyId && config.secretAccessKey ? {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            } : undefined, // Use default credentials if not provided
            forcePathStyle: true, // Required for Supabase/MinIO
        });
    }

    /**
     * Generate S3 key for file
     */
    getKey(filename) {
        return `${this.prefix}${filename}`;
    }

    /**
     * Save file to S3
     */
    async save(file) {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const key = this.getKey(filename);

        const fileStream = fs.createReadStream(file.path);

        const upload = new Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: fileStream,
                ContentType: file.mimetype,
            },
        });

        await upload.done();

        // Delete local temp file
        try {
            fs.unlinkSync(file.path);
        } catch (e) {
            // Ignore cleanup errors
        }

        return {
            filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: key,
        };
    }

    /**
     * Delete file from S3
     */
    async delete(filename) {
        const key = this.getKey(filename);

        await this.client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }

    /**
     * Check if file exists in S3
     */
    async exists(filename) {
        try {
            const key = this.getKey(filename);
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file stream from S3
     */
    async getStream(filename) {
        const key = this.getKey(filename);

        const response = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));

        return response.Body;
    }

    /**
     * Get signed URL for file
     */
    getUrl(filename) {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${this.getKey(filename)}`;
    }

    /**
     * Get file path (for S3, returns the key)
     */
    getFilePath(filename) {
        return this.getKey(filename);
    }
}

module.exports = S3StorageAdapter;
