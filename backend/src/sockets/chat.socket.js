const chatService = require('../services/chat.service');

/**
 * Registers all real-time chat event handlers for an authenticated socket connection.
 *
 * Event contract:
 *
 *   CLIENT → SERVER
 *   ───────────────
 *   join_chat    { chatId }               — Join a chat room
 *   send_message { chatId, content }      — Send a message
 *
 *   SERVER → CLIENT
 *   ───────────────
 *   joined_chat  { chatId }               — Confirms room join
 *   new_message  { message }              — Broadcasts a new message to the room
 *   chat_error   { message }              — Reports an error back to the sender only
 *
 * @param {import('socket.io').Server} io     - The Socket.io server instance
 * @param {import('socket.io').Socket} socket - The authenticated socket connection
 */
const registerChatHandlers = (io, socket) => {
    // ── join_chat ─────────────────────────────────────────────────────────────
    socket.on('join_chat', async ({ chatId } = {}) => {
        try {
            if (!chatId) {
                return socket.emit('chat_error', { message: 'chatId is required to join a chat room' });
            }

            // Verifies participation — throws 403/404 if the user is not a participant
            await chatService.findChatAndVerifyParticipant(chatId, socket.user._id);

            socket.join(chatId);
            socket.emit('joined_chat', { chatId });
        } catch (error) {
            socket.emit('chat_error', { message: error.message || 'Failed to join chat room' });
        }
    });

    // ── send_message ──────────────────────────────────────────────────────────
    socket.on('send_message', async ({ chatId, content } = {}) => {
        try {
            // Validate inputs
            if (!chatId) {
                return socket.emit('chat_error', { message: 'chatId is required' });
            }
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                return socket.emit('chat_error', { message: 'Message content cannot be empty' });
            }
            if (content.trim().length > 1000) {
                return socket.emit('chat_error', { message: 'Message cannot exceed 1000 characters' });
            }

            // Database-first: persist before broadcasting
            const message = await chatService.saveMessage(chatId, socket.user._id, content);

            // Broadcast to all participants in the room (including the sender)
            io.to(chatId).emit('new_message', { message });
        } catch (error) {
            socket.emit('chat_error', { message: error.message || 'Failed to send message' });
        }
    });
};

module.exports = { registerChatHandlers };
