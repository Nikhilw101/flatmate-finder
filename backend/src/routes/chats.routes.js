const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

// Both endpoints require authentication but no role restriction —
// participant verification is handled inside the service layer.

// GET /api/v1/chats — List all chats the authenticated user is in
router.get('/', protect, chatController.getMyChats);

// GET /api/v1/chats/:chatId/messages — Load message history (participants only)
router.get('/:chatId/messages', protect, chatController.getChatMessages);

module.exports = router;
