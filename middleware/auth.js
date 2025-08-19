const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to require authentication via JWT
// - Reads Authorization: Bearer <token>
// - Verifies token with JWT_SECRET
// - Loads user and attaches to req.user
// - 401 if missing/invalid, 403 if user not found
async function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || req.headers['Authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = header.substring('Bearer '.length).trim();
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = payload.sub;
    const user = await User.findById(userId);
    if (!user) return res.status(403).json({ message: 'User not found' });

    req.user = user; // Mongoose document
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { requireAuth };
