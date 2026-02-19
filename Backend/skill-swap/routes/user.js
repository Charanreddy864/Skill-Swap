const express = require('express');
const router = express.Router();

const checkEmailExists = require('../middleware/existingUser');
const authMiddleware = require('../middleware/authMiddleware');

const registerUser = require('../controllers/registerUser');
const accountSetup = require('../controllers/account-setup');
const deleteAllUsers = require('../controllers/deleteAllUsers');
const loginUser = require('../controllers/loginUser');
const peerSuggestions = require('../controllers/peer-suggestions');
const getPendingFriendRequests = require('../controllers/friendRequests');
const friends = require('../controllers/friends');
const { getProfile, updateProfile, getUserProfile, addSkills, removeSkills } = require('../controllers/profile');
const logout = require('../controllers/logout');
const searchUsers = require('../controllers/searchUsers');
const deleteAccount = require('../controllers/deleteAccount');

// Public routes
router.post('/register', checkEmailExists, registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/account-setup', authMiddleware, accountSetup);
router.get('/peer-suggestions', authMiddleware, peerSuggestions);
router.get('/search', authMiddleware, searchUsers);
router.get('/friend-requests', authMiddleware, getPendingFriendRequests);
router.get('/friends', authMiddleware, friends);

// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile/:userId', authMiddleware, getUserProfile);
router.post('/skills/add', authMiddleware, addSkills);
router.delete('/skills/remove', authMiddleware, removeSkills);

// Logout route
router.post('/logout', authMiddleware, logout);

// Delete account route
router.delete('/delete-account', authMiddleware, deleteAccount);

// Utility
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route is working' });
});

router.delete('/', deleteAllUsers);

module.exports = router;
