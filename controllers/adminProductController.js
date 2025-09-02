const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const cloudinary = require('cloudinary').v2;

// Normalize an array of image inputs to secure URLs using Cloudinary when necessary
async function normalizeImagesToUrls(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) return [];
  const out = [];
  for (const item of inputs) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    // If already an absolute http(s) URL, accept as-is (must be https)
    if (/^https?:\/\//i.test(trimmed)) {
      // Prefer https
      const httpsUrl = trimmed.replace(/^http:\/\//i, 'https://');
      out.push(httpsUrl);
      continue;
    }
    // If base64 data URL
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) {
      const uploaded = await cloudinary.uploader.upload(trimmed, { folder: 'products' });
      out.push(uploaded.secure_url);
      continue;
    }
    // If raw base64 (no data: prefix), try to infer png
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 100) {
      const dataUrl = `data:image/png;base64,${trimmed}`;
      const uploaded = await cloudinary.uploader.upload(dataUrl, { folder: 'products' });
      out.push(uploaded.secure_url);
      continue;
    }
    // Unknown format (e.g., "/file.png"), reject to prevent broken images
    throw Object.assign(new Error('Invalid image input: provide a Cloudinary URL or base64 data URL'), { field: 'images' });
  }
  return out;
}

exports.createProduct = async (req, res) => {
  try {
    const data = req.body || {};
    const required = ['name', 'price', 'material', 'color', 'categoryId', 'subcategoryId'];
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ message: `${f} is required` });
    }

    // Validate categoryId exists and subcategoryId belongs to it
    const categoryDoc = await ProductCategory.findById(data.categoryId);
    if (!categoryDoc) {
      return res.status(422).json({ message: 'Invalid categoryId: not found', field: 'categoryId' });
    }

    const subDoc = categoryDoc.subcategories.id(data.subcategoryId);
    if (!subDoc) {
      return res.status(422).json({ message: 'Invalid subcategoryId for given categoryId', field: 'subcategoryId' });
    }

    const toCreate = {
      name: data.name,
      description: data.description || '',
      price: data.price,
      originalPrice: data.originalPrice,
      images: Array.isArray(data.images) ? await normalizeImagesToUrls(data.images) : [],
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      material: data.material,
      color: data.color,
      size: data.size,
      inStock: data.inStock !== undefined ? !!data.inStock : true,
      rating: data.rating,
      reviewCount: data.reviewCount,
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured: !!data.featured,
      bestseller: !!data.bestseller,
      newArrival: !!data.newArrival,
    };

    const product = await Product.create(toCreate);
    return res.status(201).json({ product: product.toJSON() });
  } catch (err) {
    console.error('Create product error:', err);
    if (err && err.field === 'images') {
      return res.status(400).json({ message: err.message, field: 'images' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    // Determine effective category/subcategory after update (by IDs)
    const nextCategoryId = updates.hasOwnProperty('categoryId') ? updates.categoryId : existing.categoryId;
    const nextSubcategoryId = updates.hasOwnProperty('subcategoryId') ? updates.subcategoryId : existing.subcategoryId;

    // If either provided, validate pair
    if (updates.hasOwnProperty('categoryId') || updates.hasOwnProperty('subcategoryId')) {
      if (!nextCategoryId) return res.status(422).json({ message: 'categoryId is required with subcategoryId', field: 'categoryId' });
      if (!nextSubcategoryId) return res.status(422).json({ message: 'subcategoryId is required with categoryId', field: 'subcategoryId' });

      const categoryDoc = await ProductCategory.findById(nextCategoryId);
      if (!categoryDoc) {
        return res.status(422).json({ message: 'Invalid categoryId: not found', field: 'categoryId' });
      }
      const subDoc = categoryDoc.subcategories.id(nextSubcategoryId);
      if (!subDoc) {
        return res.status(422).json({ message: 'Invalid subcategoryId for given categoryId', field: 'subcategoryId' });
      }
    }

    // Normalize images if provided
    if (updates.hasOwnProperty('images')) {
      if (!Array.isArray(updates.images)) {
        return res.status(400).json({ message: 'images must be an array of strings', field: 'images' });
      }
      updates.images = await normalizeImagesToUrls(updates.images);
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    return res.json({ product: product.toJSON() });
  } catch (err) {
    console.error('Update product error:', err);
    if (err && err.field === 'images') {
      return res.status(400).json({ message: err.message, field: 'images' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ product: product.toJSON() });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({ products: products.map((p) => p.toJSON()) });
  } catch (err) {
    console.error('List products admin error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
