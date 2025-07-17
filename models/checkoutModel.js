import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    street: { type: String, required: true },
    landmark: { type: String, required: true },
    region: { type: String, required: true },
    notes: { type: String, default: null },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "successful", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Checkout = mongoose.model("Checkout", checkoutSchema);

export default Checkout;
