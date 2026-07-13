// Application-wide constants. Single source of truth — import here, never hardcode elsewhere.

const ROLES = Object.freeze({
    TENANT: 'TENANT',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN'
});

const ROOM_TYPES = Object.freeze({
    PRIVATE: 'Private Room',
    SHARED: 'Shared Room',
    STUDIO: 'Studio',
    ENTIRE_APARTMENT: 'Entire Apartment'
});

const FURNISHING_STATUS = Object.freeze({
    FULLY_FURNISHED: 'Fully Furnished',
    SEMI_FURNISHED: 'Semi Furnished',
    UNFURNISHED: 'Unfurnished'
});

const INTEREST_STATUS = Object.freeze({
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED'
});

const AI_SCORE_THRESHOLD = 80; // Score above which email notifications are sent

const NOTIFICATION_TYPES = Object.freeze({
    INTEREST_RECEIVED: 'INTEREST_RECEIVED',
    INTEREST_ACCEPTED: 'INTEREST_ACCEPTED',
    INTEREST_DECLINED: 'INTEREST_DECLINED'
});

const HIGH_COMPATIBILITY_THRESHOLD = 80; // Score >= this triggers email to owner

module.exports = {
    ROLES,
    ROOM_TYPES,
    FURNISHING_STATUS,
    INTEREST_STATUS,
    AI_SCORE_THRESHOLD,
    NOTIFICATION_TYPES,
    HIGH_COMPATIBILITY_THRESHOLD
};
