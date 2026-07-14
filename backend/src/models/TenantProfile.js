const mongoose = require('mongoose');

const tenantProfileSchema = new mongoose.Schema(
    {
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant ID is required'],
            unique: true // Ensures a tenant can only have ONE profile
        },
        preferredLocation: {
            type: String,
            required: [true, 'Preferred location is required'],
            trim: true
        },
        minBudget: {
            type: Number,
            required: [true, 'Minimum budget is required'],
            min: [0, 'Minimum budget cannot be negative']
        },
        maxBudget: {
            type: Number,
            required: [true, 'Maximum budget is required']
        },
        moveInDate: {
            type: Date,
            required: [true, 'Move-in date is required']
        },
        preferredRoomType: {
            type: String,
            default: 'Any'
        },
        preferredFurnishing: {
            type: String,
            default: 'Any'
        }
    },
    {
        timestamps: true
    }
);

// Mongoose pre-validate hook to ensure maxBudget >= minBudget
tenantProfileSchema.pre('validate', function (next) {
    if (this.maxBudget < this.minBudget) {
        this.invalidate('maxBudget', 'Maximum budget must be greater than or equal to minimum budget');
    }
    next();
});

const TenantProfile = mongoose.model('TenantProfile', tenantProfileSchema);

module.exports = TenantProfile;
