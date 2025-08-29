const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Address fields removed from user model

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
    // Wishlist stores Product ObjectIds
    wishlist: { type: [mongoose.Schema.Types.ObjectId], ref: 'Product', default: [] },
    preferences: { type: PreferencesSchema, default: {} },
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
    // Address fields removed
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
