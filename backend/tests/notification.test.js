/**
 * Stage 7 — Notification Engine + Brevo Email Integration
 * Comprehensive test suite
 *
 * Email service is mocked — no real Brevo calls are made.
 * Socket server is spun up for real-time notification tests.
 *
 * Tests cover:
 *   - INTEREST_RECEIVED: notification created for owner, email if score >= 80
 *   - Low score (< 80): notification stored but NO email
 *   - Email failure resilience: system continues, notification still stored
 *   - INTEREST_ACCEPTED: notification + email to tenant
 *   - INTEREST_DECLINED: notification + email to tenant
 *   - REST API: list (paginated), unread-count, mark-read, mark-all-read
 *   - Authorization: cannot read another user's notification
 *   - Socket: notification:new emitted to personal room
 *   - Smoke test: full E2E workflow
 */

// ─── Mock email service BEFORE any imports (Jest hoists this to top) ──────────
jest.mock('../src/services/email.service', () => ({
    sendEmail: jest.fn().mockResolvedValue(undefined)
}));

const request = require('supertest');
const { createServer } = require('http');
const Client = require('socket.io-client');

const app = require('../src/app');
const { initSocket, closeSocket } = require('../src/config/socket');
const Notification = require('../src/models/Notification');
const Compatibility = require('../src/models/Compatibility');
const Interest = require('../src/models/Interest');
const emailService = require('../src/services/email.service');

// ─── HTTP + Socket Server Setup ───────────────────────────────────────────────

let httpServer, port;

beforeAll((done) => {
    httpServer = createServer(app);
    initSocket(httpServer);
    httpServer.listen(() => {
        port = httpServer.address().port;
        done();
    });
});

