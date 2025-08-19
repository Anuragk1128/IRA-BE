const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

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
      images: Array.isArray(data.images) ? data.images : [],
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

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    return res.json({ product: product.toJSON() });
  } catch (err) {
    console.error('Update product error:', err);
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
