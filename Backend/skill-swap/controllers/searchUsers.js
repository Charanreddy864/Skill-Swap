const User = require('../models/user');

const searchUsers = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    const searchTerm = query.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Get current user's friends list - optimized with lean()
    const currentUser = await User.findById(userId).select('friends').lean();
    const friendIds = currentUser.friends.map(id => id.toString());

    // Optimized search query using text index and lean()
    const users = await User.find({
      _id: { $ne: userId, $nin: currentUser.friends },
      $or: [
        { userName: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('userName email fullName skillsHave skillsWant gender age profilePicture')
      .populate({
        path: 'skillsHave',
        populate: {
          path: 'skill',
          select: 'skillName'
        }
      })
      .populate('skillsWant', 'skillName')
      .lean() // Performance optimization
      .limit(50); // Limit results

    // Filter users based on skills match (if search term matches skill names)
    const filteredUsers = users.filter(user => {
      // Check if username or email matches
      if (user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }

      // Check if any of their skills match
      const hasMatchingSkillHave = user.skillsHave?.some(skillObj => 
        skillObj.skill?.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const hasMatchingSkillWant = user.skillsWant?.some(skillObj => 
        skillObj.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return hasMatchingSkillHave || hasMatchingSkillWant;
    });

    // Format response similar to peer suggestions
    const formattedUsers = filteredUsers.map(user => ({
      user: user,
      score: 0 // No scoring for search results
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

module.exports = searchUsers;
