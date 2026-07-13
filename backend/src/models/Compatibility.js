const mongoose = require('mongoose');

const compatibilitySchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: [true, 'Listing reference is required']
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant reference is required']
        },
        score: {
            type: Number,
            required: [true, 'Score is required'],
            min: 0,
            max: 100
        },
        explanation: {
            type: String,
            required: [true, 'Explanation is required'],
            trim: true
        },
        engine: {
            type: String,
            enum: ['AI', 'RULE'],
            required: [true, 'Engine type is required']
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        // We use generatedAt explicitly, not timestamps, because we only
        // care about when the score was computed — not when the doc was modified.
        timestamps: false
    }
);

// One score per (tenant + listing) pair — enforced at DB level
compatibilitySchema.index({ listing: 1, tenant: 1 }, { unique: true });

// Used by the browse query: fetch all scores for a tenant sorted desc
compatibilitySchema.index({ tenant: 1, score: -1 });

const Compatibility = mongoose.model('Compatibility', compatibilitySchema);

module.exports = Compatibility;
