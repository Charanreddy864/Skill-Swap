const mongoose = require('mongoose');
const SkillPool = require('../models/skillPool');

const skills = [
  'JavaScript', 'Python', 'Java', 'C++', 'C#',
  'React', 'Node.js', 'Express', 'MongoDB', 'SQL',
  'Data Science', 'Machine Learning', 'Public Speaking', 'Graphic Design',
  'UI/UX Design', 'Photography', 'Video Editing', 'Cooking',
  'Fitness Coaching', 'Yoga', 'Swimming', 'Writing', 'Blogging',
  'Digital Marketing', 'SEO', 'Content Creation', 'Singing',
  'Guitar', 'Piano', 'Drums', 'Mobile App Development', 
  'Kotlin', 'Swift', 'Django', 'Flask', 'Linux',
  'DevOps', 'AWS', 'Azure', 'Google Cloud', 'Docker',
  'Kubernetes', 'Testing', 'Agile', 'Scrum', 'Figma',
  'Illustrator', 'Photoshop', 'After Effects', '3D Modeling',
  'Blender', 'Unity', 'Game Development', 'Project Management',
];

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/skill-swap');

    for (const skillName of skills) {
      await SkillPool.updateOne(
        { skillName },
        {
          $setOnInsert: {
            skillName,
            usersHave: [],
            usersNeed: [],
          },
        },
        { upsert: true }
      );
    }

    console.log('Skills seeded successfully');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding skills:', err);
  }
}

seed();
