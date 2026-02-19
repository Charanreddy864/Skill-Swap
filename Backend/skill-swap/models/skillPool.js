const mongoose = require('mongoose');

const skillPoolSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  usersHave: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  usersNeed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const SkillPool = mongoose.model('SkillPool', skillPoolSchema);

module.exports = SkillPool;
