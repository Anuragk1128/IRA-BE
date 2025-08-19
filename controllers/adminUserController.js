const User = require('../models/User');

// GET /api/admin/users
// Query params: page (default 1), limit (default 20), search (email/name contains)
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      users: items.map((u) => u.toJSON()),
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
