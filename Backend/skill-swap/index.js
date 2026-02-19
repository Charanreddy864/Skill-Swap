const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./connections');
const http = require('http');
const { Server } = require('socket.io');

const userRouter = require('./routes/user');
const skillRouter = require('./routes/skills');
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');
const FriendRequest = require('./models/friendRequest');
const User = require('./models/user');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
connectDB('mongodb://127.0.0.1:27017/skill-swap');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', userRouter);
app.use('/skills', skillRouter);
app.use('/auth', authRouter);
app.use('/chat', chatRouter);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Skill Swap API is running 🚀' });
});

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {

    // Register socket user
    socket.on('registerUser', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });

    /**
     * SEND FRIEND REQUEST
     */
    socket.on('sendFriendRequest', async ({ fromUserId, toUserId }) => {
        try {
            // Check if already pending
            const existingRequest = await FriendRequest.findOne({
                $or: [
                    { from: fromUserId, to: toUserId, status: "pending" },
                    { from: toUserId, to: fromUserId, status: "pending" }
                ]
            });

            if (existingRequest) {
                socket.emit("friendRequestError", { message: "Request already pending" });
                return;
            }

            // Save new request
            const request = new FriendRequest({
                from: fromUserId,
                to: toUserId,
                status: "pending"
            });

            await request.save();

            const populatedRequest = await request.populate("from", "userName email skillsHave skillsWant");

            // Notify receiver if online
            const toSocketId = onlineUsers.get(toUserId);
            if (toSocketId) {
                io.to(toSocketId).emit("newFriendRequest", populatedRequest);
            }

            // Acknowledge sender
            socket.emit("friendRequestSent", populatedRequest);

        } catch (err) {
            console.error("Error sending friend request:", err);
            socket.emit("friendRequestError", { message: "Server error while sending request" });
        }
    });

    /**
     * ACCEPT / REJECT FRIEND REQUEST
     */
    socket.on('updateFriendRequest', async ({ requestId, status }) => {
        try {
            // Find the request first to check current status
            const existingRequest = await FriendRequest.findById(requestId);
            
            if (!existingRequest) {
                socket.emit("friendRequestError", { message: "Request not found" });
                return;
            }

            // If already processed, don't process again
            if (existingRequest.status !== 'pending') {
                socket.emit("friendRequestError", { message: "Request already processed" });
                return;
            }

            // Update the status
            const updated = await FriendRequest.findByIdAndUpdate(
                requestId,
                { status },
                { new: true }
            );

            if (!updated) {
                socket.emit("friendRequestError", { message: "Request not found" });
                return;
            }

            // If accepted → add both as friends
            if (status === "accepted") {

                await User.findByIdAndUpdate(updated.from, {
                    $addToSet: { friends: updated.to }
                });
                await User.findByIdAndUpdate(updated.to, {
                    $addToSet: { friends: updated.from }
                });

                // Get user details for personalized greetings
                const fromUser = await User.findById(updated.from).select('userName');
                const toUser = await User.findById(updated.to).select('userName');

                // Create conversation between the new friends
                let conversation = await Conversation.findOne({
                    isGroup: false,
                    participants: { $all: [updated.from, updated.to], $size: 2 }
                });

                // If no conversation exists, create one
                if (!conversation) {
                    try {
                        conversation = new Conversation({
                            participants: [updated.from, updated.to],
                            isGroup: false
                        });
                        await conversation.save();

                        // Create greeting messages from both users
                        const greetingFromSender = new Message({
                            conversationId: conversation._id,
                            sender: updated.from,
                            content: `Hi ${toUser.userName}! I'm excited to connect with you on Skill Swap! 👋`,
                            status: 'sent'
                        });

                        const greetingFromReceiver = new Message({
                            conversationId: conversation._id,
                            sender: updated.to,
                            content: `Hello ${fromUser.userName}! Great to connect! Looking forward to learning together! 🎉`,
                            status: 'sent'
                        });

                        await greetingFromSender.save();
                        await greetingFromReceiver.save();

                        // Update conversation's lastMessage
                        conversation.lastMessage = greetingFromReceiver._id;
                        await conversation.save();
                    } catch (error) {
                        // If duplicate error (code 11000), fetch the existing conversation
                        if (error.code === 11000) {
                            console.log('Conversation already exists, fetching...');
                            conversation = await Conversation.findOne({
                                isGroup: false,
                                participants: { $all: [updated.from, updated.to], $size: 2 }
                            });
                        } else {
                            throw error;
                        }
                    }
                }

                // Populate before emitting
                const populatedUpdate = await FriendRequest.findById(updated._id)
                    .populate("from", "userName email skillsHave skillsWant")
                    .populate("to", "userName email skillsHave skillsWant");

                const fromSocket = onlineUsers.get(updated.from.toString());
                const toSocket = onlineUsers.get(updated.to.toString());

                if (fromSocket) io.to(fromSocket).emit("friendRequestAccepted", populatedUpdate);
                if (toSocket) io.to(toSocket).emit("friendRequestAccepted", populatedUpdate);
            }

            socket.emit("friendRequestUpdated", updated);

        } catch (err) {
            console.error("Error updating friend request:", err);
            socket.emit("friendRequestError", { message: "Error updating request" });
        }
    });

    /**
     * SEND MESSAGE
     */
    socket.on('sendMessage', async ({ fromUserId, toUserId, message }) => {
        console.log('📨 Received sendMessage event:');
        console.log('  fromUserId:', fromUserId, '(type:', typeof fromUserId, ')');
        console.log('  toUserId:', toUserId, '(type:', typeof toUserId, ')');
        console.log('  message:', message);
        
        try {
            // Verify they are friends
            const sender = await User.findById(fromUserId);
            
            if (!sender) {
                socket.emit('chatError', { message: 'Sender not found. Please refresh and try again.' });
                return;
            }
            
            const isFriend = sender.friends.some(friendId => friendId.toString() === toUserId.toString());
            
            if (!isFriend) {
                socket.emit('chatError', { message: 'You can only chat with friends' });
                return;
            }

            // Find or get conversation
            let conversation = await Conversation.findOne({
                isGroup: false,
                participants: { $all: [fromUserId, toUserId], $size: 2 }
            });

            if (!conversation) {
                socket.emit('chatError', { message: 'No conversation found' });
                return;
            }

            // Save message to database
            const newMessage = new Message({
                conversationId: conversation._id,
                sender: fromUserId,
                content: message,
                status: 'sent'
            });

            await newMessage.save();

            // Populate sender details
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('sender', 'userName email');

            // Update conversation's lastMessage and timestamp
            conversation.lastMessage = newMessage._id;
            await conversation.save();

            // Send to recipient if online (emit as 'receiveMessage')
            const toSocketId = onlineUsers.get(toUserId);
            
            if (toSocketId) {
                // Mark as delivered if recipient is online
                populatedMessage.status = 'delivered';
                await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
                
                io.to(toSocketId).emit('receiveMessage', populatedMessage);
            }

            // Acknowledge sender
            socket.emit('messageSent', populatedMessage);
            console.log('📤 Message sent:', newMessage._id);

        } catch (err) {
            console.error('❌ Error sending message:', err);
            socket.emit('chatError', { message: 'Error sending message', error: err.message });
        }
    });

    /**
     * MESSAGE DELIVERED
     */
    socket.on('messageDelivered', async ({ messageId }) => {
        try {
            // Update message status to delivered
            const message = await Message.findByIdAndUpdate(
                messageId,
                { status: 'delivered' },
                { new: true }
            ).populate('sender', 'userName email');

            if (message) {
                console.log('📬 Status: delivered -', messageId);
                
                // Notify the sender that their message was delivered
                const senderSocketId = onlineUsers.get(message.sender._id.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messageStatusUpdate', {
                        messageId: message._id,
                        status: 'delivered'
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error updating message delivery status:', err);
        }
    });

    /**
     * MARK SINGLE MESSAGE AS READ
     */
    socket.on('markMessageAsRead', async ({ messageId, userId }) => {
        try {
            // Update message status to read
            const message = await Message.findByIdAndUpdate(
                messageId,
                { status: 'read' },
                { new: true }
            ).populate('sender', 'userName email');

            if (message) {
                console.log('📖 Status: read -', messageId);
                
                // Notify the sender that their message was read
                const senderSocketId = onlineUsers.get(message.sender._id.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messageStatusUpdate', {
                        messageId: message._id,
                        status: 'read'
                    });
                }

                // Emit messagesMarkedAsRead event to the user who marked the message as read
                if (userId) {
                    const userSocketId = onlineUsers.get(userId);
                    if (userSocketId) {
                        io.to(userSocketId).emit('messagesMarkedAsRead', {
                            friendId: message.sender._id.toString(),
                            count: 1
                        });
                    }
                }
            }
        } catch (err) {
            console.error('❌ Error updating message read status:', err);
        }
    });

    /**
     * MARK MESSAGES AS READ (bulk - for when opening a conversation)
     */
    socket.on('markMessagesAsRead', async ({ conversationId, userId }) => {
        try {
            // Find the conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return;
            }

            // Find all unread messages in this conversation that were NOT sent by current user
            const unreadMessages = await Message.find({
                conversationId: conversationId,
                sender: { $ne: userId },
                status: { $in: ['sent', 'delivered'] }
            }).populate('sender', 'userName email');

            if (unreadMessages.length > 0) {
                // Update all to read status
                await Message.updateMany(
                    {
                        conversationId: conversationId,
                        sender: { $ne: userId },
                        status: { $in: ['sent', 'delivered'] }
                    },
                    { status: 'read' }
                );

                console.log(`📖 Bulk read: ${unreadMessages.length} messages`);

                // Notify sender(s) that their messages were read
                const uniqueSenders = [...new Set(unreadMessages.map(msg => msg.sender._id.toString()))];
                uniqueSenders.forEach(senderId => {
                    const senderSocketId = onlineUsers.get(senderId);
                    if (senderSocketId) {
                        const senderMessages = unreadMessages
                            .filter(msg => msg.sender._id.toString() === senderId)
                            .map(msg => msg._id);
                        
                        io.to(senderSocketId).emit('messagesRead', {
                            messageIds: senderMessages,
                            readBy: userId
                        });
                    }
                });

                // Emit messagesMarkedAsRead event to the user who marked the messages as read
                // This will trigger unread count updates in the UI
                const userSocketId = onlineUsers.get(userId);
                if (userSocketId) {
                    // Get the other participant (sender) in this conversation
                    const otherParticipant = conversation.participants.find(
                        p => p.toString() !== userId
                    );
                    
                    io.to(userSocketId).emit('messagesMarkedAsRead', {
                        conversationId: conversationId,
                        friendId: otherParticipant?.toString(),
                        count: unreadMessages.length
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error marking messages as read:', err);
        }
    });

    /**
     * HANDLE DISCONNECT
     */
    socket.on('disconnect', () => {
        console.log("Client disconnected:", socket.id);

        for (let [userId, id] of onlineUsers.entries()) {
            if (id === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
