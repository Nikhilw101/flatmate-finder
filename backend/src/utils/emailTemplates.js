/**
 * Email templates for the Notification Engine.
 *
 * Each template is a pure function: receives data, returns { subject, htmlContent }.
 * No business logic here. No imports. No side effects.
 *
 * Templates:
 *   highCompatibilityInterest  → sent to OWNER when score >= 80
 *   interestAccepted           → sent to TENANT when owner accepts
 *   interestDeclined           → sent to TENANT when owner declines
 */

// ─── Shared Layout Wrapper ────────────────────────────────────────────────────

const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rent &amp; Flatmate Finder</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                🏠 Rent &amp; Flatmate Finder
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f7;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © 2025 Rent &amp; Flatmate Finder. This email was sent automatically.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Template 1: High Compatibility Interest (Owner) ────────────────────────

/**
 * @param {Object} params
 * @param {string} params.ownerName
 * @param {string} params.tenantName
 * @param {number} params.score
 * @param {string} params.location
 * @param {string} params.rent
 */
const highCompatibilityInterest = ({ ownerName, tenantName, score, location, rent }) => ({
    subject: `🔔 New High-Compatibility Tenant Interested in Your Listing`,
    htmlContent: wrap(`
        <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Hello ${ownerName},</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            A tenant with a <strong style="color:#4f46e5;">${score}% compatibility score</strong>
            has expressed interest in your listing.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:13px;">Tenant</span><br/>
                    <strong style="color:#1f2937;font-size:15px;">${tenantName}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:13px;">Listing Location</span><br/>
                    <strong style="color:#1f2937;font-size:15px;">${location}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:13px;">Monthly Rent</span><br/>
                    <strong style="color:#1f2937;font-size:15px;">₹${rent}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding:12px 16px;">
                    <span style="color:#6b7280;font-size:13px;">Compatibility Score</span><br/>
                    <strong style="color:#4f46e5;font-size:18px;">${score}%</strong>
                    <span style="color:#059669;font-size:13px;margin-left:8px;">● Excellent Match</span>
                </td>
            </tr>
        </table>
        <p style="margin:0 0 24px;color:#374151;font-size:14px;">
            Login to review the interest request and decide to accept or decline.
        </p>
        <a href="http://localhost:3000/owner/requests" 
           style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
            Review Request →
        </a>
    `)
});

// ─── Template 2: Interest Accepted (Tenant) ──────────────────────────────────

/**
 * @param {Object} params
 * @param {string} params.tenantName
 * @param {string} params.ownerName
 * @param {string} params.location
 */
const interestAccepted = ({ tenantName, ownerName, location }) => ({
    subject: `🎉 Your Interest Request Has Been Accepted!`,
    htmlContent: wrap(`
        <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Congratulations, ${tenantName}!</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Great news! <strong>${ownerName}</strong> has accepted your interest request
            for the listing in <strong>${location}</strong>.
        </p>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-size:14px;font-weight:600;">
                ✅ You can now start chatting with the owner directly through the platform.
            </p>
        </div>
        <p style="margin:0 0 24px;color:#374151;font-size:14px;">
            Open the chat section to connect with your potential flatmate and discuss the next steps.
        </p>
        <a href="http://localhost:3000/chats"
           style="display:inline-block;background:#059669;color:#ffffff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
            Open Chat →
        </a>
    `)
});

// ─── Template 3: Interest Declined (Tenant) ──────────────────────────────────

/**
 * @param {Object} params
 * @param {string} params.tenantName
 * @param {string} params.location
 */
const interestDeclined = ({ tenantName, location }) => ({
    subject: `Update on Your Interest Request`,
    htmlContent: wrap(`
        <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Hello ${tenantName},</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            We wanted to let you know that your interest request for the listing in
            <strong>${location}</strong> was not accepted at this time.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;color:#991b1b;font-size:14px;">
                Don't be discouraged — there are many other great listings waiting for you.
            </p>
        </div>
        <p style="margin:0 0 24px;color:#374151;font-size:14px;">
            Continue exploring listings to find your perfect match.
        </p>
        <a href="http://localhost:3000/listings"
           style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
            Browse Listings →
        </a>
    `)
});

module.exports = {
    highCompatibilityInterest,
    interestAccepted,
    interestDeclined
};
