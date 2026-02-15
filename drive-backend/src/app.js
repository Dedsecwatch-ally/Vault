const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const fileRoutes = require('./modules/files/files.routes');
const folderRoutes = require('./modules/folders/folders.routes');
const trashRoutes = require('./modules/trash/trash.routes');
const shareRoutes = require('./modules/shares/shares.routes');
const searchRoutes = require('./modules/search/search.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Temporary debug endpoint
app.get('/debug/storage', (req, res) => {
    const env = require('./config/env');
    res.json({
        provider: env.STORAGE_PROVIDER,
        bucket: env.AWS_S3_BUCKET,
        region: env.AWS_REGION,
        endpoint: env.AWS_ENDPOINT ? '***set***' : 'NOT SET',
        accessKey: env.AWS_ACCESS_KEY_ID ? '***set***' : 'NOT SET',
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/search', searchRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
