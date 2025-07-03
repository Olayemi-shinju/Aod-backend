import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
  clearWishlist,
  addToWishlistAndRemoveFromCart,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/wishlist/add/:productId", protect, addToWishlist);
router.get("/wishlist/me", protect, getMyWishlist);
router.delete("/wishlist/remove/:wishlistId", protect, removeFromWishlist);
router.delete("/wishlist/clear", protect, clearWishlist);
router.post('/add-to-wishlist/:productId', protect, addToWishlistAndRemoveFromCart)

export default router;
