const User = require("../models/user");
const Conversation = require("../models/conversation");

const getFriendsList = async (req, res) => {
  try {
    const userId = req.user; // set by authMiddleware

    // Fetch user + populate friends info
    const user = await User.findById(userId)
      .populate("friends", "userName email skillsHave skillsWant");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all conversations for this user
    const conversations = await Conversation.find({
      participants: userId
    }).select('participants updatedAt').lean();

    // Create a map of friend ID to conversation updatedAt time
    const friendConversationMap = new Map();
    conversations.forEach(conv => {
      const friendId = conv.participants.find(
        p => p.toString() !== userId.toString()
      );
      if (friendId) {
        const existingTime = friendConversationMap.get(friendId.toString());
        // Keep the most recent conversation time
        if (!existingTime || new Date(conv.updatedAt) > new Date(existingTime)) {
          friendConversationMap.set(friendId.toString(), conv.updatedAt);
        }
      }
    });

    // Sort friends by latest conversation
    const sortedFriends = user.friends.sort((a, b) => {
      const aTime = friendConversationMap.get(a._id.toString());
      const bTime = friendConversationMap.get(b._id.toString());
      
      // If neither has conversation, maintain original order
      if (!aTime && !bTime) return 0;
      // If only one has conversation, prioritize it
      if (!aTime) return 1;
      if (!bTime) return -1;
      // Both have conversations, sort by most recent
      return new Date(bTime) - new Date(aTime);
    });

    res.json(sortedFriends); // return sorted friends list
  } catch (err) {
    console.error("Error fetching friends list:", err);
    res.status(500).json({ message: "Error fetching friends list" });
  }
};

module.exports = getFriendsList;
