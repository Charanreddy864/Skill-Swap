const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getUserConversations, getChatMessages, getUnreadCount } = require('../controllers/conversations');

// All routes require authentication
router.use(authMiddleware);

// Get all conversations for logged-in user
router.get('/conversations', getUserConversations);

// Get chat messages with a specific friend
router.get('/messages/:friendId', getChatMessages);

// Get total unread message count
router.get('/unread-count', getUnreadCount);

// Get unread count for a specific conversation
router.get('/unread-count/:conversationId', getUnreadCount);

module.exports = router;
