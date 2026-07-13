const mongoose = require('mongoose');
const { INTEREST_STATUS } = require('../utils/constants');

const interestSchema = new mongoose.Schema(
    {
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant reference is required']
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: [true, 'Listing reference is required']
        },
        // Denormalized for fast owner-dashboard queries without populating Listing
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner reference is required']
        },
        // Reference to the pre-computed compatibility score for display in the owner dashboard
        compatibility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Compatibility',
            default: null
        },
        status: {
            type: String,
            enum: Object.values(INTEREST_STATUS),
            default: INTEREST_STATUS.PENDING
        }
    },
    {
        timestamps: true
    }
);

// Enforce exactly one interest request per (tenant + listing) pair at DB level
interestSchema.index({ tenant: 1, listing: 1 }, { unique: true });

// Fast owner dashboard: filter by owner + status
interestSchema.index({ owner: 1, status: 1 });

// Fast tenant interest list
interestSchema.index({ tenant: 1 });

const Interest = mongoose.model('Interest', interestSchema);
module.exports = Interest;
