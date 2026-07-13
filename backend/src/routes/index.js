const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listingsRoutes = require('./listings.routes');
const interestsRoutes = require('./interests.routes');
const chatsRoutes = require('./chats.routes');
const notificationsRoutes = require('./notifications.routes');
const adminRoutes = require('./admin.routes');
const profileRoutes = require('./profile.routes');
const { generalLimiter } = require('../middlewares/rateLimit.middleware');

// Apply general rate limit to all /api/v1 routes
router.use(generalLimiter);

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/interests', interestsRoutes);
router.use('/chats', chatsRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
