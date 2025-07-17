import Checkout from "../models/checkoutModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js"; // Make sure this is imported
import { sendEmail } from "../utils/sendGrid.js";
import User from '../models/userModel.js'
import { generateOrderEmail, generateCancelEmail } from "../utils/emailTemplates.js";

// ✅ Create Checkout
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate("product");

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, msg: "Cart is empty" });
    }

    const { street, landmark, region, notes } = req.body;

    if (!street || !landmark || !region || !notes) {
      return res.status(400).json({
        success: false,
        msg: "Please provide all required fields: street, landmark, region, and notes",
      });
    }

    for (const item of cartItems) {
      if (item.product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          msg: `Insufficient stock for ${item.product.name}. Available: ${item.product.quantity}`,
        });
      }
    }

    const user = await User.findById(userId);

    const products = cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.discount > 0 ? item.product.discount : item.product.price,
    }));

    // Subtract stock
    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      product.quantity -= item.quantity;
      await product.save();
    }

    const checkout = await Checkout.create({
      user: userId,
      street,
      landmark,
      region,
      orderNote: notes,
      products,
      status: "pending",
    });

    await Cart.deleteMany({ user: userId });

    await sendEmail({
      to: user.email,
      from: process.env.FROM_EMAIL,
      subject: "Your Order Confirmation - AOD Solatricity",
      html: generateOrderEmail({ user, cartItems, street, landmark, region, notes }),
    });


    res.status(200).json({
      success: true,
      msg: "Checkout successful",
      data: checkout,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};

// ❌ Cancel Order
export const cancelCheckout = async (req, res) => {
  try {
    const checkoutId = req.params.id;
    const userId = req.user._id;

    const checkout = await Checkout.findOne({ _id: checkoutId, user: userId }).populate("user");

    if (!checkout) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    if (checkout.status === "successful") {
      return res.status(400).json({ success: false, msg: "Cannot cancel a successful order" });
    }

    checkout.status = "cancelled";
    await checkout.save();

    await sendEmail({
      to: checkout.user.email,
      from: process.env.FROM_EMAIL,
      subject: "Order Cancelled - AOD Solatricity",
      html: generateCancelEmail(),
    });


    res.status(200).json({ success: true, msg: "Order cancelled", data: checkout });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};

// 🔄 Update Order Status (Admin or Internal Use)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "cancelled", "successful"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const order = await Checkout.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, msg: "Order status updated", data: order });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};

// 👤 Get Orders for Current User
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Checkout.find({ user: userId })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};

// 🌐 Get All Orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Checkout.find()
      .populate("user", "name email")
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};

// ❌ Delete Order (only if not successful)
export const deleteCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkoutId = req.params.id;

    const checkout = await Checkout.findOne({ _id: checkoutId, user: userId });

    if (!checkout) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    // Restore product stock
    for (const item of checkout.products) {
      const productId = item.product._id || item.product; // Handles both cases
      const product = await Product.findById(productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }


    await Checkout.findByIdAndDelete(checkoutId);

    // ✅ Fetch remaining user orders
    const remainingOrders = await Checkout.find({ user: userId })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      msg: "Order deleted successfully",
      data: remainingOrders,
    });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
};
