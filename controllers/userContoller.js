import User from '../models/userModel.js';
import { sendEmail } from '../utils/sendGrid.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // at the top of your file
import bcrypt from 'bcryptjs';
import Review from '../models/reviewModel.js'
import Cart from '../models/cartModel.js'
import Wishlist from '../models/wishlistModel.js';
// import {logo} from '../images/Logo.png'
export const signUp = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 2) {
        return res.status(403).json({
          success: false,
          msg: 'Only two admins are allowed.',
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: 'This user already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 30 * 60 * 1000;

    const user = new User({
      name,
      email,
      password, // let mongoose hash this
      phone,
      role,
      otp,
      otpExpiry,
      isVerified: false
    });

    const savedUser = await user.save();

    try {
      await sendEmail({
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Verify Your Account - OTP Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333">Welcome to AOD Solatricity</h2>
            <p>Thank you for signing up! Please use the code below to verify your email:</p>
            <h1 style="background: #eee; padding: 10px; display: inline-block;">${otp}</h1>
            <p>This code will expire in 30 minutes.</p>
            <br />
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <br />
            <p style="color: #555;">— AOD Solatricity Team</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('❌ Failed to send OTP email:', emailErr.response?.body || emailErr.message);
      // Optional: Roll back user creation or inform client explicitly
      return res.status(500).json({ success: false, msg: 'User created, but failed to send OTP. Please try resending.' });
    }

    return res.status(201).json({
      success: true,
      msg: 'Verify your account',
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, msg: 'User ID and OTP are required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, msg: 'User already verified.' });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      msg: 'User verified successfully, You can now log in.',
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    return res.status(500).json({ success: false, msg: 'Server error. Please try again.' });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: 'No account found with this email' });
    }

    // 2. Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ success: false, msg: 'Please verify your email before logging in' });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(403).json({ success: false, msg: 'Invalid credentials' });
    }

    // 4. Generate new token (always fresh)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // new token, new expiration
    );

    // 5. Update login status (optional)
    user.isLogin = true;
    await user.save();

    // 6. Respond with new token and user info
    return res.status(200).json({
      success: true,
      msg: 'User login successful',
      user: {
        id: user._id,
        name: user.name,
        token,
        isLogin: user.isLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, msg: 'Server error. Please try again later.' });
  }
};

export const Logout = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, msg: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    user.isLogin = false;
    await user.save();

    const data = {
      isLogin: false
    }

    res.status(200).json({ success: true, msg: 'User logged out successfully', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'An error occurred during logout' });
  }
};


export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if email is provided
    if (!email) {
      return res.status(400).json({ success: false, msg: 'Email is required.' });
    }

    // 2. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, msg: 'User is already verified.' });
    }

    // 3. Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // 4. Send OTP again
    await sendEmail({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'Resend OTP - AOD Solatricity',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333">AOD Solatricity - Resend OTP</h2>
          <p>Here is your new OTP to verify your email address:</p>
          <h1 style="background: #eee; padding: 10px; display: inline-block;">${otp}</h1>
          <p>This OTP will expire in 30 minutes.</p>
          <br />
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <br />
          <p style="color: #555;">— AOD Solatricity Team</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      msg: 'OTP resent successfully. Please check your email.',
    });

  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return res.status(500).json({ success: false, msg: 'Server error. Please try again later.' });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: 'No account found with this email' });
    }

    // 1. Generate a raw reset token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash it before saving to DB
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Save hashed token and expiry on the user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now
    await user.save();

    // 4. Send the raw token in the email (as part of the URL)
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`
    await sendEmail({
      to: user.email,
      from: process.env.FROM_EMAIL,
      subject: 'Reset Your Password - AOD Solatricity',
      html: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="text-align: center;">
            <img src="" alt="AOD Solatricity" style="width: 120px; margin-bottom: 20px;" />
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
          </div>
          <p style="font-size: 16px; color: #333;">
            Hello,<br />
            We received a request to reset your password for your AOD Solatricity account. Click the button below to set a new password. This link will expire in 15 minutes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1d72b8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #777;">
            If you didn’t request this, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 14px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} AOD Solatricity. All rights reserved.
          </p>
        </div>
      </div>
    `
    });

    return res.status(200).json({ success: true, msg: 'Password reset email sent.' });

  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, msg: 'Server error. Please try again later.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, msg: 'Token and new password are required.' });
    }

    // 1. Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find matching user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired token.' });
    }

    // 3. Check if new password is same as old one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ success: false, msg: 'You cannot use your previous password.' });
    }

    // 4. Set new password and clear reset fields
    user.password = newPassword; // Pre-save middleware hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, msg: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, msg: 'Server error. Please try again later.' });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find().select('-password -__v -otp -otpExpiry');

    res.status(200).json({
      success: true,
      msg: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    console.error('Error occurred:', error.message);
    res.status(500).json({
      success: false,
      msg: 'Server error. Please try again later.',
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -__v -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'You are not authorized to view this user.' });
    }


    // }
    res.status(200).json({
      success: true,
      msg: 'User found successfully',
      data: user,
    });

  } catch (error) {
    console.error('Error occurred:', error.message);
    res.status(500).json({
      success: false,
      msg: 'Server error. Please try again later.',
    });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // optional: userId to update
    const { name, phone, street, landmark } = req.body;

    // Determine target user: if admin, use `id`, else use logged-in user's ID
    const userIdToUpdate = req.user.role === 'admin' && id ? id : req.user._id;

    const user = await User.findById(userIdToUpdate);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (user.isLogin === false) {
      return res.status(400).json({ success: false, msg: 'User Must be logged in to update information' })
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.street = street || user.street;
    user.landmark = landmark || user.landmark;

    await user.save();

    return res.status(200).json({ success: true, msg: 'User updated successfully', data: user });
  } catch (error) {
    console.error('Update error:', error.message);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const findUser = await User.findById(id);
    if (!findUser) {
      return res.status(404).json({
        success: false,
        msg: 'This user does not exist and cannot be deleted',
      });
    }

    await User.findByIdAndDelete(id);
    await Review.deleteMany({ user: id });
    await Cart.deleteMany({ user: id });
    await Wishlist.deleteMany({ user: id });

    const users = await User.find().select('-password -__v -otp -otpExpiry');

    res.status(200).json({
      success: true,
      msg: 'User deleted successfully',
      data: users,
    });
  } catch (error) {
    console.error('Error Occurred:', error.message);
    res.status(500).json({ success: false, msg: 'An error occurred' });
  }
};

