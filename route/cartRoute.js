import express from 'express';
import {
  addToCart,
  getUserCart,
  deleteSingleProductFromCart,
  clearUserCart,
  getAllCarts,
  updateCartItem,
  addToCartAndRemoveFromWishlist
} from '../controllers/cartController.js';
import { authorized, protect } from '../middlewares/authMiddleware.js';



const router = express.Router();

router.post('/add',  protect, addToCart);
router.get('/me', protect, getUserCart);
router.delete('/remove/:id', protect, deleteSingleProductFromCart);
router.delete('/clear', protect, clearUserCart);
router.patch('/update/:id', protect, updateCartItem)
router.get('/all', protect, authorized("admin"), getAllCarts); // Admin only
router.post('/add-to-cart', protect, addToCartAndRemoveFromWishlist)
export default router;
