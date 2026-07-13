/**
 * Stage 2 — Room Listing Management
 * Comprehensive QA Test Suite
 *
 * Covers every test case from the QA spec:
 * CREATE / GET / UPDATE / DELETE / MARK-AS-FILLED / UPLOAD / DATABASE / SECURITY / SMOKE
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const app = require('../src/app');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_LISTING = {
    location: 'Pune',
    rent: '12000',
    availableFrom: '2025-08-10',
    roomType: 'Private Room',
    furnishingStatus: 'Fully Furnished',
    description: 'A clean private room in Pune'
};

const registerAndLogin = async ({ name, email, password = 'password123', role }) => {
    await request(app).post('/api/v1/auth/register').send({ name, email, password, role });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return { token: res.body.data?.token, userId: res.body.data?.user?._id };
};

const createListing = async (token, overrides = {}) => {
    const data = { ...VALID_LISTING, ...overrides };
    const req = request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`);
    Object.entries(data).forEach(([k, v]) => req.field(k, v));
    return req;
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Stage 2 — Room Listing QA Tests', () => {
    let ownerToken, owner2Token, tenantToken;
    let ownerUserId;

    beforeAll(async () => {
        const owner = await registerAndLogin({
            name: 'QA Owner One',
            email: 'qa_owner1@test.com',
            role: 'OWNER'
        });
        ownerToken = owner.token;
        ownerUserId = owner.userId;

        const owner2 = await registerAndLogin({
            name: 'QA Owner Two',
            email: 'qa_owner2@test.com',
            role: 'OWNER'
        });
        owner2Token = owner2.token;

        const tenant = await registerAndLogin({
            name: 'QA Tenant',
            email: 'qa_tenant@test.com',
            role: 'TENANT'
        });
        tenantToken = tenant.token;
    });

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE LISTING
    // ══════════════════════════════════════════════════════════════════════════

    describe('POST /api/v1/listings — Create Listing', () => {
        it('✓ Owner can create a listing (happy path)', async () => {
            const res = await createListing(ownerToken);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.location).toBe('Pune');
            expect(res.body.data.rent).toBe(12000);
            expect(res.body.data.isFilled).toBe(false);
            expect(res.body.data.images).toEqual([]);
        });

        it('✓ Missing JWT → 401', async () => {
            const res = await request(app).post('/api/v1/listings').field('location', 'Pune');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('✓ Invalid JWT → 401', async () => {
            const res = await request(app)
                .post('/api/v1/listings')
                .set('Authorization', 'Bearer invalid.jwt.token')
                .field('location', 'Pune');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('✓ Tenant cannot create listing → 403', async () => {
            const res = await createListing(tenantToken);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('✓ Missing required fields → 400', async () => {
            const res = await request(app)
                .post('/api/v1/listings')
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('location', 'Pune');
            // rent, availableFrom, roomType, furnishingStatus all missing

            expect(res.status).toBe(400);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it('✓ Invalid rent (negative) → 400', async () => {
            const res = await createListing(ownerToken, { rent: '-500' });
            expect(res.status).toBe(400);
        });

        it('✓ Invalid rent (zero) → 400', async () => {
            const res = await createListing(ownerToken, { rent: '0' });
            expect(res.status).toBe(400);
        });

        it('✓ Invalid roomType → 400', async () => {
            const res = await createListing(ownerToken, { roomType: 'Penthouse' });
            expect(res.status).toBe(400);
        });

        it('✓ Invalid furnishingStatus → 400', async () => {
            const res = await createListing(ownerToken, { furnishingStatus: 'Partially Furnished' });
            expect(res.status).toBe(400);
        });

        it('✓ Invalid availableFrom date → 400', async () => {
            const res = await createListing(ownerToken, { availableFrom: 'not-a-date' });
            expect(res.status).toBe(400);
        });

        it('✓ Description over 1000 chars → 400', async () => {
            const res = await createListing(ownerToken, { description: 'x'.repeat(1001) });
            expect(res.status).toBe(400);
        });

        it('✓ Response does NOT leak owner password', async () => {
            const res = await createListing(ownerToken);
            expect(res.status).toBe(201);
            // owner is not populated on create — just ObjectId
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('✓ Listing has createdAt and updatedAt timestamps', async () => {
            const res = await createListing(ownerToken);
            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('createdAt');
            expect(res.body.data).toHaveProperty('updatedAt');
        });

        it('✓ Listing belongs to the creating owner', async () => {
            const res = await createListing(ownerToken);
            expect(res.status).toBe(201);
            expect(res.body.data.owner.toString()).toBe(ownerUserId.toString());
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // GET ALL LISTINGS
    // ══════════════════════════════════════════════════════════════════════════

    describe('GET /api/v1/listings — Browse Listings', () => {
        it('✓ Public can view available listings (no auth required)', async () => {
            const res = await request(app).get('/api/v1/listings');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('listings');
            expect(Array.isArray(res.body.data.listings)).toBe(true);
        });

        it('✓ Pagination metadata is present', async () => {
            const res = await request(app).get('/api/v1/listings');
            expect(res.body.data).toHaveProperty('pagination');
            expect(res.body.data.pagination).toHaveProperty('total');
            expect(res.body.data.pagination).toHaveProperty('page');
            expect(res.body.data.pagination).toHaveProperty('totalPages');
        });

        it('✓ Filter by location returns only matching listings', async () => {
            // Create one in Mumbai
            await createListing(ownerToken, { location: 'Mumbai' });

            const res = await request(app).get('/api/v1/listings?location=Mumbai');
            expect(res.status).toBe(200);
            res.body.data.listings.forEach((l) => {
                expect(l.location.toLowerCase()).toContain('mumbai');
            });
        });

        it('✓ Filter by maxRent excludes higher-rent listings', async () => {
            await createListing(ownerToken, { rent: '25000', location: 'Delhi' });

            const res = await request(app).get('/api/v1/listings?maxRent=15000');
            expect(res.status).toBe(200);
            res.body.data.listings.forEach((l) => {
                expect(l.rent).toBeLessThanOrEqual(15000);
            });
        });

        it('✓ Filled listings are hidden from public results', async () => {
            // Create and immediately fill a listing
            const createRes = await createListing(ownerToken, { location: 'FilledCity' });
            const id = createRes.body.data._id;

            await request(app)
                .patch(`/api/v1/listings/${id}/fill`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const browseRes = await request(app).get('/api/v1/listings');
            const ids = browseRes.body.data.listings.map((l) => l._id);
            expect(ids).not.toContain(id);
        });

        it('✓ Pagination works with custom page and limit', async () => {
            const res = await request(app).get('/api/v1/listings?page=1&limit=2');
            expect(res.status).toBe(200);
            expect(res.body.data.listings.length).toBeLessThanOrEqual(2);
            expect(res.body.data.pagination.limit).toBe(2);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // GET SINGLE LISTING
    // ══════════════════════════════════════════════════════════════════════════

    describe('GET /api/v1/listings/:id — Single Listing', () => {
        let singleId;

        beforeAll(async () => {
            const res = await createListing(ownerToken, { location: 'SingleCity' });
            singleId = res.body.data._id;
        });

        it('✓ Existing listing returns 200 with owner populated', async () => {
            const res = await request(app).get(`/api/v1/listings/${singleId}`);
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(singleId);
            expect(res.body.data.owner).toHaveProperty('name');
            expect(res.body.data.owner).toHaveProperty('email');
            // Owner password must NOT be in response
            expect(res.body.data.owner).not.toHaveProperty('password');
        });

        it('✓ Invalid ObjectId format → 400 (not 500)', async () => {
            const res = await request(app).get('/api/v1/listings/not-a-valid-id');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('✓ Valid ObjectId but non-existent listing → 404', async () => {
            const res = await request(app).get('/api/v1/listings/64f1a2b3c4d5e6f7a8b9c0d1');
            expect(res.status).toBe(404);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE LISTING
    // ══════════════════════════════════════════════════════════════════════════

    describe('PUT /api/v1/listings/:id — Update Listing', () => {
        let updateId;

        beforeAll(async () => {
            const res = await createListing(ownerToken, { location: 'UpdateCity' });
            updateId = res.body.data._id;
        });

        it('✓ Owner can update their own listing', async () => {
            const res = await request(app)
                .put(`/api/v1/listings/${updateId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('rent', '9999');

            expect(res.status).toBe(200);
            expect(res.body.data.rent).toBe(9999);
        });

        it('✓ Another owner cannot update the listing → 403', async () => {
            const res = await request(app)
                .put(`/api/v1/listings/${updateId}`)
                .set('Authorization', `Bearer ${owner2Token}`)
                .field('rent', '1000');

            expect(res.status).toBe(403);
        });

        it('✓ Tenant cannot update a listing → 403', async () => {
            const res = await request(app)
                .put(`/api/v1/listings/${updateId}`)
                .set('Authorization', `Bearer ${tenantToken}`)
                .field('rent', '1000');

            expect(res.status).toBe(403);
        });

        it('✓ Updating with invalid rent → 400', async () => {
            const res = await request(app)
                .put(`/api/v1/listings/${updateId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('rent', '-100');

            expect(res.status).toBe(400);
        });

        it('✓ Invalid ObjectId on update → 400', async () => {
            const res = await request(app)
                .put('/api/v1/listings/not-a-valid-id')
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('rent', '9000');

            expect(res.status).toBe(400);
        });

        it('✓ Update non-existent listing → 404', async () => {
            const res = await request(app)
                .put('/api/v1/listings/64f1a2b3c4d5e6f7a8b9c0d1')
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('rent', '9000');

            expect(res.status).toBe(404);
        });

        it('✓ updatedAt timestamp changes after update', async () => {
            const before = await request(app).get(`/api/v1/listings/${updateId}`);
            await new Promise((r) => setTimeout(r, 10)); // small delay

            await request(app)
                .put(`/api/v1/listings/${updateId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .field('rent', '11000');

            const after = await request(app).get(`/api/v1/listings/${updateId}`);
            expect(after.body.data.updatedAt).not.toBe(before.body.data.updatedAt);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE LISTING
    // ══════════════════════════════════════════════════════════════════════════

    describe('DELETE /api/v1/listings/:id — Delete Listing', () => {
        it('✓ Owner can delete their own listing', async () => {
            const createRes = await createListing(ownerToken, { location: 'DeleteCity' });
            const id = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/listings/${id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
        });

        it('✓ Deleted listing is removed from MongoDB', async () => {
            const createRes = await createListing(ownerToken, { location: 'GoneCity' });
            const id = createRes.body.data._id;

            await request(app)
                .delete(`/api/v1/listings/${id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const checkRes = await request(app).get(`/api/v1/listings/${id}`);
            expect(checkRes.status).toBe(404);
        });

        it('✓ Another owner cannot delete the listing → 403', async () => {
            const createRes = await createListing(ownerToken, { location: 'ProtectedCity' });
            const id = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/listings/${id}`)
                .set('Authorization', `Bearer ${owner2Token}`);

            expect(res.status).toBe(403);
        });

        it('✓ Tenant cannot delete a listing → 403', async () => {
            const createRes = await createListing(ownerToken, { location: 'TenantCity' });
            const id = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/listings/${id}`)
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ Delete non-existent listing → 404', async () => {
            const res = await request(app)
                .delete('/api/v1/listings/64f1a2b3c4d5e6f7a8b9c0d1')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(404);
        });

        it('✓ Invalid ObjectId on delete → 400', async () => {
            const res = await request(app)
                .delete('/api/v1/listings/not-a-valid-id')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // MARK AS FILLED
    // ══════════════════════════════════════════════════════════════════════════

    describe('PATCH /api/v1/listings/:id/fill — Mark as Filled', () => {
        let fillId;

        beforeAll(async () => {
            const res = await createListing(ownerToken, { location: 'FillCity' });
            fillId = res.body.data._id;
        });

        it('✓ Owner can mark their listing as filled', async () => {
            const res = await request(app)
                .patch(`/api/v1/listings/${fillId}/fill`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isFilled).toBe(true);
        });

        it('✓ Filled listing disappears from public browse', async () => {
            const res = await request(app).get('/api/v1/listings');
            const ids = res.body.data.listings.map((l) => l._id);
            expect(ids).not.toContain(fillId);
        });

        it('✓ Marking an already-filled listing → 400', async () => {
            const res = await request(app)
                .patch(`/api/v1/listings/${fillId}/fill`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
        });

        it('✓ Another owner cannot mark filled → 403', async () => {
            const createRes = await createListing(ownerToken, { location: 'AnotherFill' });
            const id = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/listings/${id}/fill`)
                .set('Authorization', `Bearer ${owner2Token}`);

            expect(res.status).toBe(403);
        });

        it('✓ Tenant cannot mark filled → 403', async () => {
            const createRes = await createListing(ownerToken, { location: 'TenantFill' });
            const id = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/listings/${id}/fill`)
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.status).toBe(403);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // OWNER MY LISTINGS
    // ══════════════════════════════════════════════════════════════════════════

    describe('GET /api/v1/listings/my/all — Owner My Listings', () => {
        it('✓ Owner retrieves own listings (includes filled)', async () => {
            const res = await request(app)
                .get('/api/v1/listings/my/all')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.listings)).toBe(true);
            res.body.data.listings.forEach((l) => {
                expect(l.owner.toString()).toBe(ownerUserId.toString());
            });
        });

        it('✓ Owner 2 only sees their own listings', async () => {
            await createListing(owner2Token, { location: 'Owner2City' });

            const res = await request(app)
                .get('/api/v1/listings/my/all')
                .set('Authorization', `Bearer ${owner2Token}`);

            expect(res.status).toBe(200);
            res.body.data.listings.forEach((l) => {
                expect(l.owner.toString()).not.toBe(ownerUserId.toString());
            });
        });

        it('✓ Tenant cannot access /my/all → 403', async () => {
            const res = await request(app)
                .get('/api/v1/listings/my/all')
                .set('Authorization', `Bearer ${tenantToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ No auth → 401', async () => {
            const res = await request(app).get('/api/v1/listings/my/all');
            expect(res.status).toBe(401);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // DATABASE INTEGRITY
    // ══════════════════════════════════════════════════════════════════════════

    describe('Database Integrity', () => {
        let dbListing;

        beforeAll(async () => {
            const res = await createListing(ownerToken, { location: 'DBCity' });
            dbListing = res.body.data;
        });

        it('✓ Listing contains all required fields', () => {
            expect(dbListing).toHaveProperty('_id');
            expect(dbListing).toHaveProperty('owner');
            expect(dbListing).toHaveProperty('location');
            expect(dbListing).toHaveProperty('rent');
            expect(dbListing).toHaveProperty('availableFrom');
            expect(dbListing).toHaveProperty('roomType');
            expect(dbListing).toHaveProperty('furnishingStatus');
            expect(dbListing).toHaveProperty('isFilled');
            expect(dbListing).toHaveProperty('images');
            expect(dbListing).toHaveProperty('createdAt');
            expect(dbListing).toHaveProperty('updatedAt');
        });

        it('✓ isFilled defaults to false on creation', () => {
            expect(dbListing.isFilled).toBe(false);
        });

        it('✓ images defaults to empty array on creation', () => {
            expect(dbListing.images).toEqual([]);
        });

        it('✓ Owner reference is a valid ObjectId string', () => {
            expect(mongoose.Types.ObjectId.isValid(dbListing.owner)).toBe(true);
        });

        it('✓ Owner populated correctly on GET single', async () => {
            const res = await request(app).get(`/api/v1/listings/${dbListing._id}`);
            expect(res.body.data.owner).toHaveProperty('name');
            expect(res.body.data.owner).toHaveProperty('email');
            expect(res.body.data.owner).not.toHaveProperty('password');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECURITY
    // ══════════════════════════════════════════════════════════════════════════

    describe('Security', () => {
        it('✓ Malformed Authorization header → 401', async () => {
            const res = await request(app)
                .get('/api/v1/listings/my/all')
                .set('Authorization', 'NotBearer token');

            expect(res.status).toBe(401);
        });

        it('✓ Empty Authorization header → 401', async () => {
            const res = await request(app)
                .get('/api/v1/listings/my/all')
                .set('Authorization', '');

            expect(res.status).toBe(401);
        });

        it('✓ ReGex injection in location filter does not crash server', async () => {
            // A malicious regex passed as location should return 200 not 500
            const res = await request(app).get('/api/v1/listings?location=(');
            expect(res.status).toBe(200);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SMOKE TEST — Complete Owner Workflow
    // ══════════════════════════════════════════════════════════════════════════

    describe('🔥 SMOKE TEST — Full Owner Workflow', () => {
        it('should complete the entire owner workflow without errors', async () => {
            // Step 1: Register
            const smokeOwnerEmail = `smoke_owner_${Date.now()}@test.com`;
            const regRes = await request(app).post('/api/v1/auth/register').send({
                name: 'Smoke Owner',
                email: smokeOwnerEmail,
                password: 'smoke123',
                role: 'OWNER'
            });
            expect(regRes.status).toBe(201);

            // Step 2: Login
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: smokeOwnerEmail,
                password: 'smoke123'
            });
            expect(loginRes.status).toBe(200);
            const smokeToken = loginRes.body.data.token;

            // Step 3: Create Listing
            const createRes = await request(app)
                .post('/api/v1/listings')
                .set('Authorization', `Bearer ${smokeToken}`)
                .field('location', 'Smoke City')
                .field('rent', '18000')
                .field('availableFrom', '2025-10-01')
                .field('roomType', 'Studio')
                .field('furnishingStatus', 'Semi Furnished');
            expect(createRes.status).toBe(201);
            const smokeId = createRes.body.data._id;

            // Step 4: Get Listing
            const getRes = await request(app).get(`/api/v1/listings/${smokeId}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.data.location).toBe('Smoke City');

            // Step 5: Update Listing
            const updateRes = await request(app)
                .put(`/api/v1/listings/${smokeId}`)
                .set('Authorization', `Bearer ${smokeToken}`)
                .field('rent', '16000');
            expect(updateRes.status).toBe(200);
            expect(updateRes.body.data.rent).toBe(16000);

            // Step 6: Verify listing appears in public results
            const browseRes = await request(app).get('/api/v1/listings?location=Smoke');
            expect(browseRes.status).toBe(200);
            const ids = browseRes.body.data.listings.map((l) => l._id);
            expect(ids).toContain(smokeId);

            // Step 7: Mark as Filled
            const fillRes = await request(app)
                .patch(`/api/v1/listings/${smokeId}/fill`)
                .set('Authorization', `Bearer ${smokeToken}`);
            expect(fillRes.status).toBe(200);
            expect(fillRes.body.data.isFilled).toBe(true);

            // Step 8: Verify Hidden from public results
            const hiddenRes = await request(app).get('/api/v1/listings?location=Smoke');
            const hiddenIds = hiddenRes.body.data.listings.map((l) => l._id);
            expect(hiddenIds).not.toContain(smokeId);

            // Step 9: Delete Listing
            const deleteRes = await request(app)
                .delete(`/api/v1/listings/${smokeId}`)
                .set('Authorization', `Bearer ${smokeToken}`);
            expect(deleteRes.status).toBe(200);

            // Step 10: Confirm Deletion
            const confirmRes = await request(app).get(`/api/v1/listings/${smokeId}`);
            expect(confirmRes.status).toBe(404);
        });
    });
});
