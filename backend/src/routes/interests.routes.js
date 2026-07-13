const express = require('express');
const router = express.Router();

const interestController = require('../controllers/interest.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createInterestSchema, respondInterestSchema } = require('../validators/interest.validator');

// ─── Tenant Routes ────────────────────────────────────────────────────────────

// POST /api/v1/interests — Tenant submits an interest request
router.post(
    '/',
    protect,
    authorize('TENANT'),
    validate(createInterestSchema),
    interestController.expressInterest
);

// GET /api/v1/interests/my — Tenant views their own requests
router.get('/my', protect, authorize('TENANT'), interestController.getMyInterests);

// ─── Owner Routes ─────────────────────────────────────────────────────────────

// GET /api/v1/interests/incoming — Owner sees all requests for their listings
router.get('/incoming', protect, authorize('OWNER'), interestController.getIncomingRequests);

// PATCH /api/v1/interests/:id/respond — Owner accepts or declines a request
router.patch(
    '/:id/respond',
    protect,
    authorize('OWNER'),
    validate(respondInterestSchema),
    interestController.respondToInterest
);

module.exports = router;
