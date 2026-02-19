const express= require('express')
const router= express.Router()
const SkillPool = require('../models/skillPool')

router.get('/',async (req, res) => {
    try {
        const skills = await SkillPool.find().sort({ skillName: 1 }); // alphabetically sorted
    res.status(200).json(skills); 
    }
    catch (error){
        console.error('Error fetching skills:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

module.exports = router