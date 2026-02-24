const app = require('../src/app');
const { connectDB } = require('../src/config/db');

// Ensure DB is connected before handling requests
let dbReady = null;
const ensureDB = () => {
    if (!dbReady) {
        dbReady = connectDB().catch((err) => {
            console.error('DB connection failed:', err.message);
            dbReady = null; // Allow retry on next request
        });
    }
    return dbReady;
};

// Wrap app to await DB connection (ensures quota migration runs)
module.exports = async (req, res) => {
    await ensureDB();
    return app(req, res);
};
