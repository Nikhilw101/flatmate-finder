/**
 * Notification Engine — Central hub for all business events.
 *
 * Architecture:
 *   Business Event → notificationService.notify*() → [MongoDB, Socket.io, Brevo]
 *
 * Rules:
 *   1. Database is always written first (system of record).
 *   2. Socket emission happens after DB write.
 *   3. Email is dispatched last — failures NEVER roll back DB or Socket.
 *   4. This service never imports interest.service or chat.service (no circular deps).
 *   5. getIO() is called lazily so this module can be imported before Socket is initialized.
 */

const Notification = require('../models/Notification');
const { sendEmail } = require('./email.service');
const emailTemplates = require('../utils/emailTemplates');
const { NOTIFICATION_TYPES, HIGH_COMPATIBILITY_THRESHOLD } = require('../utils/constants');
const ApiError = require('../utils/ApiError');

// ─── Socket Emission ──────────────────────────────────────────────────────────

/**
 * Emits a real-time 'notification:new' event to a specific user's socket room.
 * Fails silently if Socket.io is not yet initialised (safe for tests).
 *
 * Users join a personal room named by their user ID on connection.
 * @see src/config/socket.js — the socket connection handler adds `socket.join(userId)`
 */
const emitSocketNotification = (notification) => {
    try {
        const { getIO } = require('../config/socket');
        const io = getIO();
        const recipientRoom = notification.recipient.toString();

        io.to(recipientRoom).emit('notification:new', {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            relatedListing: notification.relatedListing,
            relatedInterest: notification.relatedInterest,
            createdAt: notification.createdAt
        });

        console.log(`[Notification:Socket] Emitted to user room: ${recipientRoom} | Type: ${notification.type}`);
    } catch (err) {
        // Socket may not be initialised in test environments — log and continue
        console.warn(`[Notification:Socket] Could not emit: ${err.message}`);
    }
};

// ─── Core Factory: Create + Persist + Emit ───────────────────────────────────

/**
 * Persists a notification to MongoDB and emits it via Socket.
 * This is the foundation all public notify* functions build upon.
 *
 * @param {Object} data
 * @returns {Promise<Notification>}
 */
const createNotification = async ({
    recipientId,
    senderId,
    type,
    title,
    message,
    relatedListingId,
    relatedInterestId
}) => {
    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId || null,
        type,
        title,
        message,
        relatedListing: relatedListingId || null,
        relatedInterest: relatedInterestId || null,
        isRead: false
    });

    console.log(`[Notification:DB] Created | Type: ${type} | Recipient: ${recipientId}`);

    // Emit socket event — never throws
    emitSocketNotification(notification);

    return notification;
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC BUSINESS EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Event 1: Interest Received ───────────────────────────────────────────────

/**
 * Called after an Interest document is created.
 *
 * Business rules:
 *  - Always creates notification for owner
 *  - Sends email to owner ONLY if compatibility score >= HIGH_COMPATIBILITY_THRESHOLD
 *
 * @param {Object} params
 * @param {Object} params.interest   - Populated Interest document
 * @param {Object} params.tenant     - Tenant User document { _id, name, email }
 * @param {Object} params.owner      - Owner User document  { _id, name, email }
 * @param {Object} params.listing    - Listing document     { _id, location, rent }
 * @param {number} params.score      - Compatibility score (0-100)
 */
const notifyInterestReceived = async ({ interest, tenant, owner, listing, score }) => {
    const scoreLabel = `${score}%`;

    // 1. Persist notification
    const notification = await createNotification({
        recipientId: owner._id,
        senderId: tenant._id,
        type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
        title: `New Interest Request`,
        message: `${tenant.name} (${scoreLabel} compatibility) is interested in your listing at ${listing.location}.`,
        relatedListingId: listing._id,
        relatedInterestId: interest._id
    });

    // 2. Send email only if score meets threshold
    if (score >= HIGH_COMPATIBILITY_THRESHOLD) {
        try {
            const { subject, htmlContent } = emailTemplates.highCompatibilityInterest({
                ownerName: owner.name,
                tenantName: tenant.name,
                score,
                location: listing.location,
                rent: listing.rent
            });
            await sendEmail({ to: owner.email, toName: owner.name, subject, htmlContent });
        } catch (emailErr) {
            // Email failure must never rollback notification — log only
            console.error(`[Notification:Email] Failed for INTEREST_RECEIVED | Owner: ${owner.email} | Err: ${emailErr.message}`);
        }
    } else {
        console.log(`[Notification:Email] Skipped INTEREST_RECEIVED — score ${score} < threshold ${HIGH_COMPATIBILITY_THRESHOLD}`);
    }

    return notification;
};

