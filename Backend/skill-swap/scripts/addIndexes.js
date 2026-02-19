const mongoose = require('mongoose');
const User = require('../models/user');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const SkillPool = require('../models/skillPool');
const FriendRequest = require('../models/friendRequest');

async function addIndexes() {
  try {
    console.log('Adding database indexes for performance optimization...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ userName: 1 }, { unique: true });
    await User.collection.createIndex({ friends: 1 });
    await User.collection.createIndex({ skillsHave: 1 });
    await User.collection.createIndex({ skillsWant: 1 });
    await User.collection.createIndex({ userName: 'text', fullName: 'text' });
    console.log('✓ User indexes created');

    // Message indexes (already exist in model but ensuring they're created)
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ status: 1 });
    await Message.collection.createIndex({ conversationId: 1, status: 1 });
    console.log('✓ Message indexes created');

    // Conversation indexes (already exist in model)
    await Conversation.collection.createIndex({ participants: 1 });
    await Conversation.collection.createIndex({ updatedAt: -1 });
    await Conversation.collection.createIndex({ lastMessage: 1 });
    console.log('✓ Conversation indexes created');

    // SkillPool indexes
    await SkillPool.collection.createIndex({ skillName: 1 }, { unique: true });
    await SkillPool.collection.createIndex({ usersHave: 1 });
    await SkillPool.collection.createIndex({ usersNeed: 1 });
    console.log('✓ SkillPool indexes created');

    // FriendRequest indexes
    await FriendRequest.collection.createIndex({ from: 1 });
    await FriendRequest.collection.createIndex({ to: 1 });
    await FriendRequest.collection.createIndex({ status: 1 });
    await FriendRequest.collection.createIndex({ from: 1, to: 1 }, { unique: true });
    console.log('✓ FriendRequest indexes created');

    console.log('\n✅ All indexes created successfully!');
    console.log('\nPerformance optimizations applied:');
    console.log('- Compound indexes for faster queries');
    console.log('- Text search indexes for user search');
    console.log('- Unique constraints for data integrity');
    console.log('- Indexes on foreign keys for joins');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

module.exports = addIndexes;

// Run directly if this file is executed
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return addIndexes();
  })
  .then(() => {
    console.log('\nClosing database connection...');
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
