const Product = require('../models/Product');

// Public: list products with filters and pagination
exports.listProducts = async (req, res) => {
  try {
    const {
      categoryId,
      subcategoryId,
      featured,
      bestseller,
      newArrival,
      inStock,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt:desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (categoryId) query.categoryId = categoryId;
    if (subcategoryId) query.subcategoryId = subcategoryId;
    if (featured !== undefined) query.featured = featured === 'true';
    if (bestseller !== undefined) query.bestseller = bestseller === 'true';
    if (newArrival !== undefined) query.newArrival = newArrival === 'true';
    if (inStock !== undefined) query.inStock = inStock === 'true';
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const [sortField, sortDir] = String(sort).split(':');
    const sortObj = { [sortField]: sortDir === 'asc' ? 1 : -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    return res.json({
      products: items.map((p) => p.toJSON()),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('List products error:', err);
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
