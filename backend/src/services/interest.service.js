const Interest = require('../models/Interest');
const Listing = require('../models/Listing');
const TenantProfile = require('../models/TenantProfile');
const Compatibility = require('../models/Compatibility');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { INTEREST_STATUS } = require('../utils/constants');
const chatService = require('./chat.service');
const notificationService = require('./notification.service');

// ─── Express Interest ─────────────────────────────────────────────────────────

/**
 * Tenant expresses interest in a listing.
 *
 * Validates in strict order:
 *  1. Tenant has a profile
 *  2. Listing exists and is not filled
 *  3. Tenant is not the owner of the listing
 *  4. A compatibility score exists (ensures tenant has browsed)
 *  5. No duplicate request
 *
 * @param {string} tenantId
 * @param {string} listingId
 * @returns {Promise<Object>} Newly created Interest document (populated)
 */
const expressInterest = async (tenantId, listingId) => {
    // 1. Tenant must have a profile before expressing interest
    const profile = await TenantProfile.findOne({ tenant: tenantId });
    if (!profile) {
        throw new ApiError(400, 'You must create a tenant profile before expressing interest in a listing');
    }

    // 2. Listing must exist and be active
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new ApiError(404, 'Listing not found');
    }
    if (listing.isFilled) {
        throw new ApiError(400, 'This listing is no longer available');
    }

    // 3. Tenant cannot interest their own listing
    if (listing.owner.toString() === tenantId.toString()) {
        throw new ApiError(400, 'You cannot express interest in your own listing');
    }

    // 4. Compatibility score must exist (tenant must have browsed first)
    const compatibility = await Compatibility.findOne({ listing: listingId, tenant: tenantId });
    if (!compatibility) {
        throw new ApiError(400, 'No compatibility score found. Please browse listings first to generate your match score');
    }

    // 5. No duplicate requests
    const existing = await Interest.findOne({ tenant: tenantId, listing: listingId });
    if (existing) {
        throw new ApiError(409, 'You have already expressed interest in this listing');
    }

    const interest = await Interest.create({
        tenant: tenantId,
        listing: listingId,
        owner: listing.owner,
        compatibility: compatibility._id,
        status: INTEREST_STATUS.PENDING
    });

    const populated = await interest
        .populate([
            { path: 'listing', select: 'location rent roomType furnishingStatus availableFrom' },
            { path: 'owner', select: 'name email' },
            { path: 'compatibility', select: 'score explanation' }
        ])
        .then(doc => doc);

    // Trigger notification engine — fire-and-forget (never blocks the HTTP response)
    const tenantUser = await User.findById(tenantId).select('name email');
    const ownerUser = await User.findById(listing.owner).select('name email');
    notificationService
        .notifyInterestReceived({
            interest: populated,
            tenant: tenantUser,
            owner: ownerUser,
            listing: { _id: listing._id, location: listing.location, rent: listing.rent },
            score: compatibility.score
        })
        .catch(err => console.error('[Interest] Notification failed (non-fatal):', err.message));

    return populated;
};

// ─── Tenant: View Own Requests ────────────────────────────────────────────────

/**
 * Returns all interest requests submitted by a tenant.
 * @param {string} tenantId
 */
const getMyInterests = async (tenantId, { status, page = 1, limit = 10 } = {}) => {
    const filter = { tenant: tenantId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [interests, total] = await Promise.all([
        Interest.find(filter)
            .populate('listing', 'location rent roomType furnishingStatus isFilled')
            .populate('owner', 'name email')
            .populate('compatibility', 'score explanation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Interest.countDocuments(filter)
    ]);

    return {
        interests,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

// ─── Owner: View Incoming Requests ───────────────────────────────────────────

/**
 * Returns all interest requests for all of this owner's listings.
 * Includes tenant profile compatibility score for the owner dashboard.
 * @param {string} ownerId
 */
const getIncomingRequests = async (ownerId, { status, page = 1, limit = 10 } = {}) => {
    const filter = { owner: ownerId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
        Interest.find(filter)
            .populate('listing', 'location rent roomType furnishingStatus')
            .populate('tenant', 'name email')
            .populate('compatibility', 'score explanation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Interest.countDocuments(filter)
    ]);

    return {
        requests,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

// ─── Owner: Accept or Decline ─────────────────────────────────────────────────

/**
 * Owner accepts or declines a pending interest request.
 *
 * Business rules enforced:
 *  - Only the owner of the listing can respond
 *  - Only PENDING requests can be responded to (immutable once resolved)
 *  - On ACCEPTED: a Chat room is provisioned
 *
 * @param {string} interestId
 * @param {string} ownerId
 * @param {string} newStatus - 'ACCEPTED' or 'DECLINED'
 */
const respondToInterest = async (interestId, ownerId, newStatus) => {
    const interest = await Interest.findById(interestId);
    if (!interest) {
        throw new ApiError(404, 'Interest request not found');
    }

    if (interest.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, 'You are not authorized to respond to this request');
    }

    if (interest.status !== INTEREST_STATUS.PENDING) {
        throw new ApiError(400, `This request has already been ${interest.status.toLowerCase()} and cannot be changed`);
    }

    interest.status = newStatus;
    await interest.save();

    // Provision chat room immediately upon acceptance
    if (newStatus === INTEREST_STATUS.ACCEPTED) {
        await chatService.createChat(interest);
    }

    const populated = await interest
        .populate([
            { path: 'listing', select: 'location rent roomType' },
            { path: 'tenant', select: 'name email' },
            { path: 'compatibility', select: 'score explanation' }
        ])
        .then(doc => doc);

    // Trigger notification engine — fire-and-forget
    const tenantUser = await User.findById(interest.tenant).select('name email');
    const ownerUser = await User.findById(ownerId).select('name email');
    const listingDoc = await Listing.findById(interest.listing).select('location rent');

    const notifyFn = newStatus === INTEREST_STATUS.ACCEPTED
        ? notificationService.notifyInterestAccepted
        : notificationService.notifyInterestDeclined;

    notifyFn({
        interest: populated,
        tenant: tenantUser,
        owner: ownerUser,
        listing: listingDoc
    }).catch(err => console.error('[Interest] Notification failed (non-fatal):', err.message));

    return populated;
};

module.exports = {
    expressInterest,
    getMyInterests,
    getIncomingRequests,
    respondToInterest
};
