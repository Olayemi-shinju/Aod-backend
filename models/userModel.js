import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = mongoose.Schema;

const userSchema = new schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  street: {type: String},
  landmark: {type: String},
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    required: true,
  },
  isVerified: { type: Boolean, default: false },
  isLogin: {type: Boolean, default: false},
  otp: String,
  otpExpiry: Date,
  resetPasswordToken: String,           // ✅ New field
  resetPasswordExpires: Date,           // ✅ New field
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});


// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10); // Fixed typo: "hast" → "hash"
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
