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
            if (env.STORAGE_PROVIDER === 's3' || env.NODE_ENV === 'production') {
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
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
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
