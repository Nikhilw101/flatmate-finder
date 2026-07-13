const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        // One chat room per accepted interest — enforced at DB level
        interest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interest',
            required: [true, 'Interest reference is required'],
            unique: true
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant reference is required']
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner reference is required']
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: [true, 'Listing reference is required']
        }
    },
    {
        timestamps: true
    }
);

// Fast chat list queries for each participant
chatSchema.index({ tenant: 1 });
chatSchema.index({ owner: 1 });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
