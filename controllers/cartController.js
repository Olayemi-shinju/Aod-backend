import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Wishlist from "../models/wishlistModel.js";

// Utility to calculate cart totals and return detailed product data
const calculateCartSummary = async (userId) => {
  const cartItems = await Cart.find({ user: userId }).populate({
    path: "product",
    select: "_id name price discount quantity description brand category images",
    populate: {
      path: "category",
      select: "_id name slug", // Add more fields if needed
    },
  });

  let subtotal = 0;
  let totalItems = 0;

  const detailedItems = cartItems.map((item) => {
    const product = item.product;
    const quantity = item.quantity;
    const price = product.discount > 0 ? product.discount : product.price;
    const total = price * quantity;

    subtotal += total;
    totalItems = cartItems.length;

    return {
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discount,
        image: product.images?.[0] || null,
        images: product.images,
        stock: product.quantity,
        description: product.description,
        brand: product.brand,
        category: product.category, // Already populated
      },
      quantity,
      total,
    };
  });

  return { detailedItems, subtotal, totalItems };
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const existing = await Cart.findOne({ user: userId, product: productId });
    const existingQty = existing ? existing.quantity : 0;
    const totalRequested = existingQty + quantity;

    if (totalRequested > product.quantity) {
      return res.status(400).json({ msg: `Only ${product.quantity} item(s) in stock. You already have ${existingQty} in your cart.` });
    }

    if (existing) {
      existing.quantity = totalRequested;
      await existing.save();
    } else {
      await Cart.create({
        user: userId,
        product: productId,
        quantity,
      });
    }

    const summary = await calculateCartSummary(userId);
    res.status(200).json({ msg: "Cart updated", ...summary });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};



export const addToCartAndRemoveFromWishlist = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const existing = await Cart.findOne({ user: userId, product: productId });
    const existingQty = existing ? existing.quantity : 0;
    const totalRequested = existingQty + quantity;

    if (totalRequested > product.quantity) {
      return res.status(400).json({ msg: `Only ${product.quantity} item(s) in stock. You already have ${existingQty} in your cart.` });
    }

    if (existing) {
      existing.quantity = totalRequested;
      await existing.save();
    } else {
      await Cart.create({
        user: userId,
        product: productId,
        quantity,
      });
    }

    await Wishlist.findOneAndDelete({ user: userId, product: productId });

    const summary = await calculateCartSummary(userId);
    res.status(200).json({ msg: "Added to cart (removed from wishlist)", ...summary });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};



// Get user's cart
export const getUserCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const summary = await calculateCartSummary(userId);
    res.status(200).json({ msg: "Cart retrieved", ...summary });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ msg: "Failed to fetch cart" });
  }
};

// Delete a single cart item
export const deleteSingleProductFromCart = async (req, res) => {
  const cartItemId = req.params.id;
  const userId = req.user._id;

  try {
    const cartItem = await Cart.findOneAndDelete({ _id: cartItemId, user: userId });

    if (!cartItem) {
      return res.status(404).json({ msg: "Cart item not found" });
    }

    const summary = await calculateCartSummary(userId);
    res.status(200).json({ msg: "Cart item removed", ...summary });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ msg: "Failed to delete cart item" });
  }
};

// Clear entire cart
export const clearUserCart = async (req, res) => {
  const userId = req.user._id;

  try {
    await Cart.deleteMany({ user: userId });
    res.status(200).json({
      msg: "All cart items cleared",
      detailedItems: [],
      subtotal: 0,
      totalItems: 0,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ msg: "Failed to clear cart" });
  }
};

// Admin: Get all carts
export const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find().populate({
      path: "product user",
      populate: {
        path: "category",
        select: "_id name slug",
      },
    });

    const grouped = {};

    carts.forEach((item) => {
      const uid = item.user._id;

      if (!grouped[uid]) {
        grouped[uid] = {
          user: {
            _id: item.user._id,
            name: item.user.name,
            email: item.user.email,
          },
          items: [],
          subtotal: 0,
          totalItems: 0,
        };
      }

      const price = item.product.discount > 0 ? item.product.discount : item.product.price;
      const total = price * item.quantity;

      grouped[uid].items.push({
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          discountPrice: item.product.discount,
          image: item.product.images?.[0] || null,
          category: item.product.category,
        },
        quantity: item.quantity,
        total,
      });

      grouped[uid].subtotal += total;
      grouped[uid].totalItems += item.quantity;
    });

    res.status(200).json({
      msg: "All carts fetched",
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error("Get all carts error:", error);
    res.status(500).json({ msg: "Failed to fetch all carts" });
  }
};


// PATCH: Update quantity of a specific cart item
export const updateCartItem = async (req, res) => {
  const userId = req.user._id;
  const cartItemId = req.params.id;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ msg: "Invalid quantity value" });
  }

  try {
    const cartItem = await Cart.findOne({_id: cartItemId, user: userId }).populate("product");

    if (!cartItem) {
      return res.status(404).json({ msg: "Cart item not found" });
    }

    // Optional: Check against product stock
    const stock = cartItem.product.quantity;
    if (quantity > stock) {
      return res.status(400).json({ msg: `Only ${stock} in stock` });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const summary = await calculateCartSummary(userId);
    res.status(200).json({ msg: "Cart item updated", ...summary });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ msg: "Failed to update cart item" });
  }
};
