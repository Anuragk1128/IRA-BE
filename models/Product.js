const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    // New ID-based linkage
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, required: true }, // references embedded subcategory _id
    material: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Product', ProductSchema);
