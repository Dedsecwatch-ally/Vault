const request = require('supertest');
const app = require('../src/app');

describe('Auth Module', () => {
    beforeEach(async () => {
        await global.cleanTestData();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'TestPassword123',
                    name: 'New User',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user.email).toBe('newuser@example.com');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).not.toHaveProperty('password');
        });

        it('should reject duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'TestPassword123',
                    name: 'First User',
                });

            // Second registration with same email
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'TestPassword123',
                    name: 'Second User',
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should validate email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'TestPassword123',
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should validate password strength', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'weak', // Too short, no number
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login existing user', async () => {
            // Create user first
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'login@example.com',
                    password: 'TestPassword123',
                    name: 'Login User',
                });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'TestPassword123',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('token');
        });

        it('should reject wrong password', async () => {
            // Create user first
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'wrongpass@example.com',
                    password: 'TestPassword123',
                    name: 'Test User',
                });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrongpass@example.com',
                    password: 'WrongPassword123',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'TestPassword123',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const { token } = await global.createTestUser();

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user).toHaveProperty('email');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
