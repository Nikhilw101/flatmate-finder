const { z } = require('zod');

/**
 * Validates the body of PATCH /admin/listings/:id/status
 */
const toggleListingStatusSchema = z.object({
    isFilled: z.boolean({ required_error: 'isFilled (boolean) is required' })
});

module.exports = { toggleListingStatusSchema };
