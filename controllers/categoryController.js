import categoryModel from "../models/categoryModel.js";
import User from '../models/userModel.js';
import { v2 as cloudinary } from "cloudinary";
import slugify from "slugify";

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, msg: 'User ID is required.' });
    }

    const adminUser = await User.findById(id);
    if (!adminUser) {
      return res.status(404).json({ success: false, msg: 'Admin user not found.' });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, msg: 'Only admins can create categories.' });
    }

    const uploadedImage = req.files?.image?.[0];
    const imageUrl = uploadedImage?.path;
    const publicId = uploadedImage?.filename;

    if (!name || !imageUrl || !publicId) {
      return res.status(400).json({ success: false, msg: 'Name and image are required.' });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existingSlug = await categoryModel.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ success: false, msg: 'A category with this name already exists.' });
    }

    const category = new categoryModel({
      name,
      slug,
      image: imageUrl,
      imagePublicId: publicId,
      admin: adminUser._id,
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      msg: 'Category created successfully.',
      data: savedCategory,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Internal Server Error.' });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, msg: "Category ID is required." });
    }

    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, msg: "Category not found." });
    }

    const updateData = {};

    // Handle image replacement
    if (req.files && req.files.image && req.files.image[0]) {
      const newImage = req.files.image[0];
      const newImagePath = newImage.path;
      const newPublicId = newImage.filename;

      if (existingCategory.imagePublicId) {
        await cloudinary.uploader.destroy(existingCategory.imagePublicId);
      }

      updateData.image = newImagePath;
      updateData.imagePublicId = newPublicId;
    }

    // Handle name and slug change
    if (name) {
      const newSlug = slugify(name, { lower: true, strict: true });

      // Check for slug uniqueness (excluding self)
      const slugConflict = await categoryModel.findOne({
        slug: newSlug,
        _id: { $ne: id },
      });

      if (slugConflict) {
        return res.status(400).json({ success: false, msg: 'Another category with this name already exists.' });
      }

      updateData.name = name;
      updateData.slug = newSlug;
    }

    const updatedCategory = await categoryModel.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      success: true,
      msg: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "An error occurred while updating the category." });
  }
};

// GET ALL CATEGORIES
export const getAllCategory = async (req, res) => {
  try {
    const categories = await categoryModel
      .find()
      .populate("admin", "-password -__v");

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'No categories found. Create one to get started.',
      });
    }

    return res.status(200).json({
      success: true,
      msg: 'Categories retrieved successfully',
      data: categories,
    });
  } catch (error) {
    console.error("Error in getAllCategory:", error);
    return res.status(500).json({
      success: false,
      msg: 'Server error. Please try again later.',
    });
  }
};

// GET CATEGORY BY SLUG
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await categoryModel
      .findOne({ slug })
      .populate("admin", "-password -__v");

    if (!category) {
      return res.status(404).json({ success: false, msg: "Category not found." });
    }

    res.status(200).json({
      success: true,
      msg: "Category retrieved successfully.",
      data: category,
    });
  } catch (error) {
    console.error("Error in getCategoryBySlug:", error);
    res.status(500).json({ success: false, msg: "Server error." });
  }
};
