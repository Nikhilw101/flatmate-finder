const Compatibility = require('../models/Compatibility');
const Listing = require('../models/Listing');
const TenantProfile = require('../models/TenantProfile');
const { getAICompatibilityScore } = require('./ai.service');

// ─── Rule Engine ──────────────────────────────────────────────────────────────

/**
 * Deterministic, pure-function scoring engine.
 * Called when Gemini is unavailable or returns invalid output.
 * No side effects, no DB calls, no async.
 *
 * Scoring breakdown (total: 100):
 *   Location : 50 pts  — exact city match (case-insensitive, trimmed)
 *   Budget   : 40 pts  — within range = 40, within 20% over max = 20, else 0
 *   Date     : 10 pts  — ≤7d = 10, ≤30d = 6, ≤60d = 2, else 0
 *
 * @param {Object} listing - Listing document
 * @param {Object} profile - TenantProfile document
 * @returns {{ score: number, explanation: string }}
 */
const computeRuleScore = (listing, profile) => {
    const reasons = [];
    let score = 0;

    // ── Location (50pts) ──────────────────────────────────────────────────────
    const listingCity = (listing.location || '').trim().toLowerCase();
    const preferredCity = (profile.preferredLocation || '').trim().toLowerCase();

    if (listingCity && preferredCity && listingCity.includes(preferredCity)) {
        score += 50;
        reasons.push('location matches preferred city');
    } else {
        reasons.push('location does not match preferred city');
    }

    // ── Budget (40pts) ────────────────────────────────────────────────────────
    const rent = listing.rent || 0;
    const min = profile.minBudget || 0;
    const max = profile.maxBudget || 0;

    if (rent >= min && rent <= max) {
        score += 40;
        reasons.push('rent is within budget range');
    } else if (rent > max && rent <= max * 1.2) {
        score += 20;
        reasons.push('rent is slightly above the maximum budget');
    } else {
        reasons.push('rent is outside budget range');
    }

    // ── Move-in Date (10pts) ──────────────────────────────────────────────────
    if (listing.availableFrom && profile.moveInDate) {
        const diffMs = Math.abs(
            new Date(listing.availableFrom).getTime() - new Date(profile.moveInDate).getTime()
        );
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays <= 7) {
            score += 10;
            reasons.push('move-in dates align closely');
        } else if (diffDays <= 30) {
            score += 6;
            reasons.push('move-in dates are within a month');
        } else if (diffDays <= 60) {
            score += 2;
            reasons.push('move-in dates differ by up to two months');
        } else {
            reasons.push('move-in dates are far apart');
        }
    } else {
        reasons.push('move-in date not available for comparison');
    }

    const explanation =
        reasons.length === 1
            ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + '.'
            : reasons
                  .map((r, i) => (i === 0 ? r.charAt(0).toUpperCase() + r.slice(1) : r))
                  .join('; ') + '.';

    return { score, explanation };
};

// ─── Engine Orchestrator ──────────────────────────────────────────────────────

/**
 * Computes the compatibility score for one (listing, tenantProfile) pair.
 *
 * Decision flow:
 *   1. Try Gemini AI  →  if success: use AI result
 *   2. AI null        →  use rule engine (deterministic fallback)
 *   3. Upsert result into MongoDB (one doc per listing+tenant pair)
 *
 * @param {Object} listing - Listing document
 * @param {Object} profile - TenantProfile document
 * @returns {Promise<Object>} Saved Compatibility document
 */
const computeAndSaveScore = async (listing, profile) => {
    let result = await getAICompatibilityScore(listing, profile);
    let engine = 'AI';

    if (!result) {
        result = computeRuleScore(listing, profile);
        engine = 'RULE';
    }

    const saved = await Compatibility.findOneAndUpdate(
        { listing: listing._id, tenant: profile.tenant },
        {
            $set: {
                score: result.score,
                explanation: result.explanation,
                engine,
                generatedAt: new Date()
            }
        },
        { upsert: true, new: true }
    );

    return saved;
};

// ─── Batch Triggers ───────────────────────────────────────────────────────────

/**
 * Called when a listing is created or updated.
 * Compares the listing against every existing tenant profile
 * and stores/refreshes compatibility scores in parallel.
 *
 * @param {string} listingId
 */
const generateScoresForListing = async (listingId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) return;

    const profiles = await TenantProfile.find({});
    if (profiles.length === 0) return;

    await Promise.all(profiles.map((profile) => computeAndSaveScore(listing, profile)));
};

/**
 * Called when a tenant profile is created or updated.
 * Compares the tenant against every active (non-filled) listing
 * and stores/refreshes compatibility scores in parallel.
 *
 * @param {string} tenantId - User._id of the tenant
 */
const generateScoresForTenant = async (tenantId) => {
    const profile = await TenantProfile.findOne({ tenant: tenantId });
    if (!profile) return;

    const listings = await Listing.find({ isFilled: false });
    if (listings.length === 0) return;

    await Promise.all(listings.map((listing) => computeAndSaveScore(listing, profile)));
};

// ─── Browse ───────────────────────────────────────────────────────────────────

/**
 * Returns listings sorted by pre-computed compatibility score for a tenant.
 * Never calls Gemini. Reads only from MongoDB.
 *
 * @param {string} tenantId - User._id of the authenticated tenant
 * @returns {Promise<Array>} Array of { listing, score, explanation } objects
 */
const getBrowseListings = async (tenantId) => {
    const docs = await Compatibility.find({ tenant: tenantId })
        .sort({ score: -1 })
        .populate({
            path: 'listing',
            populate: { path: 'owner', select: 'name email' }
        })
        .lean();

    // Filter out stale scores where the listing was deleted or marked filled
    const active = docs.filter((doc) => doc.listing && !doc.listing.isFilled);

    return active.map((doc) => ({
        listing: doc.listing,
        score: doc.score,
        explanation: doc.explanation
        // engine is intentionally excluded from client response (internal/debug)
    }));
};

module.exports = {
    computeRuleScore,    // exported for unit testing
    generateScoresForListing,
    generateScoresForTenant,
    getBrowseListings
};
