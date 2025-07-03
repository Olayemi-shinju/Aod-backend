import express from "express";
import {
  createCategory,
  getAllCategory,
  updateCategory,
  getCategoryBySlug, // ✅ added
} from "../controllers/categoryController.js";

import uploadMiddleware from "../utils/upload.js"; // ✅ still valid

const router = express.Router();

// CREATE category (with image upload)
router.post("/create-category/:id", uploadMiddleware, createCategory);

// GET all categories
router.get("/get-category", getAllCategory);

// UPDATE category by ID (with optional image upload)
router.put("/update-category/:id", uploadMiddleware, updateCategory);

// ✅ NEW: GET category by slug
router.get("/get-category/:slug", getCategoryBySlug);

export default router;
