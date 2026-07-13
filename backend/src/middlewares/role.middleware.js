const ApiError = require('../utils/ApiError');

/**
 * Middleware factory: restricts route access to specific roles.
 * @param {...string} roles - Allowed roles (e.g., 'OWNER', 'ADMIN')
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Not authorized, no user found'));
    }
    if (!roles.includes(req.user.role)) {
        return next(
            new ApiError(403, `Role '${req.user.role}' is not allowed to perform this action`)
        );
    }
    next();
};

module.exports = { authorize };
