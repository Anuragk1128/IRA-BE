const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description = '', image = '', subcategories = [] } = req.body || {};
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
    const exists = await ProductCategory.findOne({ slug });
    if (exists) return res.status(409).json({ message: 'Slug already exists' });
    // Ensure subcategory slugs are unique within this payload
    const seen = new Set();
    for (const s of subcategories) {
      if (!s || !s.slug) continue;
      if (seen.has(s.slug)) return res.status(422).json({ message: `Duplicate subcategory slug: ${s.slug}` });
      seen.add(s.slug);
    }
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
    // If slug is being changed, and products reference old slug, block
    if (typeof updates.slug === 'string') {
      const current = await ProductCategory.findById(id);
      if (!current) return res.status(404).json({ message: 'Category not found' });
      if (current.slug !== updates.slug) {
        const prodUsing = await Product.exists({ category: current.slug });
        if (prodUsing) return res.status(409).json({ message: 'Cannot change slug: products reference this category' });
      }
      // also ensure new slug not used by another category
      const existsSlug = await ProductCategory.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (existsSlug) return res.status(409).json({ message: 'Slug already exists' });
    }
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
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    // Block deletion if any products reference this category slug
    const inUse = await Product.exists({ category: cat.slug });
    if (inUse) return res.status(409).json({ message: 'Cannot delete category: products reference this category' });
    await ProductCategory.findByIdAndDelete(id);
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

// GET /api/admin/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Get category by id error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/admin/categories/:id/subcategories
exports.addSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description = '' } = req.body || {};
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    // unique slug within category
    if (cat.subcategories.some((s) => s.slug === slug)) {
      return res.status(409).json({ message: 'Subcategory slug already exists in this category' });
    }
    cat.subcategories.push({ name, slug, description });
    await cat.save();
    return res.status(201).json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Add subcategory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/admin/categories/:id/subcategories/:subId
exports.updateSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const { name, slug, description } = req.body || {};
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const sub = cat.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: 'Subcategory not found' });

    // If slug change, ensure uniqueness and block if products reference old one
    if (typeof slug === 'string' && slug !== sub.slug) {
      const inUse = await Product.exists({ category: cat.slug, subcategory: sub.slug });
      if (inUse) return res.status(409).json({ message: 'Cannot change subcategory slug: products reference it' });
      if (cat.subcategories.some((s) => s.slug === slug)) {
        return res.status(409).json({ message: 'Subcategory slug already exists in this category' });
      }
      sub.slug = slug;
    }

    if (typeof name === 'string') sub.name = name;
    if (typeof description === 'string') sub.description = description;
    await cat.save();
    return res.json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Update subcategory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/admin/categories/:id/subcategories/:subId
exports.deleteSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const sub = cat.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: 'Subcategory not found' });

    // Block delete if any products reference this pair
    const inUse = await Product.exists({ category: cat.slug, subcategory: sub.slug });
    if (inUse) return res.status(409).json({ message: 'Cannot delete subcategory: products reference it' });

    sub.deleteOne();
    await cat.save();
    return res.status(204).send();
  } catch (err) {
    console.error('Delete subcategory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
