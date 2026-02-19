const { verifyToken } = require('../scripts/auth');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ type: "no_token", message: "No authentication token" });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ type: "user_not_found", message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({
      type: err.type || "invalid",
      message: err.message || "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
