const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware to require admin authentication via JWT
async function requireAdminAuth(req, res, next) {
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

    const adminId = payload.sub;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(403).json({ message: 'Admin not found' });

    req.admin = admin;
    req.role = payload.role;
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Optional role guard
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.role || req.admin?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAdminAuth, requireRole };
