const compatibilityService = require('../services/compatibility.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/v1/listings/browse
 * Returns active listings sorted by pre-computed compatibility score for the tenant.
 * Never calls Gemini — reads stored scores only.
 */
const browseListings = catchAsync(async (req, res) => {
    const results = await compatibilityService.getBrowseListings(req.user._id);
    res.status(200).json(
        new ApiResponse(200, results, 'Listings retrieved sorted by compatibility score')
    );
});

module.exports = { browseListings };
