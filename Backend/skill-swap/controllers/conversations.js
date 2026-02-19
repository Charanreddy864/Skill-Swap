const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

/**
 * Get all conversations for a user
 */
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Optimized query with lean() and indexed fields
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'userName email')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'userName'
            }
        })
        .sort({ updatedAt: -1 }) // Sort by most recently updated
        .lean(); // Performance optimization

        // Batch query for unread counts - more efficient than individual queries
        const conversationIds = conversations.map(conv => conv._id);
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    sender: { $ne: userId },
                    status: { $in: ['sent', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map for quick lookup
        const unreadMap = new Map(
            unreadCounts.map(item => [item._id.toString(), item.count])
        );

        // Add unread counts to conversations
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv,
            unreadCount: unreadMap.get(conv._id.toString()) || 0
        }));

        res.status(200).json({
            success: true,
            conversations: conversationsWithUnread
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations',
            error: error.message
        });
    }
};

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'Friend ID is required'
            });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [userId, friendId], $size: 2 }
        })
        .populate('participants', 'userName email')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'userName'
            }
        });

        // If no conversation exists, create one
        if (!conversation) {
            conversation = new Conversation({
                participants: [userId, friendId],
                isGroup: false
            });

            await conversation.save();

            // Populate the new conversation
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'userName email');
        }

        res.status(200).json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting/creating conversation',
            error: error.message
        });
    }
};

/**
 * Get chat messages between current user and a friend
 */
const getChatMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { friendId } = req.params;

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'Friend ID is required'
            });
        }

        // Find the conversation between these two users
        const conversation = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [userId, friendId], $size: 2 }
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'No conversation found between these users',
                messages: [] // Return empty array if no conversation exists
            });
        }

        // Get all messages for this conversation
        const messages = await Message.find({
            conversationId: conversation._id
        })
        .populate('sender', 'userName email')
        .sort({ createdAt: 1 }); // Sort by oldest first for chat display

        res.status(200).json({
            success: true,
            conversationId: conversation._id,
            messages,
            totalMessages: messages.length
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat messages',
            error: error.message
        });
    }
};

/**
 * Get total unread message count for the current user
 * Or get unread count for a specific conversation if conversationId is provided
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        if (conversationId) {
            // Get unread count for specific conversation
            const unreadCount = await Message.countDocuments({
                conversationId: conversationId,
                sender: { $ne: userId },
                status: { $in: ['sent', 'delivered'] }
            });

            res.status(200).json({
                success: true,
                unreadCount
            });
        } else {
            // Get total unread count across all conversations
            const conversations = await Conversation.find({
                participants: userId
            });

            const conversationIds = conversations.map(conv => conv._id);

            const unreadCount = await Message.countDocuments({
                conversationId: { $in: conversationIds },
                sender: { $ne: userId },
                status: { $in: ['sent', 'delivered'] }
            });

            res.status(200).json({
                success: true,
                unreadCount
            });
        }

    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
};

module.exports = {
    getUserConversations,
    getOrCreateConversation,
    getChatMessages,
    getUnreadCount
};
