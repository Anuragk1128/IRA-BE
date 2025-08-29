const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');

const router = express.Router();

// POST /api/wishlist/:productId - add a product to wishlist (idempotent)
router.post('/:productId', requireAuth, addToWishlist);
// DELETE /api/wishlist/:productId - remove a product from wishlist
router.delete('/:productId', requireAuth, removeFromWishlist);

module.exports = router;
