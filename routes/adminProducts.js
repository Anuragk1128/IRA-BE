const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminProductController');

// All routes here require admin auth
router.use(requireAdminAuth);

// GET /api/admin/products
router.get('/', ctrl.listProductsAdmin);

// POST /api/admin/products
router.post('/', ctrl.createProduct);

// GET /api/admin/products/:id
router.get('/:id', ctrl.getProduct);

// PATCH /api/admin/products/:id
router.patch('/:id', ctrl.updateProduct);

// DELETE /api/admin/products/:id
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
