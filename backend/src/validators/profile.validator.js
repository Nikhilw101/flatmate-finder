const { z } = require('zod');

const upsertProfileSchema = z.object({
    preferredLocation: z.string().min(1, 'Preferred location cannot be empty'),
    minBudget: z.coerce.number().min(0, 'Minimum budget cannot be negative'),
    maxBudget: z.coerce.number(),
    moveInDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'moveInDate must be a valid date string'
    })
}).refine(data => data.maxBudget >= data.minBudget, {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['maxBudget']
});

module.exports = {
    upsertProfileSchema
};
