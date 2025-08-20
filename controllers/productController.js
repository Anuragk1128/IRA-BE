const Product = require('../models/Product');

// Public: list all products without filters/pagination
exports.listProducts = async (req, res) => {
  try {
    const items = await Product.find({});
    return res.json({ products: items.map((p) => p.toJSON()) });
  } catch (err) {
    console.error('List products error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Public: get product by id
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Product.findById(id);
    if (!item) return res.status(404).json({ message: 'Product not found' });
    return res.json({ product: item.toJSON() });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
