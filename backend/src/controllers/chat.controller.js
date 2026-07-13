const chatService = require('../services/chat.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/v1/chats
 * Returns all chats the authenticated user participates in.
 * Works for both TENANT and OWNER roles.
 */
const getMyChats = catchAsync(async (req, res) => {
    const chats = await chatService.getMyChats(req.user._id);
    res.status(200).json(new ApiResponse(200, chats, 'Your chats retrieved successfully'));
});

/**
 * GET /api/v1/chats/:chatId/messages
 * Returns message history for a chat room.
 * Only accessible by participants (tenant or owner of that chat).
 */
const getChatMessages = catchAsync(async (req, res) => {
    const messages = await chatService.getChatMessages(req.params.chatId, req.user._id);
    res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved successfully'));
});

module.exports = { getMyChats, getChatMessages };
