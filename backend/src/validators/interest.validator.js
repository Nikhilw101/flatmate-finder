const { z } = require('zod');
const { INTEREST_STATUS } = require('../utils/constants');

// Tenant: expresses interest in a listing
const createInterestSchema = z.object({
    listingId: z.string().min(1, 'listingId is required')
});

// Owner: accepts or declines an interest request
const respondInterestSchema = z.object({
    status: z.enum(
        [INTEREST_STATUS.ACCEPTED, INTEREST_STATUS.DECLINED],
        {
            errorMap: () => ({
                message: `status must be either '${INTEREST_STATUS.ACCEPTED}' or '${INTEREST_STATUS.DECLINED}'`
            })
        }
    )
});

module.exports = { createInterestSchema, respondInterestSchema };
