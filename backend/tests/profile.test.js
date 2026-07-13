const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const TenantProfile = require('../src/models/TenantProfile');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async ({ name, email, password = 'password123', role }) => {
    await request(app).post('/api/v1/auth/register').send({ name, email, password, role });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return { token: res.body.data?.token, userId: res.body.data?.user?._id };
};

const VALID_PROFILE = {
    preferredLocation: 'Pune',
    minBudget: 8000,
    maxBudget: 15000,
    moveInDate: '2025-08-15'
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Stage 3 — Tenant Profile QA Tests', () => {
    let tenantToken;
    let tenantUserId;
    let tenant2Token;
    let ownerToken;

    beforeAll(async () => {
        const tenant = await registerAndLogin({
            name: 'QA Tenant One',
            email: 'qa_tenant_1@test.com',
            role: 'TENANT'
        });
        tenantToken = tenant.token;
        tenantUserId = tenant.userId;

        const tenant2 = await registerAndLogin({
            name: 'QA Tenant Two',
            email: 'qa_tenant_2@test.com',
            role: 'TENANT'
        });
        tenant2Token = tenant2.token;

        const owner = await registerAndLogin({
            name: 'QA Owner',
            email: 'qa_owner_profile@test.com',
            role: 'OWNER'
        });
        ownerToken = owner.token;
    });

    afterAll(async () => {
        await TenantProfile.deleteMany({});
    });

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE PROFILE (UPSERT - INSERT)
    // ══════════════════════════════════════════════════════════════════════════

    describe('PUT /api/v1/profile — Create/Update Profile', () => {
        it('✓ Tenant can create profile', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(VALID_PROFILE);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.preferredLocation).toBe('Pune');
            expect(res.body.data.minBudget).toBe(8000);
            expect(res.body.data.maxBudget).toBe(15000);
        });

        it('✓ Missing JWT → 401', async () => {
            const res = await request(app).put('/api/v1/profile').send(VALID_PROFILE);
            expect(res.status).toBe(401);
        });

        it('✓ Invalid JWT → 401', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', 'Bearer invalid.token.here')
                .send(VALID_PROFILE);
            expect(res.status).toBe(401);
        });

        it('✓ OWNER cannot create profile → 403', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(VALID_PROFILE);
            expect(res.status).toBe(403);
        });

        it('✓ Missing required fields → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ preferredLocation: 'Mumbai' }); // Missing budgets & date
            expect(res.status).toBe(400);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it('✓ Empty preferred location → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ ...VALID_PROFILE, preferredLocation: '' });
            expect(res.status).toBe(400);
        });

        it('✓ Negative minimum budget → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ ...VALID_PROFILE, minBudget: -500 });
            expect(res.status).toBe(400);
        });

        it('✓ Negative maximum budget → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ ...VALID_PROFILE, maxBudget: -1000 });
            expect(res.status).toBe(400);
        });

        it('✓ Maximum budget smaller than minimum budget → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ ...VALID_PROFILE, minBudget: 15000, maxBudget: 8000 });
            expect(res.status).toBe(400);
            expect(res.body.errors[0].message).toContain('Maximum budget must be greater than or equal to minimum budget');
        });

        it('✓ Invalid move-in date → 400', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`)
                .send({ ...VALID_PROFILE, moveInDate: 'invalid-date' });
            expect(res.status).toBe(400);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // BUSINESS RULES
    // ══════════════════════════════════════════════════════════════════════════

    describe('Business Rules', () => {
        it('✓ Creating profile twice updates existing profile', async () => {
            // First creation was in the previous suite. Let's update it.
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({ ...VALID_PROFILE, preferredLocation: 'Delhi' });

            expect(res.status).toBe(200);
            expect(res.body.data.preferredLocation).toBe('Delhi');
        });

        it('✓ Only one profile exists per tenant', async () => {
            const count = await TenantProfile.countDocuments({ tenant: tenantUserId });
            expect(count).toBe(1);
        });

        it('✓ Profile belongs to authenticated tenant', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`);
            expect(res.body.data.tenant).toBe(tenantUserId.toString());
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // GET PROFILE
    // ══════════════════════════════════════════════════════════════════════════

    describe('GET /api/v1/profile', () => {
        it('✓ Tenant retrieves own profile', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.preferredLocation).toBe('Delhi'); // From business rule update
        });

        it('✓ Missing JWT → 401', async () => {
            const res = await request(app).get('/api/v1/profile');
            expect(res.status).toBe(401);
        });

        it('✓ OWNER cannot access tenant profile → 403', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.status).toBe(403);
        });

        it('✓ Profile not found → 404', async () => {
            // tenant2 hasn't created a profile yet
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`);
            expect(res.status).toBe(404);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE PROFILE (UPSERT - UPDATE)
    // ══════════════════════════════════════════════════════════════════════════

    describe('Update Profile Logic', () => {
        it('✓ Tenant updates preferred location', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({ ...VALID_PROFILE, preferredLocation: 'Bangalore' });
            expect(res.status).toBe(200);
            expect(res.body.data.preferredLocation).toBe('Bangalore');
        });

        it('✓ Tenant updates budget range', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({ ...VALID_PROFILE, minBudget: 20000, maxBudget: 30000 });
            expect(res.status).toBe(200);
            expect(res.body.data.minBudget).toBe(20000);
            expect(res.body.data.maxBudget).toBe(30000);
        });

        it('✓ Tenant updates move-in date', async () => {
            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send({ ...VALID_PROFILE, moveInDate: '2025-12-01' });
            expect(res.status).toBe(200);
            // Express/Mongoose returns dates as ISO strings
            expect(res.body.data.moveInDate).toContain('2025-12-01');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // DATABASE INTEGRITY
    // ══════════════════════════════════════════════════════════════════════════

    describe('Database Integrity', () => {
        let dbProfile;

        beforeAll(async () => {
            const res = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${tenantToken}`);
            dbProfile = res.body.data;
        });

        it('✓ Profile contains all required fields', () => {
            expect(dbProfile).toHaveProperty('tenant');
            expect(dbProfile).toHaveProperty('preferredLocation');
            expect(dbProfile).toHaveProperty('minBudget');
            expect(dbProfile).toHaveProperty('maxBudget');
            expect(dbProfile).toHaveProperty('moveInDate');
        });

        it('✓ createdAt exists', () => {
            expect(dbProfile).toHaveProperty('createdAt');
        });

        it('✓ updatedAt exists', () => {
            expect(dbProfile).toHaveProperty('updatedAt');
        });

        it('✓ updatedAt changes after update', async () => {
            const before = dbProfile.updatedAt;
            await new Promise(r => setTimeout(r, 10)); // tiny delay

            const res = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`)
                .send(VALID_PROFILE);
            
            expect(res.body.data.updatedAt).not.toBe(before);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECURITY
    // ══════════════════════════════════════════════════════════════════════════

    describe('Security', () => {
        it('✓ Invalid Authorization header → 401', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', 'NotBearer XYZ');
            expect(res.status).toBe(401);
        });

        it('✓ Empty Authorization header → 401', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', '');
            expect(res.status).toBe(401);
        });

        it('✓ Another tenant cannot access another tenant\'s profile', async () => {
            // Because the endpoint does not accept an ID (/api/v1/profile)
            // and strictly uses req.user._id from the verified JWT,
            // IDOR (Insecure Direct Object Reference) is structurally impossible.
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${tenant2Token}`); // tenant2 has no profile
            expect(res.status).toBe(404);
        });

        it('✓ No sensitive user fields returned (e.g. password)', async () => {
            const res = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${tenantToken}`);
            // Mongoose populate isn't used currently on profile, so tenant is just an ID.
            // But if it were, we verify password isn't there.
            expect(res.body.data).not.toHaveProperty('password');
            if (typeof res.body.data.tenant === 'object') {
                expect(res.body.data.tenant).not.toHaveProperty('password');
            }
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SMOKE TEST
    // ══════════════════════════════════════════════════════════════════════════

    describe('🔥 SMOKE TEST — Full Tenant Workflow', () => {
        it('should execute the entire tenant workflow successfully', async () => {
            // 1. Register
            const smokeEmail = `smoke_tenant_${Date.now()}@test.com`;
            const regRes = await request(app).post('/api/v1/auth/register').send({
                name: 'Smoke Tenant',
                email: smokeEmail,
                password: 'smoke123',
                role: 'TENANT'
            });
            expect(regRes.status).toBe(201);

            // 2. Login
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: smokeEmail,
                password: 'smoke123'
            });
            expect(loginRes.status).toBe(200);
            const smokeToken = loginRes.body.data.token;

            // 3. Create Profile
            const createRes = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`)
                .send({
                    preferredLocation: 'Kochi',
                    minBudget: 5000,
                    maxBudget: 10000,
                    moveInDate: '2025-11-01'
                });
            expect(createRes.status).toBe(200);

            // 4. Get Profile
            const getRes = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.data.preferredLocation).toBe('Kochi');

            // 5. Update Preferred Location
            const updateLocRes = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`)
                .send({
                    preferredLocation: 'Trivandrum',
                    minBudget: 5000,
                    maxBudget: 10000,
                    moveInDate: '2025-11-01'
                });
            expect(updateLocRes.status).toBe(200);
            expect(updateLocRes.body.data.preferredLocation).toBe('Trivandrum');

            // 6. Update Budget
            const updateBudRes = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`)
                .send({
                    preferredLocation: 'Trivandrum',
                    minBudget: 6000,
                    maxBudget: 12000,
                    moveInDate: '2025-11-01'
                });
            expect(updateBudRes.status).toBe(200);
            expect(updateBudRes.body.data.maxBudget).toBe(12000);

            // 7. Update Move-in Date
            const updateDateRes = await request(app)
                .put('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`)
                .send({
                    preferredLocation: 'Trivandrum',
                    minBudget: 6000,
                    maxBudget: 12000,
                    moveInDate: '2025-12-01'
                });
            expect(updateDateRes.status).toBe(200);
            expect(updateDateRes.body.data.moveInDate).toContain('2025-12-01');

            // 8. Verify Updated Data
            const finalRes = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${smokeToken}`);
            expect(finalRes.status).toBe(200);
            expect(finalRes.body.data.preferredLocation).toBe('Trivandrum');
            expect(finalRes.body.data.minBudget).toBe(6000);
            expect(finalRes.body.data.maxBudget).toBe(12000);
            expect(finalRes.body.data.moveInDate).toContain('2025-12-01');
        });
    });
});
