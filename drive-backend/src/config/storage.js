const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('./env');
const ApiError = require('../utils/ApiError');

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, env.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Define allowed mime types (expand as needed)
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

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.MAX_FILE_SIZE,
    },
});

module.exports = upload;
