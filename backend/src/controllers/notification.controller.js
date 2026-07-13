const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/v1/notifications?page=1&limit=20
 * Returns paginated notifications for the authenticated user, newest first.
 */
const getNotifications = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getNotifications(req.user._id, page, limit);
    res.status(200).json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
});

/**
 * GET /api/v1/notifications/unread-count
 * Returns the count of unread notifications for the bell icon badge.
 */
const getUnreadCount = catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.status(200).json(new ApiResponse(200, { unreadCount: count }, 'Unread count retrieved'));
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read. Enforces ownership.
 */
const markAsRead = catchAsync(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
});

/**
 * PATCH /api/v1/notifications/read-all
 * Marks all unread notifications as read for the authenticated user.
 */
const markAllAsRead = catchAsync(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.status(200).json(new ApiResponse(200, result, `${result.updatedCount} notifications marked as read`));
});

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
