const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new ApiError(401, 'Not authorized, no token provided'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new ApiError(401, 'Not authorized, user not found'));
        }
        if (!user.isActive) {
            return next(new ApiError(403, 'Your account has been disabled. Please contact support'));
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Not authorized, token expired'));
        }
        return next(new ApiError(401, 'Not authorized, token failed'));
    }
};

module.exports = { protect };
