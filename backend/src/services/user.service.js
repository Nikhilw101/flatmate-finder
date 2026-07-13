/**
 * User Service — Authenticated user's own profile operations.
 *
 * Note: Admin user management is in admin.service.js.
 * This service handles what the logged-in user can do to their OWN account.
 */

const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Returns the authenticated user's own profile (password excluded).
 * @param {string} userId
 */
const getMe = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

/**
 * Allows the authenticated user to update their own name.
 * Email, role, and password are NOT changeable through this endpoint.
 * @param {string} userId
 * @param {Object} data - { name }
 */
const updateMe = async (userId, { name }) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ApiError(404, 'User not found');

    if (name) user.name = name.trim();
    await user.save();
    return user;
};

module.exports = { getMe, updateMe };
