const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminCategoryController');

router.use(requireAdminAuth);

// GET /api/admin/categories
router.get('/', ctrl.listCategoriesAdmin);

// POST /api/admin/categories
router.post('/', ctrl.createCategory);

// PATCH /api/admin/categories/:id
router.patch('/:id', ctrl.updateCategory);

// DELETE /api/admin/categories/:id
router.delete('/:id', ctrl.deleteCategory);

module.exports = router;
