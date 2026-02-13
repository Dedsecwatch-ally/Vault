const request = require('supertest');
const app = require('../src/app');

describe('Folders Module', () => {
    let testUser;
    let testToken;

    beforeEach(async () => {
        await global.cleanTestData();
        const { user, token } = await global.createTestUser();
        testUser = user;
        testToken = token;
    });

    describe('POST /api/folders', () => {
        it('should create a root folder', async () => {
            const res = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'My Documents' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.folder).toHaveProperty('id');
            expect(res.body.data.folder.name).toBe('My Documents');
            expect(res.body.data.folder.parentId).toBeNull();
        });

        it('should create a nested folder', async () => {
            // Create parent folder
            const parentRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Parent Folder' });

            const parentId = parentRes.body.data.folder.id;

            // Create child folder
            const res = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Child Folder', parentId });

            expect(res.status).toBe(201);
            expect(res.body.data.folder.parentId).toBe(parentId);
        });

        it('should reject duplicate folder names in same parent', async () => {
            // Create first folder
            await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Duplicate Name' });

            // Try to create folder with same name
            const res = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Duplicate Name' });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/folders', () => {
        it('should list root folders', async () => {
            // Create some folders
            await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Folder 1' });

            await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Folder 2' });

            const res = await request(app)
                .get('/api/folders')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.folders.length).toBe(2);
        });
    });

    describe('GET /api/folders/:id/contents', () => {
        it('should get folder contents', async () => {
            // Create a folder
            const folderRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Container Folder' });

            const folderId = folderRes.body.data.folder.id;

            // Create subfolder
            await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Subfolder', parentId: folderId });

            const res = await request(app)
                .get(`/api/folders/${folderId}/contents`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('folders');
            expect(res.body.data).toHaveProperty('files');
            expect(res.body.data.folders.length).toBe(1);
        });
    });

    describe('PATCH /api/folders/:id', () => {
        it('should rename a folder', async () => {
            // Create folder
            const createRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Old Name' });

            const folderId = createRes.body.data.folder.id;

            // Rename
            const res = await request(app)
                .patch(`/api/folders/${folderId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'New Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.folder.name).toBe('New Name');
        });
    });

    describe('DELETE /api/folders/:id', () => {
        it('should soft delete a folder', async () => {
            // Create folder
            const createRes = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'To Delete' });

            const folderId = createRes.body.data.folder.id;

            // Delete
            const res = await request(app)
                .delete(`/api/folders/${folderId}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify not in list
            const listRes = await request(app)
                .get('/api/folders')
                .set('Authorization', `Bearer ${testToken}`);

            const folderIds = listRes.body.data.folders.map(f => f.id);
            expect(folderIds).not.toContain(folderId);
        });
    });

    describe('POST /api/folders/:id/move', () => {
        it('should move a folder to new parent', async () => {
            // Create source and destination folders
            const folder1Res = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Source Folder' });

            const folder2Res = await request(app)
                .post('/api/folders')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Destination Folder' });

            const sourceId = folder1Res.body.data.folder.id;
            const destId = folder2Res.body.data.folder.id;

            // Move source into destination
            const res = await request(app)
                .post(`/api/folders/${sourceId}/move`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({ newParentId: destId });

            expect(res.status).toBe(200);
            expect(res.body.data.folder.parentId).toBe(destId);
        });
    });
});
