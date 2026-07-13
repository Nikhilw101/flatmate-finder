const express = require('express');
const router = express.Router();

const listingController = require('../controllers/listing.controller');
const compatibilityController = require('../controllers/compatibility.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { createListingSchema, updateListingSchema } = require('../validators/listing.validator');

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get('/', listingController.getAllListings);

// ─── Authenticated + Owner-only Routes ────────────────────────────────────────
// IMPORTANT: All static paths must be registered BEFORE /:id to avoid Express
// matching literal strings as Mongo ObjectId parameters.

router.get('/my/all', protect, authorize('OWNER'), listingController.getMyListings);

// ─── Tenant Browse Route (AI compatibility ranked) ────────────────────────────
// Requires TENANT role. Reads pre-computed scores from MongoDB. Never calls AI.

router.get('/browse', protect, authorize('TENANT'), compatibilityController.browseListings);

router.post(
    '/',
    protect,
    authorize('OWNER'),
    upload.array('images', 5),
    validate(createListingSchema),
    listingController.createListing
);

router.put(
    '/:id',
    protect,
    authorize('OWNER'),
    upload.array('images', 5),
    validate(updateListingSchema),
    listingController.updateListing
);

router.delete('/:id', protect, authorize('OWNER'), listingController.deleteListing);

router.patch('/:id/fill', protect, authorize('OWNER'), listingController.markListingAsFilled);

// ─── Parameterised public route — must be LAST to avoid shadowing static paths ─

router.get('/:id', listingController.getListingById);

module.exports = router;
