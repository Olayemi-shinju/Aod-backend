import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Authentication Middleware
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    next();
  } catch (error) {
    // 🔥 FIXED: was `res.send(401)` — should be `res.status(401)`
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role-Based Access Control Middleware
export const authorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
    }
    next();
  };
};

