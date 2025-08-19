const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');

// GET /api/categories
router.get('/', ctrl.listCategories);

// GET /api/categories/:id
router.get('/:id', ctrl.getCategoryById);

module.exports = router;
