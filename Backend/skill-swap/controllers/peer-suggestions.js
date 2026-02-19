const User = require('../models/user');
const SkillPool = require('../models/skillPool');

const peerSuggestions = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get current user skills and friends - use lean() for better performance
    const currentUser = await User.findById(userId)
      .select('skillsHave skillsWant friends')
      .lean();
    
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const { skillsHave, skillsWant, friends } = currentUser;
    
    // Convert friends array to Set of strings for O(1) lookup
    const friendIds = new Set(friends.map(id => id.toString()));

    // All skill IDs to fetch from SkillPool
    const allSkillIds = [...new Set([...skillsHave.map(String), ...skillsWant.map(String)])];
    
    // Batch fetch all relevant skills at once
    const skillDocs = await SkillPool.find({ _id: { $in: allSkillIds } }).lean();

    // Map skillId -> skillDoc for O(1) access
    const skillById = new Map(skillDocs.map(skill => [skill._id.toString(), skill]));

    const suggestionScores = new Map();

    // 1. Users who have skills I want => +1
    for (const skillId of skillsWant) {
      const skill = skillById.get(skillId.toString());
      if (!skill) continue;

      for (const peerId of skill.usersHave) {
        const peerStr = peerId.toString();
        if (peerStr !== userId) {
          suggestionScores.set(peerStr, (suggestionScores.get(peerStr) || 0) + 1);
        }
      }
    }

    // 2. Users who want skills I have => +1
    for (const skillId of skillsHave) {
      const skill = skillById.get(skillId.toString());
      if (!skill) continue;

      for (const peerId of skill.usersNeed) {
        const peerStr = peerId.toString();
        if (peerStr !== userId) {
          suggestionScores.set(peerStr, (suggestionScores.get(peerStr) || 0) + 1);
        }
      }
    }

    // 3. Boost scores for two-way matches (mutual skills)
    // For each skill I want, check users who have it,
    // if they also want any skill I have, add +1
    for (const skillId of skillsWant) {
      const skill = skillById.get(skillId.toString());
      if (!skill) continue;

      for (const peerId of skill.usersHave) {
        const peerStr = peerId.toString();
        if (peerStr === userId) continue;

        // Check if this peer wants any skill I have
        for (const mySkillId of skillsHave) {
          const mySkill = skillById.get(mySkillId.toString());
          if (mySkill && mySkill.usersNeed.some(id => id.toString() === peerStr)) {
            suggestionScores.set(peerStr, (suggestionScores.get(peerStr) || 0) + 1);
            break; // no need to double count this peer for this iteration
          }
        }
      }
    }

    // Get all other users - optimized query with lean() for performance
    const allOtherUsers = await User.find({ 
      _id: { $ne: userId, $nin: friends } // Exclude current user and friends
    })
      .select('userName skillsHave skillsWant gender age')
      .populate({
        path: 'skillsHave',
        populate: {
          path: 'skill',
          select: 'skillName'
        }
      })
      .populate('skillsWant', 'skillName')
      .lean() // Convert to plain JavaScript objects for better performance
      .limit(100); // Limit initial fetch to reduce memory usage

    // Combine all users with their score, default 0 if missing
    // Also filter out any friends that might have slipped through
    const allUsersWithScores = allOtherUsers
      .filter(user => !friendIds.has(user._id.toString()))
      .map(user => {
        const score = suggestionScores.get(user._id.toString()) || 0;
        return { user, score };
      });

    // Sort descending by score
    allUsersWithScores.sort((a, b) => b.score - a.score);

    // Return top 10
    const topSuggestions = allUsersWithScores.slice(0, 10);

    res.status(200).json({ peerSuggestions: topSuggestions });
  } catch (error) {
    console.error('Error in peerSuggestions:', error);
    res.status(500).json({ error: 'Server error while finding suggestions' });
  }
};

module.exports = peerSuggestions;
