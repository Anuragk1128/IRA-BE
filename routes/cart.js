const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getCart, addToCart } = require('../controllers/cartController');

// GET /api/cart - get current user's cart
router.get('/', requireAuth, getCart);

// POST /api/cart/add - add product to cart
// body: { productId: string, quantity?: number }
router.post('/add', requireAuth, addToCart);

module.exports = router;
