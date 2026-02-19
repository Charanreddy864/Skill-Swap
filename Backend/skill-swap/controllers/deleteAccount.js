const User = require('../models/user');
const SkillPool = require('../models/skillPool');
const FriendRequest = require('../models/friendRequest');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Remove user from all SkillPool arrays
    await SkillPool.updateMany(
      { $or: [{ usersHave: userId }, { usersNeed: userId }] },
      { $pull: { usersHave: userId, usersNeed: userId } }
    );

    // 2. Delete all friend requests involving this user
    await FriendRequest.deleteMany({
      $or: [{ from: userId }, { to: userId }]
    });

    // 3. Remove user from friends lists of other users
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // 4. Delete all messages sent by this user
    await Message.deleteMany({ sender: userId });

    // 5. Delete or update conversations
    // Option A: Delete conversations where user is a participant
    await Conversation.deleteMany({ participants: userId });

    // Alternative Option B (if you want to keep conversations but remove user):
    // await Conversation.updateMany(
    //   { participants: userId },
    //   { $pull: { participants: userId } }
    // );

    // 6. Finally, delete the user account
    await User.findByIdAndDelete(userId);

    // Clear the authentication cookie
    res.clearCookie('token');

    res.status(200).json({ 
      message: 'Account deleted successfully',
      success: true 
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      error: 'Failed to delete account',
      success: false 
    });
  }
};

module.exports = deleteAccount;