afterAll((done) => {
    closeSocket();
    httpServer.close(done);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async ({ name, email, password = 'password123', role }) => {
    await request(app).post('/api/v1/auth/register').send({ name, email, password, role });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return { token: res.body.data?.token, userId: res.body.data?.user?._id, email };
};

const createListing = async (token, overrides = {}) => {
    const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`)
        .field('location', overrides.location || 'Mumbai')
        .field('rent', overrides.rent || '15000')
        .field('availableFrom', '2025-09-01')
        .field('roomType', 'Private Room')
        .field('furnishingStatus', 'Fully Furnished');
    return res.body.data;
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

const injectCompatibility = async (tenantId, listingId, score = 90) =>
    Compatibility.findOneAndUpdate(
        { tenant: tenantId, listing: listingId },
        { $set: { score, explanation: `Test score: ${score}`, engine: 'RULE', generatedAt: new Date() } },
        { upsert: true, new: true }
    );

const expressInterest = (token, listingId) =>
    request(app)
        .post('/api/v1/interests')
        .set('Authorization', `Bearer ${token}`)
        .send({ listingId });

const respondToInterest = (token, interestId, status) =>
    request(app)
        .patch(`/api/v1/interests/${interestId}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status });

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: INTEREST_RECEIVED notifications
// ══════════════════════════════════════════════════════════════════════════════

describe('INTEREST_RECEIVED Notifications', () => {
    let owner, tenant, listing, interestId;

    beforeAll(async () => {
        emailService.sendEmail.mockClear();
        owner = await registerAndLogin({ name: 'IR Owner', email: 'ir_owner@test.com', role: 'OWNER' });
        tenant = await registerAndLogin({ name: 'IR Tenant', email: 'ir_tenant@test.com', role: 'TENANT' });
        listing = await createListing(owner.token, { location: 'Pune', rent: '12000' });
        await createProfile(tenant.token, { preferredLocation: 'Pune' });
        await injectCompatibility(tenant.userId, listing._id, 90);

        const res = await expressInterest(tenant.token, listing._id);
        expect(res.status).toBe(201);
        interestId = res.body.data._id;
        await wait(500); // wait for fire-and-forget notification
    });

    it('✓ Notification created in MongoDB for owner', async () => {
        const notif = await Notification.findOne({ recipient: owner.userId, type: 'INTEREST_RECEIVED' });
        expect(notif).not.toBeNull();
        expect(notif.isRead).toBe(false);
        expect(notif.sender.toString()).toBe(tenant.userId.toString());
        console.log(`  📋 INTEREST_RECEIVED: "${notif.title}" — isRead: ${notif.isRead}`);
    });

    it('✓ Score >= 80: email sent to owner', async () => {
        const ownerCalls = emailService.sendEmail.mock.calls.filter(c => c[0].to === owner.email);
        expect(ownerCalls.length).toBeGreaterThan(0);
        const subject = ownerCalls[0][0].subject;
        expect(subject).toContain('Compatibility');
        console.log(`  📧 High-score email | To: ${owner.email} | Subject: "${subject}"`);
    });

    it('✓ Score < 80: notification stored but NO email to owner', async () => {
        emailService.sendEmail.mockClear();

        const o2 = await registerAndLogin({ name: 'Low Owner', email: 'low_owner@test.com', role: 'OWNER' });
        const t2 = await registerAndLogin({ name: 'Low Tenant', email: 'low_tenant@test.com', role: 'TENANT' });
        const l2 = await createListing(o2.token, { location: 'Nashik' });
        await createProfile(t2.token, { preferredLocation: 'Nashik' });
        await injectCompatibility(t2.userId, l2._id, 60); // below threshold

        const res = await expressInterest(t2.token, l2._id);
        expect(res.status).toBe(201);
        await wait(500);

        const notif = await Notification.findOne({ recipient: o2.userId, type: 'INTEREST_RECEIVED' });
        expect(notif).not.toBeNull(); // notification always created
        console.log(`  📋 Low-score notification exists: "${notif.title}"`);

        const ownerEmailCalls = emailService.sendEmail.mock.calls.filter(c => c[0].to === o2.email);
        expect(ownerEmailCalls.length).toBe(0); // no email for score < 80
        console.log('  ✅ Score 60 < 80: email correctly skipped');
    });

    it('✓ Notification has correct references', async () => {
        const notif = await Notification.findOne({ recipient: owner.userId, type: 'INTEREST_RECEIVED', relatedInterest: interestId });
        expect(notif.relatedInterest.toString()).toBe(interestId.toString());
        expect(notif.relatedListing.toString()).toBe(listing._id.toString());
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: INTEREST_ACCEPTED notifications
// ══════════════════════════════════════════════════════════════════════════════

describe('INTEREST_ACCEPTED Notifications', () => {
    let owner, tenant, interestId;

    beforeAll(async () => {
        emailService.sendEmail.mockClear();
        owner = await registerAndLogin({ name: 'Acc Owner', email: 'acc_owner@test.com', role: 'OWNER' });
        tenant = await registerAndLogin({ name: 'Acc Tenant', email: 'acc_tenant@test.com', role: 'TENANT' });
        const listing = await createListing(owner.token, { location: 'Bengaluru' });
        await createProfile(tenant.token, { preferredLocation: 'Bengaluru' });
        await injectCompatibility(tenant.userId, listing._id, 85);

        const intRes = await expressInterest(tenant.token, listing._id);
        interestId = intRes.body.data._id;
        await wait(400);
        emailService.sendEmail.mockClear(); // reset so we only track accept email

        await respondToInterest(owner.token, interestId, 'ACCEPTED');
        await wait(500);
    });

    it('✓ INTEREST_ACCEPTED notification created for tenant', async () => {
        const notif = await Notification.findOne({ type: 'INTEREST_ACCEPTED', relatedInterest: interestId });
        expect(notif).not.toBeNull();
        expect(notif.recipient.toString()).toBe(tenant.userId.toString());
        console.log(`  📋 INTEREST_ACCEPTED: "${notif.title}"`);
    });

    it('✓ Acceptance email sent to tenant', async () => {
        const tenantCalls = emailService.sendEmail.mock.calls.filter(c => c[0].to === tenant.email);
        expect(tenantCalls.length).toBeGreaterThan(0);
        const subject = tenantCalls[0][0].subject;
        expect(subject).toContain('Accepted');
        console.log(`  📧 Acceptance email | Subject: "${subject}"`);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: INTEREST_DECLINED notifications
// ══════════════════════════════════════════════════════════════════════════════

describe('INTEREST_DECLINED Notifications', () => {
    let owner, tenant, interestId;

    beforeAll(async () => {
        emailService.sendEmail.mockClear();
        owner = await registerAndLogin({ name: 'Dec Owner', email: 'dec_owner@test.com', role: 'OWNER' });
        tenant = await registerAndLogin({ name: 'Dec Tenant', email: 'dec_tenant@test.com', role: 'TENANT' });
        const listing = await createListing(owner.token, { location: 'Hyderabad' });
        await createProfile(tenant.token, { preferredLocation: 'Hyderabad' });
        await injectCompatibility(tenant.userId, listing._id, 75);

        const intRes = await expressInterest(tenant.token, listing._id);
        interestId = intRes.body.data._id;
        await wait(400);
        emailService.sendEmail.mockClear();

        await respondToInterest(owner.token, interestId, 'DECLINED');
        await wait(500);
    });

    it('✓ INTEREST_DECLINED notification created for tenant', async () => {
        const notif = await Notification.findOne({ type: 'INTEREST_DECLINED', relatedInterest: interestId });
        expect(notif).not.toBeNull();
        expect(notif.recipient.toString()).toBe(tenant.userId.toString());
        console.log(`  📋 INTEREST_DECLINED: "${notif.message}"`);
    });

    it('✓ Decline email sent to tenant', async () => {
        const tenantCalls = emailService.sendEmail.mock.calls.filter(c => c[0].to === tenant.email);
        expect(tenantCalls.length).toBeGreaterThan(0);
        console.log(`  📧 Decline email | To: ${tenant.email}`);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: EMAIL RESILIENCE
// ══════════════════════════════════════════════════════════════════════════════

describe('Email Resilience: Brevo failure must not crash system', () => {
    it('✓ HTTP 201 returned and notification stored even when email throws', async () => {
        // Make the mock throw once
        emailService.sendEmail.mockRejectedValueOnce(new Error('Brevo 503 Unavailable'));

        const o = await registerAndLogin({ name: 'Fail Owner', email: 'fail_owner@test.com', role: 'OWNER' });
        const t = await registerAndLogin({ name: 'Fail Tenant', email: 'fail_tenant@test.com', role: 'TENANT' });
        const l = await createListing(o.token, { location: 'Delhi' });
        await createProfile(t.token, { preferredLocation: 'Delhi' });
        await injectCompatibility(t.userId, l._id, 95);

        const res = await expressInterest(t.token, l._id);
        expect(res.status).toBe(201); // endpoint still succeeds

        await wait(500);

        const notif = await Notification.findOne({ recipient: o.userId, type: 'INTEREST_RECEIVED' });
        expect(notif).not.toBeNull(); // notification stored despite email failure
        console.log('  ✅ Notification stored despite Brevo error — system unaffected');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: NOTIFICATION REST APIs
// ══════════════════════════════════════════════════════════════════════════════

describe('REST: GET /api/v1/notifications', () => {
    let user;

    beforeAll(async () => {
        user = await registerAndLogin({ name: 'API User', email: 'api_user@test.com', role: 'OWNER' });
        // Inject a notification directly
        await Notification.create({
            recipient: user.userId,
            type: 'INTEREST_RECEIVED',
            title: 'Test Notification',
            message: 'Test message',
            isRead: false
        });
    });

    it('✓ Returns paginated notifications', async () => {
        const res = await request(app)
            .get('/api/v1/notifications')
            .set('Authorization', `Bearer ${user.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('notifications');
        expect(res.body.data).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data.notifications)).toBe(true);
        expect(res.body.data.pagination.total).toBeGreaterThan(0);
        console.log(`  📬 ${res.body.data.notifications.length} notifications | Total: ${res.body.data.pagination.total}`);
    });

    it('✓ Pagination limit works', async () => {
        const res = await request(app)
            .get('/api/v1/notifications?limit=1&page=1')
            .set('Authorization', `Bearer ${user.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.notifications.length).toBeLessThanOrEqual(1);
    });

    it('✓ Missing JWT → 401', async () => {
        const res = await request(app).get('/api/v1/notifications');
        expect(res.status).toBe(401);
    });

    it('✓ Sorted newest first', async () => {
        const res = await request(app)
            .get('/api/v1/notifications')
            .set('Authorization', `Bearer ${user.token}`);
        const dates = res.body.data.notifications.map(n => new Date(n.createdAt).getTime());
        const isSorted = dates.every((d, i) => i === 0 || d <= dates[i - 1]);
        expect(isSorted).toBe(true);
    });
});

describe('REST: GET /api/v1/notifications/unread-count', () => {
    it('✓ Returns numeric unread count', async () => {
        const user = await registerAndLogin({ name: 'Count User', email: 'count_user@test.com', role: 'TENANT' });
        await Notification.create({ recipient: user.userId, type: 'INTEREST_RECEIVED', title: 'T', message: 'M', isRead: false });
        await Notification.create({ recipient: user.userId, type: 'INTEREST_ACCEPTED', title: 'T2', message: 'M2', isRead: false });

        const res = await request(app)
            .get('/api/v1/notifications/unread-count')
            .set('Authorization', `Bearer ${user.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(2);
        console.log(`  🔔 Unread count: ${res.body.data.unreadCount}`);
    });
});

describe('REST: PATCH /api/v1/notifications/:id/read', () => {
    let user, notifId;

    beforeAll(async () => {
        user = await registerAndLogin({ name: 'Mark Read User', email: 'mark_read@test.com', role: 'TENANT' });
        const notif = await Notification.create({ recipient: user.userId, type: 'INTEREST_RECEIVED', title: 'T', message: 'M', isRead: false });
        notifId = notif._id.toString();
    });

    it('✓ Marks notification as read', async () => {
        const res = await request(app)
            .patch(`/api/v1/notifications/${notifId}/read`)
            .set('Authorization', `Bearer ${user.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.isRead).toBe(true);
        console.log(`  ✅ Notification ${notifId} marked as read`);
    });

    it('✓ Cannot read another user\'s notification → 404', async () => {
        const other = await registerAndLogin({ name: 'Other User', email: 'other_user@test.com', role: 'TENANT' });
        const res = await request(app)
            .patch(`/api/v1/notifications/${notifId}/read`)
            .set('Authorization', `Bearer ${other.token}`);
        expect(res.status).toBe(404);
    });
});

describe('REST: PATCH /api/v1/notifications/read-all', () => {
    it('✓ Marks all as read and returns updated count', async () => {
        const user = await registerAndLogin({ name: 'Read All User', email: 'read_all@test.com', role: 'OWNER' });
        await Notification.insertMany([
            { recipient: user.userId, type: 'INTEREST_RECEIVED', title: 'T1', message: 'M1', isRead: false },
            { recipient: user.userId, type: 'INTEREST_ACCEPTED', title: 'T2', message: 'M2', isRead: false },
            { recipient: user.userId, type: 'INTEREST_DECLINED', title: 'T3', message: 'M3', isRead: false }
        ]);

        const res = await request(app)
            .patch('/api/v1/notifications/read-all')
            .set('Authorization', `Bearer ${user.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(3);
        console.log(`  ✅ Marked all as read: ${res.body.data.updatedCount} notifications`);

        const countRes = await request(app)
            .get('/api/v1/notifications/unread-count')
            .set('Authorization', `Bearer ${user.token}`);
        expect(countRes.body.data.unreadCount).toBe(0);
        console.log('  ✅ Unread count after mark-all-read: 0');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6: SOCKET — Real-time notification delivery
// ══════════════════════════════════════════════════════════════════════════════

describe('Socket: notification:new real-time delivery', () => {
    it('✓ Owner receives notification:new on interest expressed', (done) => {
        const url = `http://localhost:${port}`;

        const run = async () => {
            emailService.sendEmail.mockClear();
            const sockOwner = await registerAndLogin({ name: 'Sock Owner', email: `sock_own_${Date.now()}@test.com`, role: 'OWNER' });
            const sockTenant = await registerAndLogin({ name: 'Sock Tenant', email: `sock_ten_${Date.now()}@test.com`, role: 'TENANT' });
            const sockListing = await createListing(sockOwner.token, { location: 'Goa' });
            await createProfile(sockTenant.token, { preferredLocation: 'Goa' });
            await injectCompatibility(sockTenant.userId, sockListing._id, 88);

            const ownerSocket = Client(url, {
                auth: { token: `Bearer ${sockOwner.token}` },
                forceNew: true
            });

            ownerSocket.once('connect', async () => {
                console.log(`  🔌 Owner socket connected | Room: ${sockOwner.userId}`);

                ownerSocket.once('notification:new', (data) => {
                    try {
                        expect(data.type).toBe('INTEREST_RECEIVED');
                        expect(data.isRead).toBe(false);
                        expect(data.title).toBeTruthy();
                        console.log(`  📡 notification:new | Type: ${data.type} | Title: "${data.title}"`);
                    } finally {
                        ownerSocket.disconnect();
                        done();
                    }
                });

                // Trigger the event
                await expressInterest(sockTenant.token, sockListing._id);
            });

            ownerSocket.once('connect_error', (err) => {
                done(new Error(`Socket error: ${err.message}`));
            });
        };

        run().catch(done);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7: SMOKE TEST — Full E2E Notification Workflow
// ══════════════════════════════════════════════════════════════════════════════

describe('🔥 SMOKE TEST — Full Notification Lifecycle', () => {
    it('should complete the entire notification workflow end-to-end', async () => {
        emailService.sendEmail.mockClear();

        const smOwner = await registerAndLogin({ name: 'Smoke Owner', email: `sm_own_${Date.now()}@test.com`, role: 'OWNER' });
        const smTenant = await registerAndLogin({ name: 'Smoke Tenant', email: `sm_ten_${Date.now()}@test.com`, role: 'TENANT' });

        // 1. Owner creates listing
        const smListing = await createListing(smOwner.token, { location: 'Chennai', rent: '18000' });
        console.log('\n  [1] Listing created at Chennai');

        // 2. Tenant creates profile
        await createProfile(smTenant.token, { preferredLocation: 'Chennai', minBudget: 15000, maxBudget: 25000 });
        console.log('  [2] Tenant profile created');

        // 3. Inject compatibility score >= 80
        await injectCompatibility(smTenant.userId, smListing._id, 92);
        console.log('  [3] Compatibility score injected: 92%');

        // 4. Tenant expresses interest → triggers INTEREST_RECEIVED notification
        const intRes = await expressInterest(smTenant.token, smListing._id);
        expect(intRes.status).toBe(201);
        const smInterestId = intRes.body.data._id;
        console.log(`  [4] Interest expressed: ${smInterestId}`);
        await wait(500);

        // 5. Verify INTEREST_RECEIVED notification
        const receivedNotif = await Notification.findOne({ recipient: smOwner.userId, type: 'INTEREST_RECEIVED' });
        expect(receivedNotif).not.toBeNull();
        expect(receivedNotif.isRead).toBe(false);
        console.log(`  [5] ✅ INTEREST_RECEIVED notification stored: "${receivedNotif.title}"`);

        // 6. Email sent to owner (score 92 >= 80)
        const ownerEmails = emailService.sendEmail.mock.calls.filter(c => c[0].to === smOwner.email);
        expect(ownerEmails.length).toBeGreaterThan(0);
        console.log(`  [6] ✅ Email to owner | Subject: "${ownerEmails[0][0].subject}"`);

        // 7. Check unread count
        const countRes = await request(app).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${smOwner.token}`);
        expect(countRes.body.data.unreadCount).toBeGreaterThan(0);
        console.log(`  [7] ✅ Owner unread count: ${countRes.body.data.unreadCount}`);

        // 8. Owner marks it read
        const markRes = await request(app).patch(`/api/v1/notifications/${receivedNotif._id}/read`).set('Authorization', `Bearer ${smOwner.token}`);
        expect(markRes.body.data.isRead).toBe(true);
        console.log('  [8] ✅ Marked as read');

        // 9. Owner accepts interest → triggers INTEREST_ACCEPTED
        emailService.sendEmail.mockClear();
        await respondToInterest(smOwner.token, smInterestId, 'ACCEPTED');
        await wait(500);

        // 10. Verify INTEREST_ACCEPTED notification for tenant
        const acceptedNotif = await Notification.findOne({ recipient: smTenant.userId, type: 'INTEREST_ACCEPTED' });
        expect(acceptedNotif).not.toBeNull();
        console.log(`  [9] ✅ INTEREST_ACCEPTED notification: "${acceptedNotif.title}"`);

        // 11. Acceptance email to tenant
        const tenantEmails = emailService.sendEmail.mock.calls.filter(c => c[0].to === smTenant.email);
        expect(tenantEmails.length).toBeGreaterThan(0);
        expect(tenantEmails[0][0].subject).toContain('Accepted');
        console.log(`  [10] ✅ Acceptance email | Subject: "${tenantEmails[0][0].subject}"`);

        // 12. Tenant mark-all-as-read
        const allReadRes = await request(app).patch('/api/v1/notifications/read-all').set('Authorization', `Bearer ${smTenant.token}`);
        expect(allReadRes.body.data.updatedCount).toBeGreaterThan(0);
        console.log(`  [11] ✅ Tenant mark-all-read: ${allReadRes.body.data.updatedCount}`);

        // 13. Tenant unread count = 0
        const finalCount = await request(app).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${smTenant.token}`);
        expect(finalCount.body.data.unreadCount).toBe(0);
        console.log('  [12] ✅ Tenant unread count: 0');

        console.log('\n  ======================================================');
        console.log('  🎉 SMOKE TEST PASSED — ALL 12 STEPS COMPLETED');
        console.log('  ======================================================\n');
    });
});
