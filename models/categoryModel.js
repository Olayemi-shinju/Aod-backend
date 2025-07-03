import mongoose from "mongoose";
import slugify from "slugify";

const schema = mongoose.Schema;

const categorySchema = new schema({
  admin: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  imagePublicId: { type: String, required: true },
  createdAt: { type: String, default: Date.now },
});

// Auto-generate slug before saving
categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Category', categorySchema);