// ─── Event 2: Interest Accepted ───────────────────────────────────────────────

/**
 * Called after owner accepts an interest.
 * Always notifies tenant. Always sends email to tenant.
 *
 * @param {Object} params
 * @param {Object} params.interest - Populated Interest document
 * @param {Object} params.tenant   - Tenant User document
 * @param {Object} params.owner    - Owner User document
 * @param {Object} params.listing  - Listing document
 */
const notifyInterestAccepted = async ({ interest, tenant, owner, listing }) => {
    // 1. Persist notification for tenant
    const notification = await createNotification({
        recipientId: tenant._id,
        senderId: owner._id,
        type: NOTIFICATION_TYPES.INTEREST_ACCEPTED,
        title: `Interest Request Accepted! 🎉`,
        message: `${owner.name} has accepted your interest in the listing at ${listing.location}. You can now start chatting!`,
        relatedListingId: listing._id,
        relatedInterestId: interest._id
    });

    // 2. Send email to tenant
    try {
        const { subject, htmlContent } = emailTemplates.interestAccepted({
            tenantName: tenant.name,
            ownerName: owner.name,
            location: listing.location
        });
        await sendEmail({ to: tenant.email, toName: tenant.name, subject, htmlContent });
    } catch (emailErr) {
        console.error(`[Notification:Email] Failed for INTEREST_ACCEPTED | Tenant: ${tenant.email} | Err: ${emailErr.message}`);
    }

    return notification;
};

// ─── Event 3: Interest Declined ───────────────────────────────────────────────

/**
 * Called after owner declines an interest.
 * Always notifies tenant. Always sends email to tenant.
 *
 * @param {Object} params
 * @param {Object} params.interest - Populated Interest document
 * @param {Object} params.tenant   - Tenant User document
 * @param {Object} params.owner    - Owner User document
 * @param {Object} params.listing  - Listing document
 */
const notifyInterestDeclined = async ({ interest, tenant, owner, listing }) => {
    // 1. Persist notification for tenant
    const notification = await createNotification({
        recipientId: tenant._id,
        senderId: owner._id,
        type: NOTIFICATION_TYPES.INTEREST_DECLINED,
        title: `Interest Request Update`,
        message: `Unfortunately, ${owner.name} has declined your interest in the listing at ${listing.location}. Keep exploring other listings!`,
        relatedListingId: listing._id,
        relatedInterestId: interest._id
    });

    // 2. Send email to tenant
    try {
        const { subject, htmlContent } = emailTemplates.interestDeclined({
            tenantName: tenant.name,
            location: listing.location
        });
        await sendEmail({ to: tenant.email, toName: tenant.name, subject, htmlContent });
    } catch (emailErr) {
        console.error(`[Notification:Email] Failed for INTEREST_DECLINED | Tenant: ${tenant.email} | Err: ${emailErr.message}`);
    }

    return notification;
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION QUERY / MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Returns paginated notifications for a user, newest first.
 * @param {string} userId
 * @param {number} page  - 1-indexed page number
 * @param {number} limit - Items per page (max 50)
 */
const getNotifications = async (userId, page = 1, limit = 20) => {
    const safePage = Math.max(1, parseInt(page, 10));
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: userId })
            .populate('sender', 'name email role')
            .populate('relatedListing', 'location rent')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Notification.countDocuments({ recipient: userId })
    ]);

    return {
        notifications,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    };
};

/**
 * Returns the count of unread notifications for the bell icon.
 * @param {string} userId
 */
const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Marks a single notification as read.
 * Enforces ownership — users can only mark their own notifications.
 * @param {string} notificationId
 * @param {string} userId
 */
const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { $set: { isRead: true } },
        { new: true }
    );
    if (!notification) {
        throw new ApiError(404, 'Notification not found or you do not have permission to update it');
    }
    return notification;
};

/**
 * Marks ALL unread notifications as read for a user.
 * @param {string} userId
 */
const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
    );
    return { updatedCount: result.modifiedCount };
};

module.exports = {
    // Business event handlers
    notifyInterestReceived,
    notifyInterestAccepted,
    notifyInterestDeclined,
    // Query / management
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
