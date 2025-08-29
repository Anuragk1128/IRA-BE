const User = require('../models/User');
const Product = require('../models/Product');

// POST /api/wishlist/:productId
// Requires auth. Adds a product to the authenticated user's wishlist (idempotent)
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    const { productId } = req.params || {};

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    // Validate product exists
    const exists = await Product.exists({ _id: productId });
    if (!exists) return res.status(404).json({ message: 'Product not found' });

    // Add to wishlist without duplicates
    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ wishlist: updated.wishlist });
  } catch (err) {
    console.error('addToWishlist error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/wishlist/:productId
// Requires auth. Removes a product from the authenticated user's wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    const { productId } = req.params || {};

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const updated = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ wishlist: updated.wishlist });
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
