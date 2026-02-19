const mongoose = require('mongoose');
const { UserSkill } = require('./userSkill')
const { SkillPool } = require('./skillPool');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
    },
    contact: {
        type: String,
        default: ''
    },
    skillsHave: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserSkill',
    }],
    skillsWant: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillPool',
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    accountSetupComplete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const User = mongoose.model('User', userSchema);

module.exports = User;