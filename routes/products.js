const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

// GET /api/products
router.get('/', ctrl.listProducts);

// GET /api/products/:id
router.get('/:id', ctrl.getProduct);

module.exports = router;
