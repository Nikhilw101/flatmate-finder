const profileService = require('../services/profile.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/v1/profile
 * Retrieves the authenticated tenant's preference profile.
 */
const getProfile = catchAsync(async (req, res) => {
    const profile = await profileService.getProfile(req.user._id);
    res.status(200).json(new ApiResponse(200, profile, 'Profile retrieved successfully'));
});

/**
 * PUT /api/v1/profile
 * Creates or updates the authenticated tenant's preference profile.
 */
const upsertProfile = catchAsync(async (req, res) => {
    const profile = await profileService.upsertProfile(req.user._id, req.body);
    // Since it's an upsert, returning 200 OK is standard for PUT
    res.status(200).json(new ApiResponse(200, profile, 'Profile saved successfully'));
});

module.exports = {
    getProfile,
    upsertProfile
};
