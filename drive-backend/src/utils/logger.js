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

// In serverless environments like Vercel, filesystem is read-only.
// We rely on Console transport which Vercel captures.
if (env.NODE_ENV === 'production' && !process.env.VERCEL) {
    // Only verify/write to files if NOT on Vercel (or similar check)
    // For now, let's just stick to Console for simplicity and reliability
}

module.exports = logger;
