const User = require('../models/User');

// GET /api/admin/users
// Returns all users without pagination
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ users: users.map((u) => u.toJSON()) });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
