import mongoose from "mongoose";
import generateUniqueSlug from "../utils/slug.js";


function arrayLimit(value) {
  return value.length <= 4;
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: [arrayLimit, "Maximum of 4 images allowed"],
    },
    brand: {
      type: String,
      trim: true,
    },
    warranty: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    imagesPublicIds: {
      type: [String],
      default: []
    },
    notifiedLowStock: {
      type: Boolean,
      default: false
    }


  },
  {
    timestamps: true,
  }
);

// ✅ Auto-generate slug before saving
productSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();
  this.slug = await generateUniqueSlug(this.name, this._id);
  next();
});


export default mongoose.model("Product", productSchema);
