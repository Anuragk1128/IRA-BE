const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/adminAuthController');
const { requireAdminAuth } = require('../middleware/adminAuth');

// POST /api/admin/auth/register
router.post('/register', register);

// POST /api/admin/auth/login
router.post('/login', login);

// GET /api/admin/auth/me (protected)
router.get('/me', requireAdminAuth, (req, res) => {
  return res.json({ admin: req.admin.toJSON() });
});

module.exports = router;
