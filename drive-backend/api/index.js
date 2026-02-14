let app;

try {
    app = require('../src/app');
    const { connectDB } = require('../src/config/db');

    // Connect to database (will reuse connection if already established)
    connectDB().catch((err) => console.error('DB connection failed:', err.message));
} catch (err) {
    console.error('FATAL: App failed to initialize:', err);
    // Return a diagnostic handler so we can see the error
    app = (req, res) => {
        res.status(500).json({
            error: 'App initialization failed',
            message: err.message,
            stack: err.stack,
        });
    };
}

module.exports = app;
