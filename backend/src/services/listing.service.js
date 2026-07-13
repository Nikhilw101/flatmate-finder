const Listing = require('../models/Listing');
const { uploadMultipleToCloudinary, deleteFromCloudinary } = require('./upload.service');
const ApiError = require('../utils/ApiError');
const { generateScoresForListing } = require('./compatibility.service');

/**
 * Creates a new room listing for an owner.
 * Uploads images to Cloudinary first, then saves listing with image URLs to MongoDB.
 */
const createListing = async (ownerId, listingData, files = []) => {
    let images = [];
    if (files.length > 0) {
        images = await uploadMultipleToCloudinary(files, 'rent_flatmate/listings');
    }

    const listing = await Listing.create({
        owner: ownerId,
        ...listingData,
        images
    });

    // Fire-and-forget: generate compatibility scores against all tenant profiles.
    // Do NOT await — listing creation responds instantly.
    generateScoresForListing(listing._id).catch(() => {});

    return listing;
};

/**
 * Retrieves all available (non-filled) listings.
 * Supports optional filtering by location, rent range, roomType, furnishingStatus, availableFrom.
 * Supports sorting by newest (default), oldest, rent_asc, rent_desc.
 */
const getAllListings = async ({ location, maxRent, minRent, roomType, furnishingStatus, availableFrom, sort = 'newest', page = 1, limit = 10 } = {}) => {
    const filter = { isFilled: false };

    if (location) {
        const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.location = { $regex: escapedLocation, $options: 'i' };
    }
    if (minRent || maxRent) {
        filter.rent = {};
        if (minRent) filter.rent.$gte = Number(minRent);
        if (maxRent) filter.rent.$lte = Number(maxRent);
    }
    if (roomType) filter.roomType = roomType;
    if (furnishingStatus) filter.furnishingStatus = furnishingStatus;
    if (availableFrom) {
        const dateObj = new Date(availableFrom);
        if (!isNaN(dateObj)) {
            filter.availableFrom = { $gte: dateObj };
        }
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'rent_asc') sortObj = { rent: 1 };
    else if (sort === 'rent_desc') sortObj = { rent: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
        Listing.find(filter)
            .populate('owner', 'name email')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit)),
        Listing.countDocuments(filter)
    ]);

    return {
        listings,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};
/**
 * Retrieves a single listing by ID.
 * Throws 404 if not found.
 */
const getListingById = async (listingId) => {
    const listing = await Listing.findById(listingId).populate('owner', 'name email');
    if (!listing) {
        throw new ApiError(404, 'Listing not found');
    }
    return listing;
};

/**
 * Updates a listing. Only the owner of the listing may update it.
 */
const updateListing = async (listingId, ownerId, updateData, files = []) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new ApiError(404, 'Listing not found');
    }
    if (listing.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, 'You are not authorized to update this listing');
    }

    // Upload new images if provided
    if (files.length > 0) {
        const newImages = await uploadMultipleToCloudinary(files, 'rent_flatmate/listings');
        updateData.images = [...listing.images, ...newImages];
    }

    const updated = await Listing.findByIdAndUpdate(
        listingId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('owner', 'name email');

    // Fire-and-forget: invalidate and recompute scores since listing data changed.
    generateScoresForListing(listingId).catch(() => {});

    return updated;
};

/**
 * Deletes a listing and removes all its images from Cloudinary.
 * Only the listing owner may delete.
 */
const deleteListing = async (listingId, ownerId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new ApiError(404, 'Listing not found');
    }
    if (listing.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, 'You are not authorized to delete this listing');
    }

    // Delete all images from Cloudinary before removing the document
    if (listing.images.length > 0) {
        await Promise.all(listing.images.map((img) => deleteFromCloudinary(img.publicId)));
    }

    await listing.deleteOne();
};

/**
 * Marks a listing as filled (room is rented).
 * Only the listing owner may mark it.
 */
const markListingAsFilled = async (listingId, ownerId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new ApiError(404, 'Listing not found');
    }
    if (listing.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, 'You are not authorized to update this listing');
    }
    if (listing.isFilled) {
        throw new ApiError(400, 'Listing is already marked as filled');
    }

    listing.isFilled = true;
    await listing.save();

    return listing;
};

/**
 * Retrieves all listings created by a specific owner.
 */
const getOwnerListings = async (ownerId, { page = 1, limit = 10 } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    
    const [listings, total] = await Promise.all([
        Listing.find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Listing.countDocuments({ owner: ownerId })
    ]);

    return {
        listings,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

module.exports = {
    createListing,
    getAllListings,
    getListingById,
    updateListing,
    deleteListing,
    markListingAsFilled,
    getOwnerListings
};
