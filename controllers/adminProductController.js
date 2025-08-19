const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const data = req.body || {};
    const required = ['name', 'price', 'category', 'material', 'color'];
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ message: `${f} is required` });
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
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
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
