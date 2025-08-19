const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminCategoryController');

router.use(requireAdminAuth);

// GET /api/admin/categories
router.get('/', ctrl.listCategoriesAdmin);

// GET /api/admin/categories/:id
router.get('/:id', ctrl.getCategoryById);

// POST /api/admin/categories
router.post('/', ctrl.createCategory);

// PATCH /api/admin/categories/:id
router.patch('/:id', ctrl.updateCategory);

// DELETE /api/admin/categories/:id
router.delete('/:id', ctrl.deleteCategory);

// POST /api/admin/categories/:id/subcategories
router.post('/:id/subcategories', ctrl.addSubcategory);

// PATCH /api/admin/categories/:id/subcategories/:subId
router.patch('/:id/subcategories/:subId', ctrl.updateSubcategory);

// DELETE /api/admin/categories/:id/subcategories/:subId
router.delete('/:id/subcategories/:subId', ctrl.deleteSubcategory);

module.exports = router;
