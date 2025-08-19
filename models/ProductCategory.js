const mongoose = require('mongoose');

const ProductSubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const ProductCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    subcategories: { type: [ProductSubcategorySchema], default: [] },
  },
  { timestamps: true }
);

ProductCategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (Array.isArray(ret.subcategories)) {
      ret.subcategories = ret.subcategories.map((s) => {
        const { _id, ...rest } = s;
        return { id: _id?.toString?.() || undefined, ...rest };
      });
    }
    return ret;
  },
});

module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
