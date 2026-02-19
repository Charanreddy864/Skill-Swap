const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../scripts/auth');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found, please sign up' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = generateToken(existingUser._id);

    res.cookie('token', token, {
      httpOnly: false,
      sameSite: 'Strict',
      secure: false, // change to true in production
      maxAge: 3600000
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: existingUser._id,
        userName: existingUser.userName,
        email: existingUser.email,
        accountSetupComplete: existingUser.accountSetupComplete || false
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

module.exports = loginUser;
