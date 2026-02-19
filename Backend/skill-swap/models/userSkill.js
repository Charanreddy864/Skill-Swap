const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skill:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillPool',
        required: true
    },
    skillLevel: {
        type: Number,
        min: 1,
        max: 10
    },
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reviewText: {
            type: String,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    }],

})

const UserSKill = mongoose.model('UserSkill', userSkillSchema);

module.exports = UserSKill;