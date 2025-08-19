const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function signToken(adminId, role) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ sub: adminId, role }, secret, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { email, password, role = 'admin', name, status = 'active' } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'email, password, name are required' });
    }

    const exists = await Admin.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const admin = await Admin.create({ email, password, role, name, status });
    const token = signToken(admin.id, admin.role);
    return res.status(201).json({ admin: admin.toJSON(), token });
  } catch (err) {
    console.error('Admin register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = signToken(admin.id, admin.role);
    return res.status(200).json({ admin: admin.toJSON(), token });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
