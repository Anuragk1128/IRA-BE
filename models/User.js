const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = new mongoose.Schema(
  {
    // We expose "id" in toJSON transform; internal _id remains ObjectId
    type: {
      type: String,
      enum: ['shipping', 'billing'],
      required: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: { type: String },
    address1: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const PreferencesSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    dateOfBirth: { type: String }, // ISO string preferred on frontend
    avatar: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    preferences: { type: PreferencesSchema, default: {} },
    // Cart structure to support add-to-cart flows
    cart: {
      items: {
        type: [
          new mongoose.Schema(
            {
              productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
              name: { type: String, required: true },
              price: { type: Number, required: true, min: 0 },
              originalPrice: { type: Number, min: 0 },
              image: { type: String },
              material: { type: String, required: true },
              color: { type: String, required: true },
              size: { type: String },
              quantity: { type: Number, required: true, min: 1, default: 1 },
              inStock: { type: Boolean, default: true },
            },
            { _id: true, timestamps: true }
          ),
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
);

// Hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ensure JSON matches frontend interfaces: id, createdAt, updatedAt; remove sensitive fields
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    // Map address subdocs _id -> id
    if (Array.isArray(ret.addresses)) {
      ret.addresses = ret.addresses.map((a) => {
        const { _id, ...rest } = a;
        return { id: _id?.toString?.() || undefined, ...rest };
        
      });
    }
    // Map cart item subdocs _id -> id
    if (ret.cart && Array.isArray(ret.cart.items)) {
      ret.cart.items = ret.cart.items.map((it) => {
        const { _id, ...rest } = it;
        return { id: _id?.toString?.() || undefined, ...rest };
      });
    }
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
