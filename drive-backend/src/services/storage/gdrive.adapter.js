const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Google Drive Storage Adapter (OAuth2)
 * Implements the storage interface for Google Drive
 * Works on Vercel serverless — credentials from env vars
 */
class GoogleDriveAdapter {
    constructor(config) {
        this.configuredFolderId = config.folderId;
        this.resolvedFolderId = null;
        this.prefix = config.prefix || 'vault_';

        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
        );

        oauth2Client.setCredentials({
            refresh_token: config.refreshToken,
        });

        this.drive = google.drive({ version: 'v3', auth: oauth2Client });

        console.log(`[GDrive] Initialized with configured folderId=${config.folderId}`);
    }

    /**
     * Get or create the vault folder
     * Falls back to creating a "Vault Files" folder if configured ID is inaccessible
     */
    async getFolderId() {
        if (this.resolvedFolderId) return this.resolvedFolderId;

        // Try the configured folder first
        try {
            await this.drive.files.get({
                fileId: this.configuredFolderId,
                fields: 'id,name',
            });
            this.resolvedFolderId = this.configuredFolderId;
            console.log(`[GDrive] Using configured folder: ${this.configuredFolderId}`);
            return this.resolvedFolderId;
        } catch (err) {
            console.log(`[GDrive] Configured folder inaccessible (${err.message}), looking for Vault Files folder...`);
        }

        // Search for existing "Vault Files" folder
        const searchRes = await this.drive.files.list({
            q: "name='Vault Files' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (searchRes.data.files?.length > 0) {
            this.resolvedFolderId = searchRes.data.files[0].id;
            console.log(`[GDrive] Found existing Vault Files folder: ${this.resolvedFolderId}`);
            return this.resolvedFolderId;
        }

        // Create "Vault Files" folder
        const createRes = await this.drive.files.create({
            requestBody: {
                name: 'Vault Files',
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id, name',
        });

        this.resolvedFolderId = createRes.data.id;
        console.log(`[GDrive] Created Vault Files folder: ${this.resolvedFolderId}`);
        return this.resolvedFolderId;
    }

    /**
     * Find file in Drive by name
     */
    async findFileByName(filename) {
        const folderId = await this.getFolderId();
        const res = await this.drive.files.list({
            q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size, webContentLink)',
            spaces: 'drive',
        });
        return res.data.files?.[0] || null;
    }

    /**
     * Save file to Google Drive
     */
    async save(file) {
        const ext = path.extname(file.originalname);
        const filename = `${this.prefix}${uuidv4()}${ext}`;
        const folderId = await this.getFolderId();

        try {
            const fileStream = fs.createReadStream(file.path);

            const res = await this.drive.files.create({
                requestBody: {
                    name: filename,
                    parents: [folderId],
                    mimeType: file.mimetype,
                },
                media: {
                    mimeType: file.mimetype,
                    body: fileStream,
                },
                fields: 'id, name',
            });

            console.log(`[GDrive] Uploaded: ${filename} → ${res.data.id}`);
        } catch (err) {
            console.error('[GDrive] Upload failed:', {
                message: err.message,
                code: err.code,
                filename,
                folderId,
            });

            const error = new Error(`Google Drive upload failed: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }

        // Delete local temp file (Vercel uses /tmp)
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
            path: filename,
        };
    }

    /**
     * Delete file from Google Drive
     */
    async delete(filename) {
        const file = await this.findFileByName(filename);
        if (!file) return;

        await this.drive.files.delete({ fileId: file.id });
        console.log(`[GDrive] Deleted: ${filename}`);
    }

    /**
     * Check if file exists in Google Drive
     */
    async exists(filename) {
        const file = await this.findFileByName(filename);
        return !!file;
    }

    /**
     * Get file buffer from Google Drive
     */
    async getBuffer(filename) {
        const file = await this.findFileByName(filename);
        if (!file) {
            const error = new Error(`File not found in Drive: ${filename}`);
            error.statusCode = 404;
            throw error;
        }

        const res = await this.drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(res.data);
    }

    /**
     * Get a readable stream from Google Drive
     */
    async getStream(filename, options = {}) {
        const file = await this.findFileByName(filename);
        if (!file) {
            const error = new Error(`File not found in Drive: ${filename}`);
            error.statusCode = 404;
            throw error;
        }

        const res = await this.drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
        );

        const stream = res.data;

        // Handle byte range requests (for video seeking)
        if (options.start !== undefined || options.end !== undefined) {
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const start = options.start || 0;
            const end = options.end || buffer.length - 1;
            const sliced = buffer.slice(start, end + 1);
            return Readable.from(sliced);
        }

        return stream;
    }

    /**
     * Get file URL
     */
    getUrl(filename) {
        return `/api/files/download/${filename}`;
    }

    /**
     * Get file path (returns the filename used as lookup key)
     */
    getFilePath(filename) {
        return filename;
    }
}

module.exports = GoogleDriveAdapter;
