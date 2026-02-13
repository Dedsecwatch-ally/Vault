const winston = require('winston');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
    ],
});

// Add file transport in production
if (env.NODE_ENV === 'production') {
    logger.add(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    );
    logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
