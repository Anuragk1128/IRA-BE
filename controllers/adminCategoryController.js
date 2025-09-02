const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

async function normalizeImageToUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  // Allow existing absolute URL, prefer https
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, 'https://');
  // data URL base64
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) {
    const up = await cloudinary.uploader.upload(trimmed, { folder: 'categories' });
    return up.secure_url;
  }
  // raw base64
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 100) {
    const dataUrl = `data:image/png;base64,${trimmed}`;
    const up = await cloudinary.uploader.upload(dataUrl, { folder: 'categories' });
    return up.secure_url;
  }
  // Unknown format (e.g., "/image.png") -> reject to avoid broken links
  throw Object.assign(new Error('Invalid category image: provide a Cloudinary URL or base64 data URL'), { field: 'image' });
}

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description = '', image = '' } = req.body || {};
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'subcategories')) {
      return res.status(400).json({ message: 'Do not include subcategories here. Use subcategory endpoints.' });
    }
    const exists = await ProductCategory.findOne({ slug });
    if (exists) return res.status(409).json({ message: 'Slug already exists' });
    const normalizedImage = image ? await normalizeImageToUrl(image) : '';
    const cat = await ProductCategory.create({ name, slug, description, image: normalizedImage });
    return res.status(201).json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Create category error:', err);
    if (err && err.field === 'image') {
      return res.status(400).json({ message: err.message, field: 'image' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (Object.prototype.hasOwnProperty.call(updates, 'subcategories')) {
      return res.status(400).json({ message: 'Do not modify subcategories here. Use subcategory endpoints.' });
    }
    // If slug is being changed, just ensure uniqueness (products now reference by IDs)
    if (typeof updates.slug === 'string') {
      const current = await ProductCategory.findById(id);
      if (!current) return res.status(404).json({ message: 'Category not found' });
      const existsSlug = await ProductCategory.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (existsSlug) return res.status(409).json({ message: 'Slug already exists' });
    }
    // Normalize image if provided
    if (Object.prototype.hasOwnProperty.call(updates, 'image')) {
      if (typeof updates.image !== 'string') {
        return res.status(400).json({ message: 'image must be a string', field: 'image' });
      }
      updates.image = updates.image ? await normalizeImageToUrl(updates.image) : '';
    }

    const cat = await ProductCategory.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category: cat.toJSON() });
  } catch (err) {
    console.error('Update category error:', err);
    if (err && err.field === 'image') {
      return res.status(400).json({ message: err.message, field: 'image' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    // Block deletion if any products reference this category by ID
    const inUse = await Product.exists({ categoryId: cat._id });
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

// GET /api/admin/categories/:id (id only)
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

// POST /api/admin/categories/:id/subcategories (id only)
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

// PATCH /api/admin/categories/:id/subcategories/:subId (id only)
exports.updateSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const { name, slug, description } = req.body || {};
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const sub = cat.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: 'Subcategory not found' });

    // If slug change, ensure uniqueness and block if products reference it (by IDs now)
    if (typeof slug === 'string' && slug !== sub.slug) {
      const inUse = await Product.exists({ categoryId: cat._id, subcategoryId: sub._id });
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

// DELETE /api/admin/categories/:id/subcategories/:subId (id only)
exports.deleteSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const cat = await ProductCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const sub = cat.subcategories.id(subId);
    if (!sub) return res.status(404).json({ message: 'Subcategory not found' });

    // Block delete if any products reference this pair (by IDs)
    const inUse = await Product.exists({ categoryId: cat._id, subcategoryId: sub._id });
    if (inUse) return res.status(409).json({ message: 'Cannot delete subcategory: products reference it' });

    sub.deleteOne();
    await cat.save();
    return res.status(204).send();
  } catch (err) {
    console.error('Delete subcategory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

