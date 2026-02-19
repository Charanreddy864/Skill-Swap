const User = require('../models/user');
const UserSkill = require('../models/userSkill');
const SkillPool = require('../models/skillPool');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const FriendRequest = require('../models/friendRequest');

const deleteAllUsers = async (req, res) => {
  try {
    // Delete all users
    await User.deleteMany({});

    // Delete all user skills
    await UserSkill.deleteMany({});

    // Delete all conversations
    await Conversation.deleteMany({});

    // Delete all messages
    await Message.deleteMany({});

    // Delete all friend requests
    await FriendRequest.deleteMany({});

    // Clear usersHave and usersNeed arrays in SkillPool (keep skill pool data)
    await SkillPool.updateMany({}, { $set: { usersHave: [], usersNeed: [] } });

    res.status(200).json({
      message: 'All users, conversations, messages, and related data deleted successfully. Skill pool preserved.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error deleting data',
      error: err.message
    });
  }
};

module.exports = deleteAllUsers;
