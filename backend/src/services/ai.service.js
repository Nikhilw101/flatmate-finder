const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const { buildCompatibilityPrompt } = require('../ai/compatibility.prompt');
const { parseAIResponse } = require('../ai/parser');

/**
 * Calls the Gemini API to generate a compatibility score.
 *
 * Returns null (never throws) on:
 *   - Missing/invalid API key
 *   - Network error / timeout
 *   - Rate limit (429) / server error (500)
 *   - Malformed or unparse-able JSON in response
 *   - Empty response
 *
 * @param {Object} listing     - Listing document
 * @param {Object} profile     - TenantProfile document
 * @returns {Promise<{ score: number, explanation: string } | null>}
 */
const getAICompatibilityScore = async (listing, profile) => {
    // If no key is configured, skip AI silently — rule engine will handle it
    if (!env.GEMINI_API_KEY) return null;

    try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = buildCompatibilityPrompt(listing, profile);

        const result = await model.generateContent(prompt);
        const rawText = result?.response?.text?.() ?? '';

        return parseAIResponse(rawText);
    } catch {
        // Any error (network, quota, API error) silently returns null
        // so the caller can activate the rule-engine fallback
        return null;
    }
};

module.exports = { getAICompatibilityScore };
