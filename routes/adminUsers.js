const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/adminAuth');
const controller = require('../controllers/adminUserController');

// GET /api/admin/users
router.get('/', requireAdminAuth, controller.listUsers);

module.exports = router;
