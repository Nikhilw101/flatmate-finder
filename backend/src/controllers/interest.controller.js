const interestService = require('../services/interest.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * POST /api/v1/interests
 * Tenant expresses interest in a listing.
 */
const expressInterest = catchAsync(async (req, res) => {
    const interest = await interestService.expressInterest(req.user._id, req.body.listingId);
    res.status(201).json(new ApiResponse(201, interest, 'Interest request submitted successfully'));
});

/**
 * GET /api/v1/interests/my
 * Tenant views all their own interest requests.
 */
const getMyInterests = catchAsync(async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await interestService.getMyInterests(req.user._id, { status, page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Your interest requests retrieved successfully'));
});

/**
 * GET /api/v1/interests/incoming
 * Owner views all incoming interest requests across their listings.
 */
const getIncomingRequests = catchAsync(async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await interestService.getIncomingRequests(req.user._id, { status, page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Incoming interest requests retrieved successfully'));
});

/**
 * PATCH /api/v1/interests/:id/respond
 * Owner accepts or declines an interest request.
 */
const respondToInterest = catchAsync(async (req, res) => {
    const interest = await interestService.respondToInterest(
        req.params.id,
        req.user._id,
        req.body.status
    );
    res.status(200).json(new ApiResponse(200, interest, `Interest request ${req.body.status.toLowerCase()} successfully`));
});

module.exports = {
    expressInterest,
    getMyInterests,
    getIncomingRequests,
    respondToInterest
};
