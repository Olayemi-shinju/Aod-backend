import express from "express";
import {
  createCheckout,
  cancelCheckout,
  updateOrderStatus,
  getUserOrders,
  getAllOrders,
  deleteCheckout, // 👈 import the delete function
} from "../controllers/checkoutController.js";

import { authorized, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/checkout", protect, createCheckout);
router.patch("/cancel/:id", protect, cancelCheckout);
router.patch("/status/:id", protect, updateOrderStatus); // Admin can call this
router.get("/my-orders", protect, getUserOrders);
router.get("/get-orders", protect, authorized("admin"), getAllOrders);

// ✅ Delete route (only for non-successful orders)
router.delete("/delete-order/:id", protect, deleteCheckout);

export default router;
