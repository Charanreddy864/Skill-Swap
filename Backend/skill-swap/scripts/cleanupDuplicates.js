const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/skill-swap');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const cleanupDuplicates = async () => {
    try {
        console.log('🔍 Finding duplicate conversations...');

        // Get all conversations
        const conversations = await Conversation.find({ isGroup: false });
        
        // Group conversations by participants
        const conversationMap = new Map();
        const duplicates = [];

        for (const conv of conversations) {
            // Sort participants to create a unique key
            const key = conv.participants
                .map(p => p.toString())
                .sort()
                .join('_');

            if (conversationMap.has(key)) {
                // This is a duplicate
                duplicates.push(conv._id);
                console.log(`Found duplicate conversation: ${conv._id}`);
            } else {
                conversationMap.set(key, conv._id);
            }
        }

        if (duplicates.length > 0) {
            console.log(`\n🗑️  Deleting ${duplicates.length} duplicate conversations...`);
            
            // Delete messages associated with duplicate conversations
            const deletedMessages = await Message.deleteMany({
                conversationId: { $in: duplicates }
            });
            console.log(`   Deleted ${deletedMessages.deletedCount} messages from duplicate conversations`);

            // Delete duplicate conversations
            const deletedConversations = await Conversation.deleteMany({
                _id: { $in: duplicates }
            });
            console.log(`   Deleted ${deletedConversations.deletedCount} duplicate conversations`);

            console.log('\n✅ Cleanup complete!');
        } else {
            console.log('\n✅ No duplicate conversations found!');
        }

        // Show remaining conversations
        const remaining = await Conversation.countDocuments();
        console.log(`\n📊 Total conversations remaining: ${remaining}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Run the cleanup
connectDB().then(() => {
    cleanupDuplicates();
});
