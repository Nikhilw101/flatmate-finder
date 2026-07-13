const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { toggleListingStatusSchema } = require('../validators/admin.validator');

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

// ─── Platform Statistics ──────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ─── User Management ──────────────────────────────────────────────────────────
// IMPORTANT: static paths registered before /:id to prevent shadowing
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/disable', adminController.disableUser);
router.patch('/users/:id/enable', adminController.enableUser);
router.delete('/users/:id', adminController.deleteUser);

// ─── Listing Management ───────────────────────────────────────────────────────
router.get('/listings', adminController.getListings);
router.delete('/listings/:id', adminController.deleteListing);
router.patch(
    '/listings/:id/status',
    validate(toggleListingStatusSchema),
    adminController.toggleListingStatus
);

module.exports = router;
