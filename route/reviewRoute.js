import express from 'express';
const router = express.Router();

import {
  createReview,
  deleteReview,
  getAllReviews,
  getProductReviews,
  updateReview,
  getUnreadReviewsCount,
  markAllReviewsAsRead,
  deleteAllReview,
} from '../controllers/reviewController.js';

import { protect } from '../middlewares/authMiddleware.js';

router.post('/create-review', protect, createReview);
router.put('/update-review/:reviewId', protect, updateReview);
router.delete('/delete-review/:reviewId', protect, deleteReview);
router.delete('/delete-all-review', protect, deleteAllReview);
router.get('/get-all-review', getAllReviews);
router.get('/get-product-review/:slug', getProductReviews);

router.get('/unread-count', protect, getUnreadReviewsCount);       // new: get unread count
router.put('/mark-all-read', protect, markAllReviewsAsRead);       // new: mark all as read

export default router;
