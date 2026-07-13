const listingService = require('../services/listing.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * POST /api/v1/listings
 * Owner creates a new listing (with optional image uploads).
 */
const createListing = catchAsync(async (req, res) => {
    const listing = await listingService.createListing(
        req.user._id,
        req.body,
        req.files || []
    );
    res.status(201).json(new ApiResponse(201, listing, 'Listing created successfully'));
});

/**
 * GET /api/v1/listings
 * Any authenticated user can browse available listings with optional filters.
 */
const getAllListings = catchAsync(async (req, res) => {
    const { location, minRent, maxRent, roomType, furnishingStatus, availableFrom, sort, page, limit } = req.query;
    const result = await listingService.getAllListings({ location, minRent, maxRent, roomType, furnishingStatus, availableFrom, sort, page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Listings retrieved successfully'));
});

/**
 * GET /api/v1/listings/:id
 * Fetch a single listing by its ID.
 */
const getListingById = catchAsync(async (req, res) => {
    const listing = await listingService.getListingById(req.params.id);
    res.status(200).json(new ApiResponse(200, listing, 'Listing retrieved successfully'));
});

/**
 * PUT /api/v1/listings/:id
 * Owner updates their listing (with optional new image uploads).
 */
const updateListing = catchAsync(async (req, res) => {
    const listing = await listingService.updateListing(
        req.params.id,
        req.user._id,
        req.body,
        req.files || []
    );
    res.status(200).json(new ApiResponse(200, listing, 'Listing updated successfully'));
});

/**
 * DELETE /api/v1/listings/:id
 * Owner deletes their listing (images are purged from Cloudinary).
 */
const deleteListing = catchAsync(async (req, res) => {
    await listingService.deleteListing(req.params.id, req.user._id);
    res.status(200).json(new ApiResponse(200, null, 'Listing deleted successfully'));
});

/**
 * PATCH /api/v1/listings/:id/fill
 * Owner marks their listing as filled (hidden from search).
 */
const markListingAsFilled = catchAsync(async (req, res) => {
    const listing = await listingService.markListingAsFilled(req.params.id, req.user._id);
    res.status(200).json(new ApiResponse(200, listing, 'Listing marked as filled'));
});

/**
 * GET /api/v1/listings/my
 * Owner retrieves all their own listings (filled + active).
 */
const getMyListings = catchAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await listingService.getOwnerListings(req.user._id, { page, limit });
    res.status(200).json(new ApiResponse(200, result, 'Your listings retrieved successfully'));
});

module.exports = {
    createListing,
    getAllListings,
    getListingById,
    updateListing,
    deleteListing,
    markListingAsFilled,
    getMyListings
};
