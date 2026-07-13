const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — applied to all /api/v1 routes.
 * 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 100,
    standardHeaders: true,       // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,        // Disable deprecated `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

/**
 * Auth rate limiter — stricter limit for login/register endpoints.
 * 10 requests per 15 minutes per IP to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: false  // Count all requests, including successful logins
});

/**
 * AI/Compatibility rate limiter — prevents quota abuse on expensive Gemini calls.
 * 30 requests per 10 minutes per IP.
 */
const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many compatibility requests, please slow down.'
    }
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
