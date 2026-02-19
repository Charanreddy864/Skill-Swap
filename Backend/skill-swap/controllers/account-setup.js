const User = require('../models/user');
const UserSkill = require('../models/userSkill');
const SkillPool = require('../models/skillPool');

const accountSetup = async (req, res) => {
  const { gender, age, contact, skillsHave, skillsWant } = req.body;

  try {
    const user = req.user; // set by auth middleware

    // Validate inputs
    if (!gender || !age || !Array.isArray(skillsHave) || skillsHave.length === 0) {
      return res.status(400).json({ message: 'gender, age, and skillsHave are required' });
    }
    if (!Array.isArray(skillsWant)) {
      return res.status(400).json({ message: 'skillsWant must be an array' });
    }

    // Remove any existing skills for this user
    await UserSkill.deleteMany({ user: user._id });

    // Insert new skills with their levels
    const userSkillDocs = await UserSkill.insertMany(
      skillsHave.map(s => ({
        user: user._id,
        skill: s.skill,
        skillLevel: s.skillLevel || 1 // default to 1 if missing
      }))
    );

    // Update user profile
    user.age = age;
    user.gender = gender;
    user.contact = contact || '';
    user.skillsHave = userSkillDocs.map(doc => doc._id);
    user.skillsWant = skillsWant;
    user.accountSetupComplete = true;
    await user.save();

    // Clear old SkillPool associations
    await SkillPool.updateMany(
      { $or: [{ usersHave: user._id }, { usersNeed: user._id }] },
      { $pull: { usersHave: user._id, usersNeed: user._id } }
    );

    // Add new usersHave associations
    if (skillsHave.length > 0) {
      await SkillPool.updateMany(
        { _id: { $in: skillsHave.map(s => s.skill) } },
        { $addToSet: { usersHave: user._id } }
      );
    }

    // Add new usersNeed associations
    if (skillsWant.length > 0) {
      await SkillPool.updateMany(
        { _id: { $in: skillsWant } },
        { $addToSet: { usersNeed: user._id } }
      );
    }

    // Populate skills before returning
    const populatedUser = await User.findById(user._id)
      .populate({
        path: 'skillsHave',
        populate: { path: 'skill', model: 'SkillPool' }
      })
      .populate('skillsWant');

    res.status(200).json({
      message: 'Account setup completed successfully',
      user: populatedUser
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating account', error: err.message });
  }
};

module.exports = accountSetup;
