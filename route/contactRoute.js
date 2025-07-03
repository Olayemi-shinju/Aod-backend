import express from "express";
const router = express.Router();

import { protect } from '../middlewares/authMiddleware.js';

import {
  createContact,
  deleteAllContact,
  deleteContactById,
  getAllContact,
  updateContactById,
  getUnreadContactsCount,
  markAllContactsAsRead,
} from "../controllers/contactController.js";

router.post('/send', protect, createContact);
router.get('/get-all-contact', getAllContact);
router.delete('/delete-all-contact', deleteAllContact);
router.delete('/delete-contact/:contactId', deleteContactById);
router.put('/update-contact/:contactId', updateContactById);

// New routes for unread count and marking all as read
router.get('/unread-count', protect, getUnreadContactsCount);
router.put('/mark-all-read', protect, markAllContactsAsRead);

export default router;
