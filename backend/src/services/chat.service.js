const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');

// ─── Create Chat Room ─────────────────────────────────────────────────────────

/**
 * Provisions a chat room for an accepted interest.
 * Idempotent: uses upsert so calling it twice never creates duplicates.
 *
 * @param {Object} interest - The accepted Interest document
 * @returns {Promise<Object>} The Chat document
 */
const createChat = async (interest) => {
    const chat = await Chat.findOneAndUpdate(
        { interest: interest._id },
        {
            $setOnInsert: {
                interest: interest._id,
                tenant: interest.tenant,
                owner: interest.owner,
                listing: interest.listing
            }
        },
        { upsert: true, new: true }
    );
    return chat;
};

// ─── Participant Verification Utility ────────────────────────────────────────

/**
 * Loads a chat and verifies the requesting user is a participant.
 * Shared utility used by REST controllers and Socket.io handlers.
 *
 * @param {string} chatId
 * @param {string} userId
 * @returns {Promise<Object>} The Chat document
 * @throws {ApiError} 404 if not found, 403 if not a participant
 */
const findChatAndVerifyParticipant = async (chatId, userId) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, 'Chat not found');
    }

    const isParticipant =
        chat.tenant.toString() === userId.toString() ||
        chat.owner.toString() === userId.toString();

    if (!isParticipant) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    return chat;
};

// ─── Get My Chats ─────────────────────────────────────────────────────────────

/**
 * Returns all chats a user participates in (as tenant or owner).
 * @param {string} userId
 */
const getMyChats = async (userId) => {
    return Chat.find({
        $or: [{ tenant: userId }, { owner: userId }]
    })
        .populate('tenant', 'name email')
        .populate('owner', 'name email')
        .populate('listing', 'location rent roomType')
        .populate('interest', 'status compatibility')
        .sort({ updatedAt: -1 });
};

// ─── Get Chat Message History ─────────────────────────────────────────────────

/**
 * Returns all messages in a chat in chronological order.
 * Verifies the requesting user is a participant.
 *
 * @param {string} chatId
 * @param {string} userId
 */
const getChatMessages = async (chatId, userId) => {
    // This call also verifies participation — throws 403/404 if invalid
    await findChatAndVerifyParticipant(chatId, userId);

    return Message.find({ chat: chatId })
        .populate('sender', 'name email role')
        .sort({ createdAt: 1 }); // Chronological — oldest first
};

// ─── Save Message ─────────────────────────────────────────────────────────────

/**
 * Persists a message to MongoDB.
 * Database-first: message is saved BEFORE being emitted to room.
 *
 * @param {string} chatId
 * @param {string} senderId
 * @param {string} content
 * @returns {Promise<Object>} Saved Message (with sender populated)
 */
const saveMessage = async (chatId, senderId, content) => {
    // Participant check — will throw 403 if sender is not in the chat
    await findChatAndVerifyParticipant(chatId, senderId);

    const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content: content.trim()
    });

    // Touch the chat's updatedAt so it floats to the top in chat list
    await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: new Date() } });

    return message.populate('sender', 'name email role');
};

module.exports = {
    createChat,
    findChatAndVerifyParticipant,
    getMyChats,
    getChatMessages,
    saveMessage
};
