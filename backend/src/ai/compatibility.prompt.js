/**
 * Builds a tightly constrained Gemini prompt for compatibility scoring.
 *
 * Design principles:
 * - Tell the model exactly how to reason (don't leave it open-ended).
 * - Provide concrete scoring guidance per factor so results are consistent.
 * - Mandate JSON-only output to make parsing deterministic.
 *
 * @param {Object} listing     - Mongoose Listing document
 * @param {Object} profile     - Mongoose TenantProfile document
 * @returns {string}           - Ready-to-send prompt string
 */
const buildCompatibilityPrompt = (listing, profile) => {
    const listingAvailable = listing.availableFrom
        ? new Date(listing.availableFrom).toDateString()
        : 'Not specified';
    const tenantMoveIn = profile.moveInDate
        ? new Date(profile.moveInDate).toDateString()
        : 'Not specified';

    return `You are a room-compatibility scoring engine for a rental platform.

Your task is to compare a tenant's preferences against a room listing and produce a compatibility score.

=== TENANT PREFERENCES ===
Preferred Location : ${profile.preferredLocation}
Minimum Budget     : ₹${profile.minBudget}
Maximum Budget     : ₹${profile.maxBudget}
Move-in Date       : ${tenantMoveIn}
Preferred Room     : ${profile.preferredRoomType || 'Any'}
Preferred Furnishing: ${profile.preferredFurnishing || 'Any'}

=== ROOM LISTING ===
Location           : ${listing.location}
Monthly Rent       : ₹${listing.rent}
Available From     : ${listingAvailable}
Room Type          : ${listing.roomType}
Furnishing         : ${listing.furnishingStatus}
Description        : ${listing.description || 'None provided'}

=== SCORING RULES ===
Score out of 100. Weight factors exactly as follows:

LOCATION MATCH (max 60 points):
  - Tenant's preferred location matches or is part of the listing location (e.g. preference 'Pune' matches listing 'Hinjewadi, Pune') → 60 points
  - Locations are completely different cities → 0 points

BUDGET MATCH (max 20 points):
  - Rent is within tenant's min-max budget range  → 20 points
  - Rent is 1–20% above the maximum budget        → 10 points
  - Rent is more than 20% above the maximum budget → 0 points

ROOM & LIFESTYLE MATCH (max 10 points):
  - Room Type matches preferred or preference is 'Any' (5 pts)
  - Furnishing matches preferred or preference is 'Any' (5 pts)

MOVE-IN DATE COMPATIBILITY (max 10 points):
  - Listing available within 7 days of tenant's move-in date  → 10 points
  - Listing available within 30 days of tenant's move-in date → 6 points
  - Listing available within 60 days of tenant's move-in date → 2 points
  - More than 60 days difference                               → 0 points

=== OUTPUT FORMAT ===
Return ONLY valid JSON. No markdown. No code blocks. No explanation outside the JSON object.

Required format:
{"score":<integer 0-100>,"explanation":"<one concise sentence explaining the score>"}`;
};

module.exports = { buildCompatibilityPrompt };
