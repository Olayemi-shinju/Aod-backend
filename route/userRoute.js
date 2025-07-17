import express from "express";

import { signUp, verifyOtp, Login, forgotPassword, resetPassword, getAllUser, getSingleUser, updateUser, resendOtp, Logout, deleteUser } from "../controllers/userContoller.js";
import { authorized, protect } from "../middlewares/authMiddleware.js";

const router = express.Router()

router.post('/sign', signUp)
router.post('/verifyOtp', verifyOtp)
router.post('/login', Login)
router.post('/logout', Logout)
router.post('/resend-otp', resendOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.get('/get-all-user', protect, authorized('admin'), getAllUser),
router.get('/get-single-user/:id', protect, getSingleUser),
router.put('/update-user/:id', protect, updateUser)
router.delete('/delete-user/:id', deleteUser)
export default router