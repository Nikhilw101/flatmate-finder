/**
 * Safely parses the raw text response from Gemini into a validated score object.
 *
 * Handles all known Gemini failure modes:
 *   - Markdown fences: ```json { } ```
 *   - Leading prose: "Sure! Here is the score: { ... }"
 *   - Invalid JSON
 *   - Missing / wrong-type fields
 *   - Score out of 0-100 range
 *
 * @param {string} rawText - The raw string returned by the Gemini API
 * @returns {{ score: number, explanation: string } | null}
 *   Returns null on ANY parsing or validation failure — never throws.
 */
const parseAIResponse = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;

    try {
        // Step 1: Strip markdown code fences if present (```json ... ``` or ``` ... ```)
        let cleaned = rawText.trim();
        const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        }

        // Step 2: Extract the first JSON object from the text
        // This handles "Sure! { ... }" style leading prose
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        // Step 3: Parse JSON
        const parsed = JSON.parse(jsonMatch[0]);

        // Step 4: Validate shape
        const score = Number(parsed.score);
        const explanation = parsed.explanation;

        if (!Number.isInteger(score)) return null;
        if (score < 0 || score > 100) return null;
        if (typeof explanation !== 'string' || explanation.trim().length === 0) return null;

        return { score, explanation: explanation.trim() };
    } catch {
        // JSON.parse failed or any other unexpected error
        return null;
    }
};

module.exports = { parseAIResponse };
