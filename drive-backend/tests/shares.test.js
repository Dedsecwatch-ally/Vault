const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');

describe('Shares Module', () => {
    let user1, token1;
    let user2, token2;

    beforeEach(async () => {
        await global.cleanTestData();
        const result1 = await global.createTestUser({ email: 'user1@example.com' });
        user1 = result1.user;
        token1 = result1.token;

        const result2 = await global.createTestUser({ email: 'user2@example.com' });
        user2 = result2.user;
        token2 = result2.token;
    });

    describe('POST /api/shares', () => {
        it('should share a folder with another user', async () => {
            // Create a folder
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'Shared Folder' });

            const folderId = folderRes.body.data.folder.id;

            // Share with user2
            const res = await request(app)
                .post('/api/shares')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                    email: 'user2@example.com',
                    permission: 'view',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should reject sharing with self', async () => {
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'My Folder' });

            const folderId = folderRes.body.data.folder.id;

            const res = await request(app)
                .post('/api/shares')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                    email: 'user1@example.com',
                    permission: 'view',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/shares/public', () => {
        it('should create a public link', async () => {
            // Create a folder
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'Public Folder' });

            const folderId = folderRes.body.data.folder.id;

            // Create public link
            const res = await request(app)
                .post('/api/shares/public')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.token).toHaveLength(64);
        });

        it('should create a password-protected public link', async () => {
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'Protected Folder' });

            const folderId = folderRes.body.data.folder.id;

            const res = await request(app)
                .post('/api/shares/public')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                    password: 'secretpassword',
                });

            expect(res.status).toBe(201);
            expect(res.body.data.hasPassword).toBe(true);
        });
    });

    describe('GET /api/shares/shared-with-me', () => {
        it('should list items shared with user', async () => {
            // User1 creates and shares a folder
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'Shared From User1' });

            const folderId = folderRes.body.data.folder.id;

            await request(app)
                .post('/api/shares')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                    email: 'user2@example.com',
                    permission: 'view',
                });

            // User2 checks shared items
            const res = await request(app)
                .get('/api/shares/shared-with-me')
                .set('Authorization', `Bearer ${token2}`);

            expect(res.status).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/shares/:id', () => {
        it('should revoke a share', async () => {
            // Create and share folder
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'To Unshare' });

            const folderId = folderRes.body.data.folder.id;

            const shareRes = await request(app)
                .post('/api/shares')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    resourceType: 'folder',
                    resourceId: folderId,
                    email: 'user2@example.com',
                    permission: 'view',
                });

            const shareId = shareRes.body.data.share.id;

            // Revoke share
            const res = await request(app)
                .delete(`/api/shares/${shareId}`)
                .set('Authorization', `Bearer ${token1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
