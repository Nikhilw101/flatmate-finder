const { z } = require('zod');
const { ROOM_TYPES, FURNISHING_STATUS } = require('../utils/constants');

const createListingSchema = z.object({
    location: z.string().min(2, 'Location must be at least 2 characters'),
    rent: z.coerce.number().positive('Rent must be a positive number'),
    availableFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'availableFrom must be a valid date string'
    }),
    roomType: z.enum(Object.values(ROOM_TYPES), {
        errorMap: () => ({ message: `roomType must be one of: ${Object.values(ROOM_TYPES).join(', ')}` })
    }),
    furnishingStatus: z.enum(Object.values(FURNISHING_STATUS), {
        errorMap: () => ({ message: `furnishingStatus must be one of: ${Object.values(FURNISHING_STATUS).join(', ')}` })
    }),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
});

const updateListingSchema = createListingSchema.partial();

module.exports = {
    createListingSchema,
    updateListingSchema
};
