/**
 * Admin Service
 *
 * Central business logic for all administrative operations.
 * Responsibilities:
 *   - User management (list, search, filter, disable, enable, delete)
 *   - Listing management (list, search, filter, delete, toggle status)
 *   - Platform statistics (aggregate counts across all collections)
 *
 * Rules:
 *   - Never imports auth.service, interest.service etc. in a circular way.
 *   - All filtering is regex-safe.
 *   - Pagination always returned in { data, pagination } shape.
 */

const User = require('../models/User');
const Listing = require('../models/Listing');
const Interest = require('../models/Interest');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const TenantProfile = require('../models/TenantProfile');
const ApiError = require('../utils/ApiError');
const { deleteFromCloudinary } = require('./upload.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safePagination = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return { skip: (p - 1) * l, limit: l, page: p };
};

const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
});

// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Returns paginated users with optional filters.
 * @param {Object} options
 * @param {string} [options.role]     - Filter by TENANT|OWNER|ADMIN
 * @param {string} [options.search]   - Search by name or email (case-insensitive)
 * @param {boolean} [options.isActive] - Filter by active status
 * @param {number} [options.page]
 * @param {number} [options.limit]
 */
const getAllUsers = async ({ role, search, isActive, page = 1, limit = 20 } = {}) => {
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
    if (search) {
        const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { name: { $regex: safe, $options: 'i' } },
            { email: { $regex: safe, $options: 'i' } }
        ];
    }

    const { skip, limit: lim, page: pg } = safePagination(page, limit);

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim)
            .lean(),
        User.countDocuments(filter)
    ]);

    // Attach listing and interest counts for the admin dashboard
    const userIds = users.map(u => u._id);
    const [listingCounts, interestCounts] = await Promise.all([
        Listing.aggregate([
            { $match: { owner: { $in: userIds } } },
            { $group: { _id: '$owner', count: { $sum: 1 } } }
        ]),
        Interest.aggregate([
            { $match: { tenant: { $in: userIds } } },
            { $group: { _id: '$tenant', count: { $sum: 1 } } }
        ])
    ]);

    const listingMap = Object.fromEntries(listingCounts.map(l => [l._id.toString(), l.count]));
    const interestMap = Object.fromEntries(interestCounts.map(i => [i._id.toString(), i.count]));

    const enriched = users.map(u => ({
        ...u,
        listingCount: listingMap[u._id.toString()] || 0,
        interestCount: interestMap[u._id.toString()] || 0
    }));

    return {
        users: enriched,
        pagination: buildPaginationMeta(total, pg, lim)
    };
};

/**
 * Returns a single user with enriched stats.
 * @param {string} userId
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password').lean();
    if (!user) throw new ApiError(404, 'User not found');

    const [listingCount, interestCount, profileExists] = await Promise.all([
        Listing.countDocuments({ owner: userId }),
        Interest.countDocuments({ tenant: userId }),
        TenantProfile.exists({ tenant: userId })
    ]);

    return {
        ...user,
        listingCount,
        interestCount,
        hasProfile: !!profileExists
    };
};

/**
 * Soft-disables a user account. Blocked user cannot use any protected endpoint.
 * @param {string} userId
 */
const disableUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot disable an admin account');
    if (!user.isActive) throw new ApiError(400, 'User is already disabled');

    user.isActive = false;
    await user.save();
    return user;
};

/**
 * Re-enables a previously disabled user account.
 * @param {string} userId
 */
const enableUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    if (user.isActive) throw new ApiError(400, 'User is already active');

    user.isActive = true;
    await user.save();
    return user;
};

/**
 * Hard-deletes a user. Admin use only.
 * @param {string} userId
 */
const deleteUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot delete an admin account');

    await user.deleteOne();
};

// ══════════════════════════════════════════════════════════════════════════════
// LISTING MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Admin view of all listings — includes filled, private owner info, etc.
 * @param {Object} options
 * @param {string} [options.location]
 * @param {boolean} [options.isFilled]
 * @param {string} [options.ownerId]
 * @param {number} [options.page]
 * @param {number} [options.limit]
 */
const adminGetAllListings = async ({ location, isFilled, ownerId, page = 1, limit = 20 } = {}) => {
    const filter = {};

    if (location) {
        const safe = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.location = { $regex: safe, $options: 'i' };
    }
    if (isFilled !== undefined) filter.isFilled = isFilled === 'true' || isFilled === true;
    if (ownerId) filter.owner = ownerId;

    const { skip, limit: lim, page: pg } = safePagination(page, limit);

    const [listings, total] = await Promise.all([
        Listing.find(filter)
            .populate('owner', 'name email role isActive')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim)
            .lean(),
        Listing.countDocuments(filter)
    ]);

    return {
        listings,
        pagination: buildPaginationMeta(total, pg, lim)
    };
};

/**
 * Admin hard-deletes a listing (no owner check — admin power).
 * Images are removed from Cloudinary.
 * @param {string} listingId
 */
const adminDeleteListing = async (listingId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, 'Listing not found');

    if (listing.images.length > 0) {
        await Promise.all(listing.images.map(img => deleteFromCloudinary(img.publicId)));
    }
    await listing.deleteOne();
};

/**
 * Admin toggles the isFilled flag on a listing.
 * @param {string} listingId
 * @param {boolean} isFilled
 */
const adminToggleListingStatus = async (listingId, isFilled) => {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, 'Listing not found');

    listing.isFilled = isFilled;
    await listing.save();
    return listing;
};

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Returns an aggregate snapshot of the entire platform.
 * All counts run in parallel for maximum performance.
 */
const getPlatformStats = async () => {
    const [
        totalUsers,
        totalAdmins,
        totalOwners,
        totalTenants,
        totalListings,
        filledListings,
        availableListings,
        totalInterests,
        acceptedInterests,
        declinedInterests,
        pendingInterests,
        totalChats,
        totalMessages,
        totalNotifications
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'ADMIN' }),
        User.countDocuments({ role: 'OWNER' }),
        User.countDocuments({ role: 'TENANT' }),
        Listing.countDocuments(),
        Listing.countDocuments({ isFilled: true }),
        Listing.countDocuments({ isFilled: false }),
        Interest.countDocuments(),
        Interest.countDocuments({ status: 'ACCEPTED' }),
        Interest.countDocuments({ status: 'DECLINED' }),
        Interest.countDocuments({ status: 'PENDING' }),
        Chat.countDocuments(),
        Message.countDocuments(),
        Notification.countDocuments()
    ]);

    return {
        users: { total: totalUsers, admins: totalAdmins, owners: totalOwners, tenants: totalTenants },
        listings: { total: totalListings, filled: filledListings, available: availableListings },
        interests: { total: totalInterests, accepted: acceptedInterests, declined: declinedInterests, pending: pendingInterests },
        chats: { total: totalChats },
        messages: { total: totalMessages },
        notifications: { total: totalNotifications }
    };
};

module.exports = {
    getAllUsers,
    getUserById,
    disableUser,
    enableUser,
    deleteUser,
    adminGetAllListings,
    adminDeleteListing,
    adminToggleListingStatus,
    getPlatformStats
};
