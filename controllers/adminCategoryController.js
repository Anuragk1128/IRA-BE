const ProductCategory = require('../models/ProductCategory');

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description = '', image = '', subcategories = [] } = req.body || {};
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
    const exists = await ProductCategory.findOne({ slug });
    if (exists) return res.status(409).json({ message: 'Slug already exists' });
    const cat = await ProductCategory.create({ name, slug, description, image, subcategories });
    return res.status(201).json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const cat = await ProductCategory.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await ProductCategory.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listCategoriesAdmin = async (req, res) => {
  try {
    const items = await ProductCategory.find().sort({ name: 1 });
    return res.json({ categories: items.map((c) => c.toJSON()) });
  } catch (err) {
    console.error('List categories admin error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
