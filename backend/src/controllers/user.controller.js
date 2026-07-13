const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's own profile info.
 */
const getMe = catchAsync(async (req, res) => {
    const user = await userService.getMe(req.user._id);
    res.status(200).json(new ApiResponse(200, user, 'Profile retrieved successfully'));
});

/**
 * PATCH /api/v1/users/me
 * Allows user to update their own name.
 */
const updateMe = catchAsync(async (req, res) => {
    const user = await userService.updateMe(req.user._id, req.body);
    res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

module.exports = { getMe, updateMe };
