const jwt = require('jsonwebtoken');
const secretKey = "Weapon@011421";

function generateToken(userId) {
  return jwt.sign({ id: userId }, secretKey, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const error = new Error("Token expired");
      error.type = "expired";
      throw error;
    } else {
      const error = new Error("Invalid token");
      error.type = "invalid";
      throw error;
    }
  }
}

module.exports = { generateToken, verifyToken };
