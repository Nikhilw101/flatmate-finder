const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

/**
 * Socket.io authentication middleware.
 * Mirrors the REST `protect` middleware but for WebSocket connections.
 *
 * Clients must pass their JWT in the handshake:
 *   socket = io(URL, { auth: { token: 'Bearer <token>' } })
 *
 * On success: attaches `socket.user` (without password) and calls next().
 * On failure: calls next(new Error('Unauthorized')) → client is disconnected.
 */
const authenticateSocket = async (socket, next) => {
    try {
        const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new Error('Unauthorized: No token provided'));
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('Unauthorized: User not found'));
        }

        socket.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Unauthorized: Token expired'));
        }
        return next(new Error('Unauthorized: Invalid token'));
    }
};

module.exports = { authenticateSocket };
