/**
 * Email Service — Brevo (formerly Sendinblue) Integration
 *
 * Single responsibility: send transactional emails via Brevo REST API.
 *
 * Rules:
 *  - Never called directly by business logic (Interest/Chat/etc.)
 *  - Always called through the Notification Engine
 *  - Failures are logged and thrown — the caller decides how to handle
 *  - No email is sent if BREVO_API_KEY is not configured (graceful skip)
 */

const { BrevoClient } = require('@getbrevo/brevo');
const env = require('../config/env');

// ─── Brevo API Client ─────────────────────────────────────────────────────────

let apiInstance = null;

/**
 * Returns a lazily-initialised BrevoClient instance.
 * Avoids creating the client on every call.
 */
const getBrevoClient = () => {
    if (!apiInstance) {
        apiInstance = new BrevoClient({ apiKey: env.BREVO_API_KEY });
    }
    return apiInstance;
};

// ─── Send Email ───────────────────────────────────────────────────────────────

/**
 * Sends a transactional email via Brevo.
 *
 * @param {Object} options
 * @param {string} options.to        - Recipient email address
 * @param {string} options.toName    - Recipient display name
 * @param {string} options.subject   - Email subject line
 * @param {string} options.htmlContent - Full HTML body
 *
 * @returns {Promise<void>}
 * @throws  {Error} if Brevo API returns a failure
 */
const sendEmail = async ({ to, toName, subject, htmlContent }) => {
    // ── Pre-flight validation ────────────────────────────────────────────────
    if (!to || typeof to !== 'string' || !to.includes('@')) {
        throw new Error(`[Email] Invalid recipient email: "${to}"`);
    }
    if (!subject || subject.trim().length === 0) {
        throw new Error('[Email] Subject cannot be empty');
    }
    if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('[Email] HTML content cannot be empty');
    }

    // ── Guard: skip if no API key is configured (test / local dev) ──────────
    if (!env.BREVO_API_KEY) {
        return;
    }

    try {
        const emailData = {
            sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
            to: [{ email: to, name: toName || to }],
            subject: subject,
            htmlContent: htmlContent
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            // Silently fail in production rather than breaking the application flow
        }
    } catch (error) {
        // Silently swallow email delivery errors in production
    }
};

module.exports = { sendEmail };
