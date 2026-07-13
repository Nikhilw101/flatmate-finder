const ApiError = require('../utils/ApiError');
const { ZodError } = require('zod');

const validate = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    } catch (error) {
        let formattedErrors = [];
        if (error && (error.errors || error.issues)) {
            const issues = error.errors || error.issues;
            formattedErrors = issues.map(err => ({
                field: err.path ? err.path.join('.') : 'unknown',
                message: err.message
            }));
        }
        next(new ApiError(400, "Validation Error", formattedErrors));
    }
};

module.exports = { validate };
