/**
 * One-time OAuth2 authorization script for Google Drive.
 * 
 * Run this once to get a refresh token:
 *   node scripts/gdrive-auth.js
 * 
 * It will open your browser for Google consent.
 * After authorizing, it prints the refresh token.
 * Save that refresh token as GOOGLE_REFRESH_TOKEN env var.
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('child_process').exec;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:9876/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables first.');
    console.error('Example: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/gdrive-auth.js');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function main() {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Force consent to get refresh token
    });

    console.log('\n🔐 Google Drive Authorization');
    console.log('=============================\n');
    console.log('Opening browser for Google consent...\n');
    console.log('If the browser does not open, visit this URL manually:\n');
    console.log(authUrl);
    console.log('');

    // Open browser
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    open(`${cmd} "${authUrl}"`);

    // Start local server to catch the callback
    return new Promise((resolve) => {
        const server = http.createServer(async (req, res) => {
            const parsedUrl = url.parse(req.url, true);

            if (parsedUrl.pathname === '/oauth2callback') {
                const code = parsedUrl.query.code;

                if (!code) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('<h2>Error: No authorization code received.</h2>');
                    return;
                }

                try {
                    const { tokens } = await oauth2Client.getToken(code);

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html><body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #F8FAFC;">
                            <div style="text-align: center; background: #fff; padding: 48px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                <h1 style="color: #0F172A; font-size: 24px;">✅ Authorization Successful!</h1>
                                <p style="color: #475569; font-size: 14px; margin-top: 8px;">You can close this tab and return to the terminal.</p>
                            </div>
                        </body></html>
                    `);

                    console.log('\n✅ Authorization successful!\n');
                    console.log('=== YOUR REFRESH TOKEN ===\n');
                    console.log(tokens.refresh_token);
                    console.log('\n==========================\n');
                    console.log('Add this to your .env file:');
                    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

                    server.close();
                    resolve(tokens);
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end(`<h2>Error: ${err.message}</h2>`);
                    console.error('Token exchange failed:', err.message);
                }
            }
        });

        server.listen(9876, () => {
            console.log('Waiting for authorization callback on port 9876...\n');
        });
    });
}

main().then(() => process.exit(0)).catch((err) => {
    console.error('Auth failed:', err);
    process.exit(1);
});
