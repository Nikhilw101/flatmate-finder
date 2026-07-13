const { Server } = require('socket.io');
const { authenticateSocket } = require('../sockets/auth.socket');
const { registerChatHandlers } = require('../sockets/chat.socket');

let io;

/**
 * Initialises the Socket.io server and attaches it to the HTTP server.
 * Called once from server.js.
 */
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST']
        }
    });

    // Global JWT authentication — every socket connection must provide a valid token
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        // Join personal room named by userId — used by Notification Engine to target specific users
        socket.join(socket.user._id.toString());

        // Register all chat event handlers for this authenticated socket
        registerChatHandlers(io, socket);

        socket.on('disconnect', () => {
            // Silently disconnect
        });
    });

    return io;
};

/**
 * Returns the active Socket.io instance.
 * Used by services to emit server-side events (e.g., notifications in Stage 7).
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const closeSocket = () => {
    if (io) {
        io.close();
        io = null;
    }
};

module.exports = { initSocket, getIO, closeSocket };
