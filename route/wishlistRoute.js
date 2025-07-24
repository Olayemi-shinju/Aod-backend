import express from "express";
import { authorized, protect } from "../middlewares/authMiddleware.js";
import {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
  clearWishlist,
  addToWishlistAndRemoveFromCart,
  getAllWishlists,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/wishlist/add/:productId", protect, addToWishlist);
router.get("/wishlist/me", protect, getMyWishlist);
router.delete("/wishlist/remove/:wishlistId", protect, removeFromWishlist);
router.delete("/wishlist/clear", protect, clearWishlist);
router.post('/add-to-wishlist/:productId', protect, addToWishlistAndRemoveFromCart)
router.get("/wishlist/all", protect, authorized('admin'), getAllWishlists);
export default router;
