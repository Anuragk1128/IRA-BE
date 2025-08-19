const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me (protected)
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user.toJSON() });
});

module.exports = router;
