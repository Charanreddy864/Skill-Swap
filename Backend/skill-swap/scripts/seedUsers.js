const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const SkillPool = require('../models/skillPool');
const UserSkill = require('../models/userSkill');

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery',
  'Sebastian', 'Ella', 'David', 'Scarlett', 'Joseph', 'Grace', 'Carter',
  'Chloe', 'Owen', 'Victoria', 'Wyatt', 'Riley', 'John', 'Aria', 'Jack',
  'Lily', 'Luke', 'Aubrey', 'Jayden', 'Zoey', 'Dylan'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts'
];

const locations = [
  'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'London, UK',
  'Paris, France', 'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada',
  'Berlin, Germany', 'Amsterdam, Netherlands', 'Singapore', 'Dubai, UAE',
  'Barcelona, Spain', 'Mumbai, India', 'Seoul, South Korea', 'Mexico City, Mexico',
  'São Paulo, Brazil', 'Bangkok, Thailand', 'Istanbul, Turkey', 'Rome, Italy'
];

const bios = [
  'Passionate about learning and sharing knowledge with others.',
  'Always eager to explore new skills and connect with like-minded people.',
  'Lifelong learner and tech enthusiast.',
  'Love teaching and helping others grow their skills.',
  'Seeking to expand my skillset and meet new friends.',
  'Creative professional looking to learn and collaborate.',
  'Dedicated to continuous improvement and skill development.',
  'Enjoy exchanging knowledge and building meaningful connections.',
  'Curious mind always ready to learn something new.',
  'Believer in the power of skill sharing and community.',
];

const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/skill-swap');
    console.log('Connected successfully!');

    // Get all skills from the database
    const allSkills = await SkillPool.find({});
    
    if (allSkills.length === 0) {
      console.error('No skills found in database. Please run seedSkills.js first!');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${allSkills.length} skills in database`);

    // Hash password once for all dummy users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const userName = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
      const email = `${userName}@example.com`;
      const age = Math.floor(Math.random() * 40) + 20; // Age between 20-59
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const bio = bios[Math.floor(Math.random() * bios.length)];

      // Randomly select 2-5 skills they have
      const numSkillsHave = Math.floor(Math.random() * 4) + 2;
      const selectedSkillsHave = [];
      const shuffledSkills = [...allSkills].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < numSkillsHave && j < shuffledSkills.length; j++) {
        const skill = shuffledSkills[j];
        const skillLevel = Math.floor(Math.random() * 10) + 1; // Level 1-10
        
        const userSkill = await UserSkill.create({
          user: null, // Will be updated after user creation
          skill: skill._id,
          skillLevel: skillLevel,
        });
        
        selectedSkillsHave.push(userSkill._id);
      }

      // Randomly select 1-3 skills they want to learn (different from skills they have)
      const numSkillsWant = Math.floor(Math.random() * 3) + 1;
      const availableSkillsWant = allSkills.filter(skill => 
        !selectedSkillsHave.some(userSkillId => skill._id.toString() === userSkillId.toString())
      );
      const selectedSkillsWant = availableSkillsWant
        .sort(() => 0.5 - Math.random())
        .slice(0, numSkillsWant)
        .map(skill => skill._id);

      const user = {
        userName,
        email,
        password: hashedPassword,
        fullName,
        bio,
        location,
        age,
        gender,
        skillsHave: selectedSkillsHave,
        skillsWant: selectedSkillsWant,
        friends: [],
      };

      users.push(user);
    }

    // Insert all users
    console.log('Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Update UserSkill references with actual user IDs
    console.log('Updating UserSkill references...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      await UserSkill.updateMany(
        { _id: { $in: user.skillsHave } },
        { user: user._id }
      );
    }

    // Update SkillPool with user references
    console.log('Updating SkillPool references...');
    for (const user of createdUsers) {
      // Add to usersHave arrays
      for (const userSkillId of user.skillsHave) {
        const userSkill = await UserSkill.findById(userSkillId);
        if (userSkill) {
          await SkillPool.updateOne(
            { _id: userSkill.skill },
            { $addToSet: { usersHave: user._id } }
          );
        }
      }

      // Add to usersNeed arrays
      for (const skillId of user.skillsWant) {
        await SkillPool.updateOne(
          { _id: skillId },
          { $addToSet: { usersNeed: user._id } }
        );
      }
    }

    console.log('✅ Successfully seeded 50 dummy users with skills!');
    console.log('Default password for all users: password123');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error seeding users:', err);
    await mongoose.disconnect();
  }
}

seedUsers();
