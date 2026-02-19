const User = require('../models/user');
const UserSkill = require('../models/userSkill');
const SkillPool = require('../models/skillPool');

/**
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant', 'skillName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

/**
 * Update current user's profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, location, profilePicture, age, contact } = req.body;

    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
    if (age !== undefined) updateFields.age = age;
    if (contact !== undefined) updateFields.contact = contact;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant', 'skillName');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

/**
 * Get another user's public profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -email')
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant', 'skillName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

/**
 * Add new skills to user profile
 */
const addSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillsHave, skillsWant } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add skills user has
    if (skillsHave && Array.isArray(skillsHave) && skillsHave.length > 0) {
      const userSkillDocs = await UserSkill.insertMany(
        skillsHave.map(s => ({
          user: userId,
          skill: s.skill,
          skillLevel: s.skillLevel || 5
        }))
      );

      user.skillsHave.push(...userSkillDocs.map(doc => doc._id));

      // Update SkillPool associations
      await SkillPool.updateMany(
        { _id: { $in: skillsHave.map(s => s.skill) } },
        { $addToSet: { usersHave: userId } }
      );
    }

    // Add skills user wants to learn
    if (skillsWant && Array.isArray(skillsWant) && skillsWant.length > 0) {
      user.skillsWant.push(...skillsWant);

      // Update SkillPool associations
      await SkillPool.updateMany(
        { _id: { $in: skillsWant } },
        { $addToSet: { usersNeed: userId } }
      );
    }

    await user.save();

    // Return populated user
    const populatedUser = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant', 'skillName');

    res.status(200).json({
      message: 'Skills added successfully',
      user: populatedUser
    });
  } catch (err) {
    console.error('Error adding skills:', err);
    res.status(500).json({ message: 'Error adding skills', error: err.message });
  }
};

/**
 * Remove skills from user profile
 */
const removeSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillHaveId, skillWantId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove skill user has
    if (skillHaveId) {
      const userSkill = await UserSkill.findById(skillHaveId);
      if (userSkill && userSkill.user.toString() === userId.toString()) {
        const skillPoolId = userSkill.skill;
        
        // Remove from user's skillsHave array
        user.skillsHave = user.skillsHave.filter(id => id.toString() !== skillHaveId);
        
        // Delete the UserSkill document
        await UserSkill.findByIdAndDelete(skillHaveId);
        
        // Update SkillPool association
        await SkillPool.updateOne(
          { _id: skillPoolId },
          { $pull: { usersHave: userId } }
        );
      }
    }

    // Remove skill user wants to learn
    if (skillWantId) {
      user.skillsWant = user.skillsWant.filter(id => id.toString() !== skillWantId);
      
      // Update SkillPool association
      await SkillPool.updateOne(
        { _id: skillWantId },
        { $pull: { usersNeed: userId } }
      );
    }

    await user.save();

    // Return populated user
    const populatedUser = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant', 'skillName');

    res.status(200).json({
      message: 'Skills removed successfully',
      user: populatedUser
    });
  } catch (err) {
    console.error('Error removing skills:', err);
    res.status(500).json({ message: 'Error removing skills', error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserProfile,
  addSkills,
  removeSkills
};
