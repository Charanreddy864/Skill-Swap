const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../scripts/auth');

const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    // Check for existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      email,
      password: hashedPassword
    });
    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false,
      sameSite: 'Strict',
      secure: false, // change to true in production (HTTPS)
      maxAge: 3600000
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        userName,
        email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error registering user',
      error: err.message
    });
  }
};

module.exports = registerUser;
