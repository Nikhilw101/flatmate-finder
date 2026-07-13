const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints Smoke Tests', () => {
    const testUser = {
        name: 'Test Tenant',
        email: 'tenant@test.com',
        password: 'password123',
        role: 'TENANT'
    };

    let token;

    describe('POST /api/v1/auth/register', () => {
        it('should successfully register a new user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).toHaveProperty('email', testUser.email);
            expect(res.body.data.user).not.toHaveProperty('password');
            
            token = res.body.data.token;
        });

        it('should fail if email is already taken', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('User with this email already exists');
        });

        it('should fail with validation errors for invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'A', // too short
                    email: 'invalid-email',
                    password: '123', // too short
                    role: 'ADMIN' // not allowed during register
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should successfully login existing user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('should fetch user details when token is valid', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email', testUser.email);
        });

        it('should fail when no token is provided', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
        
        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer invalid.token.here`);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
