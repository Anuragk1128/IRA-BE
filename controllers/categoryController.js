const ProductCategory = require('../models/ProductCategory');

// Public: list all categories
exports.listCategories = async (req, res) => {
  try {
    const items = await ProductCategory.find().sort({ name: 1 });
    return res.json({ categories: items.map((c) => c.toJSON()) });
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Public: get category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cat = await ProductCategory.findOne({ slug });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Get category error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
