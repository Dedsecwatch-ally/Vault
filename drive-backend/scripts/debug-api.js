const http = require('http');
const fs = require('fs');
const path = require('path');

// Config
const API_URL = 'http://localhost:3000/api';
const EMAIL = `test-${Date.now()}@example.com`;
const PASSWORD = 'password123';

// Helper for requests
function request(method, path, headers = {}, body = null, isMultipart = false) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api${path}`,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            const chunks = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                // Try parsing JSON if possible
                try {
                    const json = JSON.parse(buffer.toString());
                    resolve({ status: res.statusCode, headers: res.headers, body: json, raw: buffer });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: buffer.toString(), raw: buffer });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

// Multipart helper (simplified)
function uploadFile(token, filePath) {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const bodyStart = `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n` +
        `Content-Type: text/plain\r\n\r\n`;

    const bodyEnd = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
        Buffer.from(bodyStart),
        fileContent,
        Buffer.from(bodyEnd)
    ]);

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
    };

    return request('POST', '/files/upload', headers, body);
}

// Main execution
(async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await request('POST', '/auth/login', { 'Content-Type': 'application/json' }, JSON.stringify({ email: EMAIL, password: PASSWORD }));

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.body);
            // Try registering if login fails
            console.log('  Login failed, trying registration...');
            const regRes = await request('POST', '/auth/register', { 'Content-Type': 'application/json' }, JSON.stringify({ name: 'Test User', email: EMAIL, password: PASSWORD }));
            if (regRes.status !== 201 && regRes.status !== 200) {
                throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
            }
            var token = regRes.body.token || regRes.body.data.token;
        } else {
            var token = loginRes.body.token || loginRes.body.data.token;
        }

        console.log('  Login successful. Token acquired.');

        // Create a dummy text file
        fs.writeFileSync('test-upload.txt', 'This is a test file for S3 upload/download.');

        console.log('\n2. Uploading test file (test-upload.txt)...');
        const uploadRes = await uploadFile(token, 'test-upload.txt');

        // Cleanup
        try { fs.unlinkSync('test-upload.txt'); } catch (e) { }

        if (uploadRes.status !== 201) {
            console.error('❌ Upload failed:', JSON.stringify(uploadRes.body, null, 2));
            return;
        }

        console.log('✅ Upload successful:', uploadRes.body);
        const fileId = uploadRes.body.data.files[0].id; // Changed to match new array structure

        console.log(`\n3. Downloading file (ID: ${fileId})...`);
        const dlRes = await request('GET', `/files/${fileId}/download`, { 'Authorization': `Bearer ${token}` });

        if (dlRes.status !== 200) {
            console.error('❌ Download failed:', dlRes.status, dlRes.headers['content-type']);
            if (dlRes.headers['content-type'] && dlRes.headers['content-type'].includes('json')) {
                console.error('Error body:', JSON.stringify(dlRes.body, null, 2));
            } else {
                console.error('Response body:', dlRes.body.toString());
            }
            return;
        }

        console.log('✅ Download successful!');
        console.log('  Content-Type:', dlRes.headers['content-type']);
        console.log('  Content-Length:', dlRes.headers['content-length']);
        console.log('  First 100 bytes:', dlRes.raw.slice(0, 100).toString());

    } catch (err) {
        console.error('Unexpected error:', err);
    }
})();
