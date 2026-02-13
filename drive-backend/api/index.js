const app = require('../src/app');
const { connectDB } = require('../src/config/db');

// Connect to database (will reuse connection if already established)
connectDB().catch(console.error);

module.exports = app;
