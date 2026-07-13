const adminService = require('../services/admin.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/users?role=TENANT&search=john&isActive=true&page=1&limit=20
 */
const getUsers = catchAsync(async (req, res) => {
    const { role, search, isActive, page, limit } = req.query;
    const result = await adminService.getAllUsers({ role, search, isActive, page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Users retrieved successfully'));
});

/**
 * GET /api/v1/admin/users/:id
 */
const getUserById = catchAsync(async (req, res) => {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
});

/**
 * PATCH /api/v1/admin/users/:id/disable
 */
const disableUser = catchAsync(async (req, res) => {
    const user = await adminService.disableUser(req.params.id);
    res.status(200).json(new ApiResponse(200, user, 'User disabled successfully'));
});

/**
 * PATCH /api/v1/admin/users/:id/enable
 */
const enableUser = catchAsync(async (req, res) => {
    const user = await adminService.enableUser(req.params.id);
    res.status(200).json(new ApiResponse(200, user, 'User enabled successfully'));
});

/**
 * DELETE /api/v1/admin/users/:id
 */
const deleteUser = catchAsync(async (req, res) => {
    await adminService.deleteUser(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

// ══════════════════════════════════════════════════════════════════════════════
// LISTING MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/listings?location=Mumbai&isFilled=false&ownerId=...&page=1&limit=20
 */
const getListings = catchAsync(async (req, res) => {
    const { location, isFilled, ownerId, page, limit } = req.query;
    const result = await adminService.adminGetAllListings({ location, isFilled, ownerId, page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Listings retrieved successfully'));
});

/**
 * DELETE /api/v1/admin/listings/:id
 */
const deleteListing = catchAsync(async (req, res) => {
    await adminService.adminDeleteListing(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Listing deleted successfully'));
});

/**
 * PATCH /api/v1/admin/listings/:id/status
 * Body: { isFilled: true|false }
 */
const toggleListingStatus = catchAsync(async (req, res) => {
    const { isFilled } = req.body;
    const listing = await adminService.adminToggleListingStatus(req.params.id, isFilled);
    res.status(200).json(new ApiResponse(200, listing, `Listing marked as ${isFilled ? 'filled' : 'available'}`));
});

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/stats
 */
const getStats = catchAsync(async (req, res) => {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(new ApiResponse(200, stats, 'Platform statistics retrieved successfully'));
});

module.exports = {
    getUsers,
    getUserById,
    disableUser,
    enableUser,
    deleteUser,
    getListings,
    deleteListing,
    toggleListingStatus,
    getStats
};
