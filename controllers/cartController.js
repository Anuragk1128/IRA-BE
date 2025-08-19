const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

function computeCart(items = []) {
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const tax = 0; // adjust if needed
  const shipping = 0; // adjust if needed
  const total = subtotal + tax + shipping;
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  return { subtotal, tax, shipping, total, itemCount };
}

exports.getCart = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user._id);
    if (!userDoc) return res.status(404).json({ message: 'User not found' });

    const user = userDoc.toJSON();
    const items = user.cart?.items || [];
    const summary = computeCart(items);
    return res.json({ items, ...summary });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    if (quantity <= 0) return res.status(400).json({ message: 'quantity must be > 0' });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.inStock === false) return res.status(409).json({ message: 'Product out of stock' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = user.cart || { items: [] };

    // Define match criteria: product + size/color/material (if applicable)
    const matchIndex = (user.cart.items || []).findIndex(
      (i) => i.productId?.toString() === product._id.toString()
    );

    if (matchIndex >= 0) {
      // increment quantity
      user.cart.items[matchIndex].quantity += quantity;
    } else {
      user.cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
        material: product.material,
        color: product.color,
        size: product.size,
        quantity,
        inStock: product.inStock,
      });
    }

    await user.save();

    const items = user.toJSON().cart.items; // uses toJSON transform to expose id field
    const summary = computeCart(items);
    return res.status(200).json({ items, ...summary });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
