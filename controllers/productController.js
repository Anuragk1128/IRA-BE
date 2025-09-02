const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

async function attachSlugs(p) {
  const obj = p.toJSON();
  try {
    if (obj.categoryId) {
      const cat = await ProductCategory.findById(obj.categoryId);
      if (cat) {
        obj.category = cat.slug; // slug string for frontend
        if (obj.subcategoryId) {
          const sub = cat.subcategories.id(obj.subcategoryId);
          if (sub) obj.subcategory = sub.slug;
        }
      }
    }
  } catch (e) {
    // non-fatal: if lookup fails, just return without slugs
  }
  return obj;
}

// Public: list all products without filters/pagination
exports.listProducts = async (req, res) => {
  try {
    const items = await Product.find({});
    const withSlugs = await Promise.all(items.map((p) => attachSlugs(p)));
    return res.json({ products: withSlugs });
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
    const withSlugs = await Promise.all(items.map((p) => attachSlugs(p)));
    return res.json({ products: withSlugs });
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
    const withSlugs = await attachSlugs(item);
    return res.json({ product: withSlugs });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
