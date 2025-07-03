import Review from '../models/reviewModel.js'
import Product from '../models/productModel.js'
// CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { slug, rating, review } = req.body;

    if (!slug) {
      return res.status(400).json({ success: false, msg: 'Product slug is required' });
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({ success: false, msg: 'Product not found' });
    }

    // Check if the user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: product._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        msg: 'You have already reviewed this product',
      });
    }

    const newReview = new Review({
      user: userId,
      product: product._id,
      slug,
      rating,
      review,
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      msg: 'Review created successfully',
      data: savedReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: 'An error occurred while creating the review',
    });
  }
};



// GET ALL REVIEWS FOR A PARTICULAR PRODUCT
export const getProductReviews = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ success: false, msg: 'Product slug is required' });
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({ success: false, msg: 'Product not found' });
    }

    const reviews = await Review.find({ slug: slug }).populate('user', 'name email');

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ success: false, msg: 'No reviews found for this product' });
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: 'An error occurred while fetching product reviews',
    });
  }
};


// GET ALL REVIEWS (ADMIN or PUBLIC)
export const getAllReviews = async (req, res) => {
  try {
    const { unread } = req.query;  // e.g., /reviews?unread=true

    let filter = {};
    if (unread === 'true') {
      filter.isRead = false;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'An error occurred while fetching all reviews' });
  }
};


// Get unread reviews count
export const getUnreadReviewsCount = async (req, res) => {
  try {
    const count = await Review.countDocuments({ isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to fetch unread reviews count' });
  }
};


export const markAllReviewsAsRead = async (req, res) => {
  try {
    const result = await Review.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, msg: `Marked ${result.modifiedCount} reviews as read` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to mark reviews as read' });
  }
};


// DELETE REVIEW - only owner can delete
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const userId = req.user._id  // from auth middleware

    const review = await Review.findById(reviewId)

    if (!review) {
      return res.status(404).json({ success: false, msg: 'Review not found' })
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, msg: 'Unauthorized to delete this review' })
    }

    await Review.findByIdAndDelete(reviewId)

    const resp = await Review.find().populate('user', 'name email')
    res.status(200).json({ success: true, msg: 'Review deleted successfully', data: resp})
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, msg: 'An error occurred while deleting the review' })
  }
}


export const deleteAllReview = async (req, res) => {
  try {
    // Delete all documents in Contact collection
    const result = await Review.deleteMany({});

    const resp = await Review.find().populate('user')
    res.status(200).json({
      success: true,
      msg: `All contacts deleted successfully. Deleted count: ${result.deletedCount}`,
      data: resp
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to delete reviews.' });
  }
};
// UPDATE REVIEW - only owner can update
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const userId = req.user._id  // from auth middleware
    const { rating, review } = req.body

    const existingReview = await Review.findById(reviewId)
    if (!existingReview) {
      return res.status(404).json({ success: false, msg: 'Review not found' })
    }

    if (existingReview.user.toString() !== userId) {
      return res.status(403).json({ success: false, msg: 'Unauthorized to update this review' })
    }

    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { rating, review, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email')

    res.status(200).json({
      success: true,
      msg: 'Review updated successfully',
      data: updated
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, msg: 'An error occurred while updating the review' })
  }
}

