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

// Public: list products by category and/or subcategory
exports.listByCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;
    if (!categoryId && !subcategoryId) {
      return res.status(400).json({ message: 'categoryId or subcategoryId is required' });
    }
    const query = {};
    if (categoryId) query.categoryId = categoryId;
    if (subcategoryId) query.subcategoryId = subcategoryId;
    const items = await Product.find(query);
    return res.json({ products: items.map((p) => p.toJSON()) });
  } catch (err) {
    console.error('List by category error:', err);
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
