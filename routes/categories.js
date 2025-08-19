const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');

// GET /api/categories
router.get('/', ctrl.listCategories);

// GET /api/categories/:slug
router.get('/:slug', ctrl.getCategoryBySlug);

module.exports = router;
