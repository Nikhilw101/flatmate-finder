/**
 * Stage 7 — Real Email Delivery Test
 * 
 * This test file does NOT mock the email service. It connects to the in-memory
 * database and triggers real emails via the Brevo API using your credentials.
 * 
 * Run this specifically with:
 * npm test -- tests/real-email.test.js
 */

const request = require('supertest');
const { createServer } = require('http');
const path = require('path');

// Load environment variables IMMEDIATELY so env.js and email.service.js pick them up
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('../src/app');
const { initSocket, closeSocket } = require('../src/config/socket');
const Compatibility = require('../src/models/Compatibility');
const Interest = require('../src/models/Interest');
const env = require('../src/config/env');

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
// REAL EMAIL DELIVERY TEST
// ══════════════════════════════════════════════════════════════════════════════

describe('📨 REAL EMAIL DELIVERY TEST', () => {
    it('should actually send emails via Brevo', async () => {
        if (!env.BREVO_API_KEY) {
            console.warn('⚠️ No Brevo API Key found. Skipping real email test.');
            return;
        }

        console.log('\n🚀 Starting REAL email delivery test using Brevo...');

        // Using real emails provided by user
        // +timestamp added so we don't hit duplicate email errors on repeated test runs
        const ownerEmail = `nwagh008+${Date.now()}@gmail.com`;
        const tenantEmail = `swapnilkoli2035+${Date.now()}@gmail.com`;

        console.log(`👤 Owner Email : ${ownerEmail}`);
        console.log(`👤 Tenant Email: ${tenantEmail}\n`);

        const smOwner = await registerAndLogin({ name: 'Nitin Owner', email: ownerEmail, role: 'OWNER' });
        const smTenant = await registerAndLogin({ name: 'Swapnil Tenant', email: tenantEmail, role: 'TENANT' });

        // 1. Owner creates listing
        const smListing = await createListing(smOwner.token, { location: 'Chennai', rent: '18000' });
        console.log('✅ Listing created');

        // 2. Tenant creates profile
        await createProfile(smTenant.token, { preferredLocation: 'Chennai', minBudget: 15000, maxBudget: 25000 });
        console.log('✅ Tenant profile created');

        // 3. Inject high compatibility score (triggers email)
        await injectCompatibility(smTenant.userId, smListing._id, 92);
        console.log('✅ Compatibility score injected (92% - Should trigger owner email)');

        // 4. Tenant expresses interest → INTEREST_RECEIVED (Email to Owner)
        console.log('⏳ Expressing interest (Waiting for Brevo to send email to owner)...');
        const intRes = await expressInterest(smTenant.token, smListing._id);
        expect(intRes.status).toBe(201);
        const smInterestId = intRes.body.data._id;
        
        await wait(2000); // Give Brevo time to send
        console.log('✉️  Check Owner Inbox (nwagh008@gmail.com)!');

        // 5. Owner accepts interest → INTEREST_ACCEPTED (Email to Tenant)
        console.log('\n⏳ Owner accepting interest (Waiting for Brevo to send email to tenant)...');
        await respondToInterest(smOwner.token, smInterestId, 'ACCEPTED');
        
        await wait(2000); // Give Brevo time to send
        console.log('✉️  Check Tenant Inbox (swapnilkoli2035@gmail.com)!');

        console.log('\n🎉 Real email test completed successfully.\n');
    });
});
