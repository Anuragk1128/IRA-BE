const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

exports.createProduct = async (req, res) => {
  try {
    const data = req.body || {};
    const required = ['name', 'price', 'category', 'material', 'color', 'subcategory'];
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ message: `${f} is required` });
    }

    // Validate category slug exists and subcategory belongs to it
    const categoryDoc = await ProductCategory.findOne({ slug: data.category }).lean();
    if (!categoryDoc) {
      return res.status(422).json({ message: 'Invalid category: slug not found', field: 'category' });
    }

    const subOk = Array.isArray(categoryDoc.subcategories) && categoryDoc.subcategories.some((s) => s.slug === data.subcategory);
    if (!subOk) {
      return res.status(422).json({ message: 'Invalid subcategory for given category', field: 'subcategory' });
    }

    const product = await Product.create(data);
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

    // Determine effective category/subcategory after update
    const nextCategory = updates.category ?? existing.category;
    const nextSubcategory = updates.subcategory ?? existing.subcategory;

    // If category or subcategory provided (or exist), validate relationship
    if (nextCategory || nextSubcategory) {
      // Require both to be present logically
      if (!nextCategory) return res.status(422).json({ message: 'category is required with subcategory', field: 'category' });
      if (!nextSubcategory) return res.status(422).json({ message: 'subcategory is required with category', field: 'subcategory' });

      const categoryDoc = await ProductCategory.findOne({ slug: nextCategory }).lean();
      if (!categoryDoc) {
        return res.status(422).json({ message: 'Invalid category: slug not found', field: 'category' });
      }
      const subOk = Array.isArray(categoryDoc.subcategories) && categoryDoc.subcategories.some((s) => s.slug === nextSubcategory);
      if (!subOk) {
        return res.status(422).json({ message: 'Invalid subcategory for given category', field: 'subcategory' });
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
