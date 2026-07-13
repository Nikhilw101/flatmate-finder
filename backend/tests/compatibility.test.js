/**
 * Stage 4 — AI Compatibility Engine
 * Comprehensive test suite
 *
 * Strategy: The AI service is mocked in all tests so there is NO network dependency.
 * Tests cover:
 *   - Rule engine scoring correctness (pure logic)
 *   - AI parser edge cases
 *   - Browse endpoint (sorted results, TENANT-only access)
 *   - Score generation on listing create / profile upsert
 *   - Upsert behaviour (no duplicate scores)
 *   - Smoke test: full end-to-end compatibility workflow
 */

const request = require('supertest');
const app = require('../src/app');
const Compatibility = require('../src/models/Compatibility');
const { computeRuleScore } = require('../src/services/compatibility.service');
const { parseAIResponse } = require('../src/ai/parser');
const aiService = require('../src/services/ai.service');

// Mock the AI service to prevent real network calls and allow simulating failures
jest.mock('../src/services/ai.service', () => ({
    getAICompatibilityScore: jest.fn()
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async ({ name, email, password = 'password123', role }) => {
    await request(app).post('/api/v1/auth/register').send({ name, email, password, role });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return { token: res.body.data?.token, userId: res.body.data?.user?._id };
};

const createListing = async (token, overrides = {}) => {
    const defaults = {
        location: 'Pune',
        rent: '12000',
        availableFrom: '2025-08-15',
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

const VALID_PROFILE = {
    preferredLocation: 'Pune',
    minBudget: 10000,
    maxBudget: 15000,
    moveInDate: '2025-08-15'
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. RULE ENGINE — Pure Logic Tests (no DB, no HTTP)
// ══════════════════════════════════════════════════════════════════════════════

describe('Rule Engine — computeRuleScore()', () => {
    const baseListing = {
        location: 'Pune',
        rent: 12000,
        availableFrom: new Date('2025-08-15'),
        roomType: 'Private Room',
        furnishingStatus: 'Fully Furnished'
    };

    const baseProfile = {
        preferredLocation: 'Pune',
        minBudget: 10000,
        maxBudget: 15000,
        moveInDate: new Date('2025-08-15')
    };

    it('✓ Perfect match → 100', () => {
        const { score } = computeRuleScore(baseListing, baseProfile);
        expect(score).toBe(100);
    });

    it('✓ Exact location match → 50pts from location', () => {
        const result = computeRuleScore(baseListing, { ...baseProfile, minBudget: 999999, maxBudget: 999998 });
        // Budget mismatch (far outside), date matches
        expect(result.score).toBe(50 + 0 + 10); // 60
    });

    it('✓ Location mismatch → 0pts from location', () => {
        const { score } = computeRuleScore(
            { ...baseListing, location: 'Mumbai' },
            baseProfile
        );
        expect(score).toBe(0 + 40 + 10); // 50
    });

    it('✓ Location match is case-insensitive', () => {
        const { score } = computeRuleScore(
            { ...baseListing, location: 'PUNE' },
            { ...baseProfile, preferredLocation: 'pune' }
        );
        expect(score).toBe(100);
    });

    it('✓ Rent within range → 40pts budget', () => {
        const { score } = computeRuleScore(
            { ...baseListing, location: 'Mumbai', availableFrom: new Date('2027-01-01') },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 40 + date 0 = 90
        expect(score).toBe(90);
    });

    it('✓ Rent slightly above max (within 20%) → 20pts budget', () => {
        // max = 15000, rent = 17000 → 17000/15000 = 1.133 → within 20%
        const { score } = computeRuleScore(
            { ...baseListing, rent: 17000, location: 'Mumbai', availableFrom: new Date('2027-01-01') },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 20 + date 0 = 70
        expect(score).toBe(70);
    });

    it('✓ Rent far above max (>20%) → 0pts budget', () => {
        // max = 15000, rent = 25000 → far outside
        const { score } = computeRuleScore(
            { ...baseListing, rent: 25000, location: 'Mumbai', availableFrom: new Date('2027-01-01') },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 0 + date 0 = 50
        expect(score).toBe(50);
    });

    it('✓ Date within 7 days → 10pts', () => {
        const { score } = computeRuleScore(
            { ...baseListing, availableFrom: new Date('2025-08-18'), location: 'Mumbai' },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 40 + date 10 = 100
        expect(score).toBe(100);
    });

    it('✓ Date within 30 days → 6pts', () => {
        const { score } = computeRuleScore(
            { ...baseListing, availableFrom: new Date('2025-09-01'), location: 'Mumbai' },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 40 + date 6 = 96
        expect(score).toBe(96);
    });

    it('✓ Date within 60 days → 2pts', () => {
        const { score } = computeRuleScore(
            { ...baseListing, availableFrom: new Date('2025-10-14'), location: 'Mumbai' },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 40 + date 2 = 92
        expect(score).toBe(92);
    });

    it('✓ Date more than 60 days apart → 0pts', () => {
        const { score } = computeRuleScore(
            { ...baseListing, availableFrom: new Date('2027-01-01'), location: 'Mumbai' },
            { ...baseProfile, preferredLocation: 'Mumbai' }
        );
        // location 50 + budget 40 + date 0 = 90
        expect(score).toBe(90);
    });

    it('✓ All mismatches → score is 0', () => {
        const { score } = computeRuleScore(
            { ...baseListing, location: 'Mumbai', rent: 50000, availableFrom: new Date('2027-01-01') },
            { ...baseProfile, preferredLocation: 'Delhi' }
        );
        expect(score).toBe(0);
    });

    it('✓ Returns a non-empty explanation string', () => {
        const { explanation } = computeRuleScore(baseListing, baseProfile);
        expect(typeof explanation).toBe('string');
        expect(explanation.length).toBeGreaterThan(0);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. AI PARSER — Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe('AI Parser — parseAIResponse()', () => {
    it('✓ Valid clean JSON', () => {
        const result = parseAIResponse('{"score":85,"explanation":"Good match."}');
        expect(result).toEqual({ score: 85, explanation: 'Good match.' });
    });

    it('✓ Valid JSON with markdown fences stripped', () => {
        const result = parseAIResponse('```json\n{"score":70,"explanation":"Decent."}\n```');
        expect(result).toEqual({ score: 70, explanation: 'Decent.' });
    });

    it('✓ Leading prose before JSON', () => {
        const result = parseAIResponse('Sure! Here is the result: {"score":60,"explanation":"Ok."}');
        expect(result).toEqual({ score: 60, explanation: 'Ok.' });
    });

    it('✓ Score 0 is valid', () => {
        const result = parseAIResponse('{"score":0,"explanation":"No match."}');
        expect(result).toEqual({ score: 0, explanation: 'No match.' });
    });

    it('✓ Score 100 is valid', () => {
        const result = parseAIResponse('{"score":100,"explanation":"Perfect."}');
        expect(result).toEqual({ score: 100, explanation: 'Perfect.' });
    });

    it('✓ Score > 100 → null', () => {
        expect(parseAIResponse('{"score":101,"explanation":"Over."}')).toBeNull();
    });

    it('✓ Score < 0 → null', () => {
        expect(parseAIResponse('{"score":-1,"explanation":"Negative."}')).toBeNull();
    });

    it('✓ Score is float → null (must be integer)', () => {
        expect(parseAIResponse('{"score":85.5,"explanation":"Float."}')).toBeNull();
    });

    it('✓ Missing explanation → null', () => {
        expect(parseAIResponse('{"score":80}')).toBeNull();
    });

    it('✓ Empty explanation → null', () => {
        expect(parseAIResponse('{"score":80,"explanation":"   "}')).toBeNull();
    });

    it('✓ Invalid JSON → null', () => {
        expect(parseAIResponse('{broken json}')).toBeNull();
    });

    it('✓ Empty string → null', () => {
        expect(parseAIResponse('')).toBeNull();
    });

    it('✓ null input → null', () => {
        expect(parseAIResponse(null)).toBeNull();
    });

    it('✓ Plain text (no JSON) → null', () => {
        expect(parseAIResponse('I cannot help with that.')).toBeNull();
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. BROWSE ENDPOINT — API Tests
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/listings/browse — Compatibility Browse', () => {
    let ownerToken;
    let tenantToken;

    beforeAll(async () => {
        const owner = await registerAndLogin({
            name: 'Browse Owner',
            email: 'browse_owner@test.com',
            role: 'OWNER'
        });
        ownerToken = owner.token;

        const tenant = await registerAndLogin({
            name: 'Browse Tenant',
            email: 'browse_tenant@test.com',
            role: 'TENANT'
        });
        tenantToken = tenant.token;
    });

    it('✓ Missing JWT → 401', async () => {
        const res = await request(app).get('/api/v1/listings/browse');
        expect(res.status).toBe(401);
    });

    it('✓ OWNER cannot access browse endpoint → 403', async () => {
        const res = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(res.status).toBe(403);
    });

    it('✓ Tenant with no profile returns empty array', async () => {
        const res = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${tenantToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
    });

    it('✓ After profile + listings exist, browse returns scored results', async () => {
        // Mock AI to return a specific AI score
        aiService.getAICompatibilityScore.mockResolvedValue({
            score: 88,
            explanation: 'AI says it is a good match.'
        });

        // Create tenant profile
        await request(app)
            .put('/api/v1/profile')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send(VALID_PROFILE);

        // Create listings (score generation is fire-and-forget)
        await createListing(ownerToken, { location: 'Pune', rent: '12000' });
        await createListing(ownerToken, { location: 'Mumbai', rent: '20000' });

        // Give fire-and-forget a moment to settle
        await new Promise(r => setTimeout(r, 300));

        const res = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${tenantToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Each result has required fields
        res.body.data.forEach(item => {
            expect(item).toHaveProperty('listing');
            expect(item).toHaveProperty('score');
            expect(item).toHaveProperty('explanation');
            // AI was mocked to return 88
            expect(item.score).toBe(88);
            expect(item.explanation).toBe('AI says it is a good match.');
            // engine must NOT be exposed to the client
            expect(item).not.toHaveProperty('engine');
        });
    });

    it('✓ Browse results are sorted highest score first', async () => {
        const res = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${tenantToken}`);

        expect(res.status).toBe(200);
        const scores = res.body.data.map(item => item.score);
        for (let i = 0; i < scores.length - 1; i++) {
            expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
        }
    });

    it('✓ Pune listing scores higher than Mumbai listing for a Pune-preferring tenant (Rule Engine)', async () => {
        // Force rule engine by failing AI
        aiService.getAICompatibilityScore.mockResolvedValue(null);

        // Delete existing scores to force fresh rule engine scores
        await Compatibility.deleteMany({});
        
        // Trigger regeneration
        await request(app)
            .put('/api/v1/profile')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send(VALID_PROFILE);

        await new Promise(r => setTimeout(r, 300));

        const res = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${tenantToken}`);

        expect(res.status).toBe(200);
        const puneResult = res.body.data.find(r => r.listing.location === 'Pune');
        const mumbaiResult = res.body.data.find(r => r.listing.location === 'Mumbai');

        if (puneResult && mumbaiResult) {
            expect(puneResult.score).toBeGreaterThan(mumbaiResult.score);
        }
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCORE UPSERT — One doc per (tenant + listing)
// ══════════════════════════════════════════════════════════════════════════════

describe('Compatibility Score Upsert', () => {
    it('✓ Score updates existing doc, does not create duplicate', async () => {
        const owner = await registerAndLogin({
            name: 'Upsert Owner',
            email: 'upsert_owner@test.com',
            role: 'OWNER'
        });
        const tenant = await registerAndLogin({
            name: 'Upsert Tenant',
            email: 'upsert_tenant@test.com',
            role: 'TENANT'
        });

        // Create profile
        await request(app)
            .put('/api/v1/profile')
            .set('Authorization', `Bearer ${tenant.token}`)
            .send(VALID_PROFILE);

        // Create listing (triggers score generation)
        const listRes = await createListing(owner.token, { location: 'Pune' });
        const listingId = listRes.body.data._id;

        await new Promise(r => setTimeout(r, 300));

        // Update listing (triggers score regeneration)
        await request(app)
            .put(`/api/v1/listings/${listingId}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .field('rent', '13000');

        await new Promise(r => setTimeout(r, 300));

        // Count docs: should still be 1
        const count = await Compatibility.countDocuments({
            listing: listingId,
            tenant: tenant.userId
        });
        expect(count).toBe(1);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. SMOKE TEST — Complete Compatibility Workflow
// ══════════════════════════════════════════════════════════════════════════════

describe('🔥 SMOKE TEST — Full Compatibility Workflow', () => {
    it('should execute the entire compatibility workflow without errors', async () => {
        console.log('\n======================================================');
        console.log('🔥 SMOKE TEST: COMPATIBILITY ENGINE WORKFLOW');
        console.log('======================================================');

        // Start by forcing AI success, but return a realistic score based on location
        aiService.getAICompatibilityScore.mockImplementation(async (listing, profile) => {
            const score = listing.location === profile.preferredLocation ? 95 : 40;
            const explanation = listing.location === profile.preferredLocation 
                ? `AI: Excellent match! Location is exactly ${listing.location} and rent fits within preferences.`
                : `AI: Poor match. Prefers ${profile.preferredLocation} but listing is in ${listing.location}.`;
            
            console.log(`[AI SERVICE MOCK] Called for Listing: ${listing.location} (Rent: ₹${listing.rent}) and Tenant Preference: ${profile.preferredLocation}`);
            console.log(`[AI SERVICE MOCK] Responded: { score: ${score}, explanation: "${explanation}" }`);
            return { score, explanation };
        });

        // Register owner and tenant
        const smokeOwner = await registerAndLogin({
            name: 'Smoke Owner',
            email: `smoke_compat_owner_${Date.now()}@test.com`,
            role: 'OWNER'
        });
        const smokeTenant = await registerAndLogin({
            name: 'Smoke Tenant',
            email: `smoke_compat_tenant_${Date.now()}@test.com`,
            role: 'TENANT'
        });

        console.log(`[AUTH] Registered and Logged In Smoke Owner (ID: ${smokeOwner.userId})`);
        console.log(`[AUTH] Registered and Logged In Smoke Tenant (ID: ${smokeTenant.userId})`);

        // Step 1: Create two listings
        console.log('\n--- Step 1: Owner Creates Listings ---');
        const listing1 = await createListing(smokeOwner.token, {
            location: 'Hyderabad',
            rent: '11000',
            availableFrom: '2025-08-20'
        });
        expect(listing1.status).toBe(201);
        const listing1Id = listing1.body.data._id;
        console.log(`✓ Created Listing 1: Hyderabad, Rent: ₹11000 (ID: ${listing1Id})`);

        const listing2 = await createListing(smokeOwner.token, {
            location: 'Bengaluru',
            rent: '25000',
            availableFrom: '2025-12-01'
        });
        expect(listing2.status).toBe(201);
        const listing2Id = listing2.body.data._id;
        console.log(`✓ Created Listing 2: Bengaluru, Rent: ₹25000 (ID: ${listing2Id})`);

        // Step 2: Tenant creates profile (prefers Hyderabad)
        console.log('\n--- Step 2: Tenant Creates Profile (Prefers Hyderabad) ---');
        const profileRes = await request(app)
            .put('/api/v1/profile')
            .set('Authorization', `Bearer ${smokeTenant.token}`)
            .send({
                preferredLocation: 'Hyderabad',
                minBudget: 8000,
                maxBudget: 14000,
                moveInDate: '2025-08-20'
            });
        expect(profileRes.status).toBe(200);
        console.log('✓ Tenant Profile Saved: Min: ₹8000, Max: ₹14000, Preferred: Hyderabad');

        // Wait for fire-and-forget to complete
        console.log('Waiting for asynchronous background score generation to settle...');
        await new Promise(r => setTimeout(r, 600));

        // Step 3: Browse and verify sorted results
        console.log('\n--- Step 3: Tenant Browses Listings Sorted by Score ---');
        const browseRes = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${smokeTenant.token}`);
        expect(browseRes.status).toBe(200);
        expect(browseRes.body.data.length).toBeGreaterThanOrEqual(2);

        const scores = browseRes.body.data.map(r => r.score);
        console.log('Returned Sorted Listings:');
        browseRes.body.data.forEach((item, index) => {
            console.log(`  [Rank ${index + 1}] Location: ${item.listing.location} | Score: ${item.score}% | Explanation: "${item.explanation}"`);
        });

        for (let i = 0; i < scores.length - 1; i++) {
            expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
        }

        // Hyderabad listing should be first (better match)
        expect(browseRes.body.data[0].listing.location).toBe('Hyderabad');
        console.log('✓ Hyderabad correctly ranked first due to matching preferences.');

        // Step 4: Tenant updates profile (now prefers Bengaluru)
        console.log('\n--- Step 4: Tenant Changes Preferences to Bengaluru ---');
        await request(app)
            .put('/api/v1/profile')
            .set('Authorization', `Bearer ${smokeTenant.token}`)
            .send({
                preferredLocation: 'Bengaluru',
                minBudget: 20000,
                maxBudget: 30000,
                moveInDate: '2025-12-01'
            });
        console.log('✓ Tenant Profile Updated: Min: ₹20000, Max: ₹30000, Preferred: Bengaluru');

        console.log('Waiting for score recomputation...');
        await new Promise(r => setTimeout(r, 600));

        // Step 5: Browse again — Bengaluru should now rank higher
        console.log('\n--- Step 5: Tenant Browses After Preferences Change ---');
        const browsRes2 = await request(app)
            .get('/api/v1/listings/browse')
            .set('Authorization', `Bearer ${smokeTenant.token}`);
        expect(browsRes2.status).toBe(200);
        
        console.log('New Sorted Listings:');
        browsRes2.body.data.forEach((item, index) => {
            console.log(`  [Rank ${index + 1}] Location: ${item.listing.location} | Score: ${item.score}% | Explanation: "${item.explanation}"`);
        });

        expect(browsRes2.body.data[0].listing.location).toBe('Bengaluru');
        console.log('✓ Bengaluru correctly promoted to Rank 1.');

        // Step 6: Verify score was updated (not duplicated)
        console.log('\n--- Step 6: Verifying Database Idempotency ---');
        const count = await Compatibility.countDocuments({ tenant: smokeTenant.userId, listing: listing1Id });
        expect(count).toBe(1);
        console.log(`✓ Verified exactly ${count} document exists in MongoDB for this Tenant + Listing pair (no duplicates).`);

        // Step 7: Simulate Gemini Failure -> Rule Engine Used -> Verify Stored Engine Source = RULE
        console.log('\n--- Step 7: Simulating Gemini Failure & Fallback to Rule Engine ---');
        aiService.getAICompatibilityScore.mockImplementation(async (listing, profile) => {
            console.log(`[AI SERVICE MOCK] Simulating Timeout/Quota Exception for ${listing.location}`);
            return null; // Return null to simulate failure
        });

        // Trigger regeneration by updating listing
        console.log('Updating listing rent to trigger rescoring under failure conditions...');
        await request(app)
            .put(`/api/v1/listings/${listing1Id}`)
            .set('Authorization', `Bearer ${smokeOwner.token}`)
            .field('rent', '11500');

        console.log('Waiting for background Rule Engine calculation to complete...');
        await new Promise(r => setTimeout(r, 600));

        const fallbackDoc = await Compatibility.findOne({ tenant: smokeTenant.userId, listing: listing1Id });
        console.log('Fetched Score Record from Database:');
        console.log(`  Engine Used : ${fallbackDoc.engine}`);
        console.log(`  Score       : ${fallbackDoc.score}%`);
        console.log(`  Explanation : "${fallbackDoc.explanation}"`);

        expect(fallbackDoc.engine).toBe('RULE');
        expect(fallbackDoc.score).toBeDefined();
        expect(fallbackDoc.explanation).not.toBe('AI perfect match.');
        console.log('✓ Verification Success: Engine fallback to RULE successfully activated and stored!');
        console.log('======================================================\n');
    });
});
