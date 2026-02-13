const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');

describe('Files Module', () => {
    let testUser;
    let testToken;

    beforeEach(async () => {
        await global.cleanTestData();
        const { user, token } = await global.createTestUser();
        testUser = user;
        testToken = token;
    });

    describe('POST /api/files/upload', () => {
        it('should upload a file', async () => {
            // Create a temp test file
            const testFilePath = path.join(__dirname, 'test-upload.txt');
            fs.writeFileSync(testFilePath, 'Test file content');

            try {
                const res = await request(app)
                    .post('/api/files/upload')
                    .set('Authorization', `Bearer ${testToken}`)
                    .attach('file', testFilePath);

                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
                expect(res.body.data.file).toHaveProperty('id');
                expect(res.body.data.file.originalName).toBe('test-upload.txt');
            } finally {
                // Clean up test file
                fs.unlinkSync(testFilePath);
            }
        });

        it('should reject upload without authentication', async () => {
            const testFilePath = path.join(__dirname, 'test-upload2.txt');
            fs.writeFileSync(testFilePath, 'Test content');

            try {
                const res = await request(app)
                    .post('/api/files/upload')
                    .attach('file', testFilePath);

                expect(res.status).toBe(401);
            } finally {
                fs.unlinkSync(testFilePath);
            }
        });

        it('should reject upload without file', async () => {
            const res = await request(app)
                .post('/api/files/upload')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/files', () => {
        it('should list user files', async () => {
            const res = await request(app)
                .get('/api/files')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('files');
            expect(res.body.data).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data.files)).toBe(true);
        });

        it('should respect pagination parameters', async () => {
            const res = await request(app)
                .get('/api/files?page=1&limit=5')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.pagination.limit).toBe(5);
            expect(res.body.data.pagination.page).toBe(1);
        });
    });

    describe('DELETE /api/files/:id', () => {
        it('should soft delete a file', async () => {
            // First upload a file
            const testFilePath = path.join(__dirname, 'test-delete.txt');
            fs.writeFileSync(testFilePath, 'Test content');

            let fileId;
            try {
                const uploadRes = await request(app)
                    .post('/api/files/upload')
                    .set('Authorization', `Bearer ${testToken}`)
                    .attach('file', testFilePath);

                fileId = uploadRes.body.data.file.id;

                // Delete the file
                const deleteRes = await request(app)
                    .delete(`/api/files/${fileId}`)
                    .set('Authorization', `Bearer ${testToken}`);

                expect(deleteRes.status).toBe(200);
                expect(deleteRes.body.success).toBe(true);

                // Verify file is not in list
                const listRes = await request(app)
                    .get('/api/files')
                    .set('Authorization', `Bearer ${testToken}`);

                const fileIds = listRes.body.data.files.map(f => f.id);
                expect(fileIds).not.toContain(fileId);
            } finally {
                fs.unlinkSync(testFilePath);
            }
        });

        it('should return 404 for non-existent file', async () => {
            const res = await request(app)
                .delete('/api/files/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });
});
