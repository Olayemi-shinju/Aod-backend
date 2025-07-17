import express from "express";
import {
  createElectronic,
  updateElectronic,
  deleteElectronic,
  getAllElectronic,
  calculateEnergy
} from "../controllers/electronicController.js";
import { authorized, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET all electronics
router.get("/electronics/get-all-electronics", getAllElectronic);

// POST create electronic
router.post("/electronics/create-electronics", protect, authorized('admin'), createElectronic);

// PUT update electronic by ID
router.put("/electronics/update-electronic/:id", protect, authorized('admin'), updateElectronic);

// DELETE electronic by ID
router.delete("/electronics/delete-electronics/:id", protect, authorized('admin'), deleteElectronic);

router.post("/electronics/calculate", calculateEnergy);

export default router;
