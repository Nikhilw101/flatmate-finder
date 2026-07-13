const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

// All notification endpoints require authentication.
// No role restriction — both TENANT and OWNER have notifications.
// Authorization is enforced inside the service (ownership check per document).

// GET  /api/v1/notifications?page=1&limit=20  — paginated list
router.get('/', protect, notificationController.getNotifications);

// GET  /api/v1/notifications/unread-count     — bell badge count
// MUST be before /:id to prevent "unread-count" being matched as an ObjectId
router.get('/unread-count', protect, notificationController.getUnreadCount);

// PATCH /api/v1/notifications/read-all        — mark all as read
// MUST be before /:id/read for same reason
router.patch('/read-all', protect, notificationController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read        — mark one as read
router.patch('/:id/read', protect, notificationController.markAsRead);

module.exports = router;

