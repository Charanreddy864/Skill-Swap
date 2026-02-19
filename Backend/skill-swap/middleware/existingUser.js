const User = require('../models/user')

const CheckEmailExists = async(req, res, next) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    next();
}

module.exports = CheckEmailExists;