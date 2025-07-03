import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";

// Add product to wishlist
// Add product to wishlist and remove from cart if present
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?._id;
    const productId = req.params.productId;
    if (!userId) return res.status(401).json({ success: false, msg: "Unauthorized" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, msg: "Product not found" });

    const exists = await Wishlist.findOne({ user: userId, product: productId });
    if (exists) return res.status(400).json({ success: false, msg: "Already in wishlist" });

    

    const item = await new Wishlist({ user: userId, product: productId }).save();
    return res.status(201).json({ success: true, msg: "Added to wishlist (removed from cart if present)", data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};


// Add to wishlist and remove from cart if present
export const addToWishlistAndRemoveFromCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    const productId = req.params.productId;
    if (!userId) return res.status(401).json({ success: false, msg: "Unauthorized" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, msg: "Product not found" });

    const exists = await Wishlist.findOne({ user: userId, product: productId });
    if (exists) return res.status(400).json({ success: false, msg: "Already in wishlist" });

    // Remove from cart if exists
    await Cart.findOneAndDelete({ user: userId, product: productId });

    const item = await new Wishlist({ user: userId, product: productId }).save();
    return res.status(201).json({ success: true, msg: "Added to wishlist (removed from cart if present)", data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};



// Get wishlist for current user
export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, msg: "Unauthorized" });

    const items = await Wishlist.find({ user: userId })
      .populate({ path: "product", select: "name price images slug" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove single item from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?._id;
    const id = req.params.wishlistId;
    if (!userId) return res.status(401).json({ success: false, msg: "Unauthorized" });

    const item = await Wishlist.findOneAndDelete({ _id: id, user: userId });
    if (!item) return res.status(404).json({ success: false, msg: "Item not found" });

    const items = await Wishlist.find({ user: userId })
      .populate("product", "name price images slug");

    return res.status(200).json({ success: true, msg: "Removed", data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Clear entire wishlist for current user
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, msg: "Unauthorized" });

    await Wishlist.deleteMany({ user: userId });
    return res.status(200).json({ success: true, msg: "Wishlist cleared", data: [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};
