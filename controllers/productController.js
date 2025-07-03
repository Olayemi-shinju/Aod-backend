import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Category from '../models/categoryModel.js'
import { v2 as cloudinary } from "cloudinary";
import Review from "../models/reviewModel.js";
import slugify from "slugify"; // ✅ Make sure slugify is imported
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  try {
    const { adminId } = req.params;
    const {
      name,
      description,
      brand,
      warranty,
      price,
      discount,
      quantity,
      isFeatured,
      isNewArrival,
      categoryId
    } = req.body;

    // Admin check
    if (!adminId) {
      return res.status(400).json({ success: false, msg: 'Admin ID is required.' });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, msg: 'Only admins can create products.' });
    }

    // Image checks
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ success: false, msg: 'At least one image is required.' });
    }

    if (req.files.images.length > 4) {
      return res.status(400).json({ success: false, msg: 'Maximum 4 images allowed.' });
    }

    // Use file info from multer-storage-cloudinary directly
    const images = req.files.images.map(file => file.path);            // URLs from Cloudinary
    const imagesPublicIds = req.files.images.map(file => file.filename); // public IDs from Cloudinary

    // Create new product document
    const product = new Product({
      name,
      description,
      images,
      imagesPublicIds,
      brand,
      warranty,
      price,
      discount,
      quantity,
      isFeatured,
      isNewArrival,
      category: categoryId,
      createdBy: adminUser._id
    });

    const savedProduct = await product.save();

    return res.status(201).json({ success: true, msg: 'Product created.', data: savedProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, msg: 'Server error.' });
  }
};

export const getAllProduct = async (req, res) => {
  try {
    // Read page and limit from query params with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page

    const skip = (page - 1) * limit;

    // Total count for pagination metadata
    const total = await Product.countDocuments();

    // Fetch paginated products with category populated
    const products = await Product.find()
      .populate('category')
      .skip(skip)
      .limit(limit);

    const lowStockWarnings = products.filter(p => p.quantity < 5).map(p => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      quantity: p.quantity,
      message: `Only ${p.quantity} left in stock for ${p.name}`
    }));

    res.status(200).json({
      success: true,
      data: products,
      lowStockWarnings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Server error.' });
  }
};




export const getProductByCatSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!slug) {
      return res.status(400).json({ success: false, msg: "Category slug is required." });
    }

    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ success: false, msg: "Category not found." });
    }

    const total = await Product.countDocuments({ category: category._id });

    const products = await Product.find({ category: category._id })
      .populate("category")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      msg: `Products found for category: ${category.name}`,
      data: products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error("getProductByCatSlug error:", error);
    res.status(500).json({ success: false, msg: "Server error." });
  }
};




// ✅ GET SINGLE PRODUCT (supports ID or slug)
export const getSingleProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const product = await Product.findOne(query).populate("category");

    if (!product)
      return res.status(404).json({
        success: false,
        msg: "Product not found.",
      });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Get single product error:", error);
    res.status(500).json({ success: false, msg: "Server error." });
  }
};

// UPDATE PRODUCT (FULL UPDATE)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ success: false, msg: 'Product not found.' });

    // ✅ If name is changing, regenerate slug
    if (req.body.name && req.body.name !== existingProduct.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    // Optional: remove old images from cloudinary
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const publicId of existingProduct.imagesPublicIds) {
        await cloudinary.uploader.destroy(publicId);
      }

      const uploadPromises = req.files.images.map(file =>
        cloudinary.uploader.upload(file.path, { folder: "products" })
      );
      const uploadResults = await Promise.all(uploadPromises);

      req.body.images = uploadResults.map(r => r.secure_url);
      req.body.imagePublicIds = uploadResults.map(r => r.public_id);
    }

    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, msg: 'Product updated.', data: updated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Server error.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, msg: 'Product not found.' });

    // Delete images from Cloudinary
    for (const publicId of product.imagesPublicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete associated reviews
    await Review.deleteMany({ productId: id });

    // Delete product
    await Product.findByIdAndDelete(id);

    const resp = await Product.find().populate('category')

    res.status(200).json({ success: true, msg: 'Product deleted Successfully.', data: resp });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Server error.' });
  }
};

// PATCH PRODUCT (e.g. toggle featured, update discount, etc.)
export const patchProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ success: false, msg: 'Product not found.' });

    res.status(200).json({ success: true, msg: 'Product updated (patched).', data: updated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Server error.' });
  }
};
