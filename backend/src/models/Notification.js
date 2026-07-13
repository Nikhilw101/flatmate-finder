const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
    {
        // The user who will see this notification in their bell
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required']
        },
        // The user who triggered the event (optional — system events have no sender)
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: [true, 'Notification type is required']
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 150
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: 500
        },
        // Context references — both optional; used to build deep-link URLs on the frontend
        relatedListing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            default: null
        },
        relatedInterest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interest',
            default: null
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Fast bell-icon query: all unread for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Fast unread count query
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
