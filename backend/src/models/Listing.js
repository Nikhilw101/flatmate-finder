const mongoose = require('mongoose');
const { ROOM_TYPES, FURNISHING_STATUS } = require('../utils/constants');

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true }
}, { _id: false });

const listingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    rent: {
        type: Number,
        required: [true, 'Rent is required'],
        min: [1, 'Rent must be a positive number']
    },
    availableFrom: {
        type: Date,
        required: [true, 'Available from date is required']
    },
    roomType: {
        type: String,
        enum: Object.values(ROOM_TYPES),
        required: [true, 'Room type is required']
    },
    furnishingStatus: {
        type: String,
        enum: Object.values(FURNISHING_STATUS),
        required: [true, 'Furnishing status is required']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        default: ''
    },
    images: {
        type: [imageSchema],
        default: []
    },
    isFilled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient tenant browsing queries
listingSchema.index({ location: 1, rent: 1, isFilled: 1 });

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
