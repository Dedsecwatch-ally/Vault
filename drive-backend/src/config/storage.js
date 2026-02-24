const os = require('os');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const env = require('./env');
const ApiError = require('../utils/ApiError');

/**
 * Storage Configuration
 * - Uses tmp directory in production (e.g., Vercel/S3 uploads)
 * - Uses local upload directory in development
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (['s3', 'gdrive'].includes(env.STORAGE_PROVIDER) || env.NODE_ENV === 'production') {
                cb(null, os.tmpdir());
            } else {
                cb(null, env.UPLOAD_DIR);
            }
        } catch (err) {
            cb(err);
        }
    },

    filename: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname);
            const uniqueName = `${uuidv4()}${ext}`;
            cb(null, uniqueName);
        } catch (err) {
            cb(err);
        }
    },
});

/**
 * File Filter
 * - Restricts allowed file types
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        // Video
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/ogg',
        // Audio
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/aac',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest(`File type ${file.mimetype} is not allowed`), false);
    }
};

/**
 * Multer Upload Configuration
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.MAX_FILE_SIZE, // e.g. 10MB from env
    },
});

module.exports = upload;
