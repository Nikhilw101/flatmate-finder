const TenantProfile = require('../models/TenantProfile');
const ApiError = require('../utils/ApiError');
const { generateScoresForTenant } = require('./compatibility.service');

/**
 * Retrieves the tenant's preference profile.
 * @param {string} tenantId - The User ID of the tenant.
 * @returns {Promise<Object>} The tenant profile document.
 */
const getProfile = async (tenantId) => {
    const profile = await TenantProfile.findOne({ tenant: tenantId });
    if (!profile) {
        throw new ApiError(404, 'Tenant profile not found');
    }
    return profile;
};

/**
 * Creates or updates the tenant's preference profile.
 * @param {string} tenantId - The User ID of the tenant.
 * @param {Object} profileData - The validated preference data.
 * @returns {Promise<Object>} The newly created or updated profile document.
 */
const upsertProfile = async (tenantId, profileData) => {
    // Upsert (update if exists, insert if not) based on the unique 'tenant' field
    const profile = await TenantProfile.findOneAndUpdate(
        { tenant: tenantId },
        { $set: profileData },
        { 
            new: true,           // Return the updated document
            upsert: true,        // Create if it doesn't exist
            runValidators: true, // Run Mongoose schema validations
            setDefaultsOnInsert: true
        }
    );

    // Fire-and-forget: recompute scores for this tenant against all active listings.
    generateScoresForTenant(tenantId).catch(() => {});

    return profile;
};

module.exports = {
    getProfile,
    upsertProfile
};
