const fs = require('fs').promises;
const path = require('path');

/**
 * Local Storage Adapter
 * Implements the storage interface for local file system
 */
class LocalStorageAdapter {
    constructor(config) {
        this.uploadDir = config.uploadDir;
        this.ensureUploadDir();
    }

    async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Get file path
     */
    getFilePath(filename) {
        return path.join(this.uploadDir, filename);
    }

    /**
     * Save file (file already saved by multer, just return metadata)
     */
    async save(file) {
        return {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
        };
    }

    /**
     * Delete file
     */
    async delete(filename) {
        const filePath = this.getFilePath(filename);
        await fs.unlink(filePath);
    }

    /**
     * Check if file exists
     */
    async exists(filename) {
        try {
            await fs.access(this.getFilePath(filename));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file buffer for download
     */
    async getBuffer(filename) {
        return fs.readFile(this.getFilePath(filename));
    }

    /**
     * Get file URL (for local, just return path)
     */
    getUrl(filename) {
        return this.getFilePath(filename);
    }
}

module.exports = LocalStorageAdapter;
