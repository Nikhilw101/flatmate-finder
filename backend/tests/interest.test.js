/**
 * Stage 5 — Interest Request System
 * Comprehensive test suite
 *
 * Tests cover:
 *   - TENANT expresses interest (all validation rules)
 *   - Business rule: must have profile first
 *   - Business rule: listing must be active
 *   - Business rule: cannot interest own listing
 *   - Business rule: compatibility score must exist
 *   - Duplicate prevention (409)
 *   - OWNER views incoming requests
 *   - OWNER accepts → chat room created
 *   - OWNER declines → no chat room
 *   - Immutability: cannot change already-resolved status
 *   - Authorization checks
 *   - Smoke test: full interest lifecycle
 */

const request = require('supertest');
const app = require('../src/app');
const Interest = require('../src/models/Interest');
const Chat = require('../src/models/Chat');
const Compatibility = require('../src/models/Compatibility');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async ({ name, email, password = 'password123', role }) => {
    await request(app).post('/api/v1/auth/register').send({ name, email, password, role });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return { token: res.body.data?.token, userId: res.body.data?.user?._id };
};

const createListing = async (token, overrides = {}) => {
    const defaults = {
        location: 'Mumbai',
        rent: '15000',
        availableFrom: '2025-09-01',
        roomType: 'Private Room',
        furnishingStatus: 'Fully Furnished'
    };
    const data = { ...defaults, ...overrides };
    const req = request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`);
    Object.entries(data).forEach(([k, v]) => req.field(k, v));
    return req;
};

const createProfile = (token, overrides = {}) =>
    request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
            preferredLocation: 'Mumbai',
            minBudget: 10000,
            maxBudget: 20000,
            moveInDate: '2025-09-01',
            ...overrides
        });

// Helper: directly inject a Compatibility record to avoid network calls
const injectCompatibility = async (tenantId, listingId) => {
    return Compatibility.findOneAndUpdate(
        { tenant: tenantId, listing: listingId },
        {
            $set: {
                score: 90,
                explanation: 'Good match.',
                engine: 'RULE',
                generatedAt: new Date()
            }
        },
        { upsert: true, new: true }
    );
};

// ─── Shared Setup ─────────────────────────────────────────────────────────────

let ownerToken, ownerId, tenantToken, tenantId, listingId;
let owner2Token;

beforeAll(async () => {
    const owner = await registerAndLogin({ name: 'Int Owner', email: 'int_owner@test.com', role: 'OWNER' });
    ownerToken = owner.token; ownerId = owner.userId;

    const owner2 = await registerAndLogin({ name: 'Int Owner2', email: 'int_owner2@test.com', role: 'OWNER' });
    owner2Token = owner2.token;

    const tenant = await registerAndLogin({ name: 'Int Tenant', email: 'int_tenant@test.com', role: 'TENANT' });
    tenantToken = tenant.token; tenantId = tenant.userId;

    const listRes = await createListing(ownerToken, { location: 'Mumbai', rent: '15000' });
    listingId = listRes.body.data._id;

    await createProfile(tenantToken);
    await new Promise(r => setTimeout(r, 300)); // wait for fire-and-forget scores
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. EXPRESS INTEREST
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/interests — Express Interest', () => {
    it('✓ Tenant can express interest (happy path)', async () => {
        await injectCompatibility(tenantId, listingId);

        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ listingId });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('PENDING');
        expect(res.body.data.listing.location).toBe('Mumbai');
    });

    it('✓ Missing JWT → 401', async () => {
        const res = await request(app).post('/api/v1/interests').send({ listingId });
        expect(res.status).toBe(401);
    });

    it('✓ OWNER cannot express interest → 403', async () => {
        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ listingId });
        expect(res.status).toBe(403);
    });

    it('✓ Missing listingId → 400', async () => {
        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it('✓ Non-existent listing → 404', async () => {
        const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';
        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ listingId: fakeId });
        expect(res.status).toBe(404);
    });

    it('✓ Duplicate interest → 409', async () => {
        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ listingId });
        expect(res.status).toBe(409);
        expect(res.body.message).toContain('already expressed interest');
    });

    it('✓ Tenant without profile → 400', async () => {
        const noProfile = await registerAndLogin({
            name: 'No Profile Tenant',
            email: 'no_profile_tenant@test.com',
            role: 'TENANT'
        });
        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${noProfile.token}`)
            .send({ listingId });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('profile');
    });

    it('✓ Tenant without compatibility score → 400', async () => {
        // Fresh tenant with a profile but no compatibility score
        const freshTenant = await registerAndLogin({
            name: 'Fresh Tenant',
            email: 'fresh_compat_tenant@test.com',
            role: 'TENANT'
        });
        await createProfile(freshTenant.token);

        // Use a new listing so no score exists
        const newListing = await createListing(ownerToken, { location: 'Delhi' });
        // Delete any auto-generated score
        await Compatibility.deleteMany({ tenant: freshTenant.userId, listing: newListing.body.data._id });

        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${freshTenant.token}`)
            .send({ listingId: newListing.body.data._id });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('compatibility');
    });

    it('✓ Filled listing → 400', async () => {
        const filledListing = await createListing(ownerToken, { location: 'Pune' });
        const filledId = filledListing.body.data._id;

        // Mark as filled
        await request(app)
            .patch(`/api/v1/listings/${filledId}/fill`)
            .set('Authorization', `Bearer ${ownerToken}`);

        await injectCompatibility(tenantId, filledId);

        const res = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ listingId: filledId });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('no longer available');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. TENANT — VIEW OWN INTERESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/interests/my', () => {
    it('✓ Tenant retrieves own interests', async () => {
        const res = await request(app)
            .get('/api/v1/interests/my')
            .set('Authorization', `Bearer ${tenantToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.interests)).toBe(true);
        expect(res.body.data.interests.length).toBeGreaterThan(0);
    });

    it('✓ Missing JWT → 401', async () => {
        const res = await request(app).get('/api/v1/interests/my');
        expect(res.status).toBe(401);
    });

    it('✓ OWNER cannot access tenant endpoint → 403', async () => {
        const res = await request(app)
            .get('/api/v1/interests/my')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OWNER — VIEW INCOMING REQUESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/interests/incoming', () => {
    it('✓ Owner retrieves incoming requests', async () => {
        const res = await request(app)
            .get('/api/v1/interests/incoming')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.requests)).toBe(true);
        expect(res.body.data.requests.length).toBeGreaterThan(0);
        expect(res.body.data.requests[0]).toHaveProperty('status');
        expect(res.body.data.requests[0]).toHaveProperty('tenant');
        expect(res.body.data.requests[0]).toHaveProperty('compatibility');
    });

    it('✓ Owner 2 sees only their own requests (empty)', async () => {
        const res = await request(app)
            .get('/api/v1/interests/incoming')
            .set('Authorization', `Bearer ${owner2Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.requests.length).toBe(0);
    });

    it('✓ TENANT cannot access owner endpoint → 403', async () => {
        const res = await request(app)
            .get('/api/v1/interests/incoming')
            .set('Authorization', `Bearer ${tenantToken}`);
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. OWNER — RESPOND TO INTEREST
// ══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v1/interests/:id/respond', () => {
    let pendingInterestId;

    beforeAll(async () => {
        const incoming = await request(app)
            .get('/api/v1/interests/incoming')
            .set('Authorization', `Bearer ${ownerToken}`);
        const pending = incoming.body.data.requests.find(i => i.status === 'PENDING');
        pendingInterestId = pending?._id;
    });

    it('✓ Owner can accept a pending interest', async () => {
        const res = await request(app)
            .patch(`/api/v1/interests/${pendingInterestId}/respond`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'ACCEPTED' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('ACCEPTED');
    });

    it('✓ Accepting creates a Chat room in the database', async () => {
        const chat = await Chat.findOne({ interest: pendingInterestId });
        expect(chat).not.toBeNull();
        expect(chat.tenant.toString()).toBe(tenantId.toString());
    });

    it('✓ Cannot change already-accepted interest (immutability)', async () => {
        const res = await request(app)
            .patch(`/api/v1/interests/${pendingInterestId}/respond`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'DECLINED' });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already been accepted');
    });

    it('✓ Invalid status value → 400', async () => {
        const res = await request(app)
            .patch(`/api/v1/interests/${pendingInterestId}/respond`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'PENDING' }); // PENDING is not allowed via this endpoint
        expect(res.status).toBe(400);
    });

    it('✓ Wrong owner cannot respond → 403', async () => {
        const res = await request(app)
            .patch(`/api/v1/interests/${pendingInterestId}/respond`)
            .set('Authorization', `Bearer ${owner2Token}`)
            .send({ status: 'DECLINED' });
        expect(res.status).toBe(403);
    });

    it('✓ Non-existent interest → 404', async () => {
        const res = await request(app)
            .patch('/api/v1/interests/64a1b2c3d4e5f6a7b8c9d0e1/respond')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'ACCEPTED' });
        expect(res.status).toBe(404);
    });

    it('✓ Owner can decline a separate pending interest', async () => {
        // Create a second tenant with their own interest
        const tenant2 = await registerAndLogin({
            name: 'Tenant2 Decline',
            email: 'tenant2_decline@test.com',
            role: 'TENANT'
        });
        await createProfile(tenant2.token);
        await injectCompatibility(tenant2.userId, listingId);

        const intRes = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${tenant2.token}`)
            .send({ listingId });
        const interestId = intRes.body.data._id;

        const declineRes = await request(app)
            .patch(`/api/v1/interests/${interestId}/respond`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'DECLINED' });
        expect(declineRes.status).toBe(200);
        expect(declineRes.body.data.status).toBe('DECLINED');

        // Declined interest should NOT create a chat
        const chat = await Chat.findOne({ interest: interestId });
        expect(chat).toBeNull();
    });

    it('✓ TENANT cannot respond to interests → 403', async () => {
        const res = await request(app)
            .patch(`/api/v1/interests/${pendingInterestId}/respond`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ status: 'ACCEPTED' });
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. SMOKE TEST — Full Interest Lifecycle
// ══════════════════════════════════════════════════════════════════════════════

describe('🔥 SMOKE TEST — Full Interest Lifecycle', () => {
    it('should complete the full interest workflow', async () => {
        const smOwner = await registerAndLogin({
            name: 'Smoke Int Owner',
            email: `sm_int_owner_${Date.now()}@test.com`,
            role: 'OWNER'
        });
        const smTenant = await registerAndLogin({
            name: 'Smoke Int Tenant',
            email: `sm_int_tenant_${Date.now()}@test.com`,
            role: 'TENANT'
        });

        // 1. Owner creates listing
        const listRes = await createListing(smOwner.token, { location: 'Chennai', rent: '12000' });
        const smListingId = listRes.body.data._id;
        expect(listRes.status).toBe(201);

        // 2. Tenant creates profile
        const profRes = await createProfile(smTenant.token, { preferredLocation: 'Chennai' });
        expect(profRes.status).toBe(200);

        // 3. Inject compatibility score
        await injectCompatibility(smTenant.userId, smListingId);

        // 4. Tenant expresses interest
        const intRes = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${smTenant.token}`)
            .send({ listingId: smListingId });
        expect(intRes.status).toBe(201);
        expect(intRes.body.data.status).toBe('PENDING');
        const smInterestId = intRes.body.data._id;

        // 5. Owner sees the incoming request
        const incomingRes = await request(app)
            .get('/api/v1/interests/incoming')
            .set('Authorization', `Bearer ${smOwner.token}`);
        expect(incomingRes.status).toBe(200);
        expect(incomingRes.body.data.requests.some(r => r._id === smInterestId)).toBe(true);

        // 6. Owner accepts
        const acceptRes = await request(app)
            .patch(`/api/v1/interests/${smInterestId}/respond`)
            .set('Authorization', `Bearer ${smOwner.token}`)
            .send({ status: 'ACCEPTED' });
        expect(acceptRes.status).toBe(200);
        expect(acceptRes.body.data.status).toBe('ACCEPTED');

        // 7. Chat room was created
        const chat = await Chat.findOne({ interest: smInterestId });
        expect(chat).not.toBeNull();
        expect(chat.tenant.toString()).toBe(smTenant.userId.toString());
        expect(chat.owner.toString()).toBe(smOwner.userId.toString());

        // 8. Immutability: cannot re-accept or decline
        const reRes = await request(app)
            .patch(`/api/v1/interests/${smInterestId}/respond`)
            .set('Authorization', `Bearer ${smOwner.token}`)
            .send({ status: 'DECLINED' });
        expect(reRes.status).toBe(400);

        // 9. Duplicate interest blocked
        const dupRes = await request(app)
            .post('/api/v1/interests')
            .set('Authorization', `Bearer ${smTenant.token}`)
            .send({ listingId: smListingId });
        expect(dupRes.status).toBe(409);
    });
});
