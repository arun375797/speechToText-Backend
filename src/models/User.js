import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    name: { type: String, required: true },
    email: { 
      type: String, 
      unique: true, 
      sparse: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String,
      minlength: 6
    },
    picture: String,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOTP: String,
    emailVerificationExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP for email verification
userSchema.methods.generateEmailOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.emailVerificationOTP = otp;
  this.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP
userSchema.methods.verifyEmailOTP = function(otp) {
  if (!this.emailVerificationOTP || !this.emailVerificationExpires) {
    return false;
  }
  
  if (new Date() > this.emailVerificationExpires) {
    return false; // OTP expired
  }
  
  return this.emailVerificationOTP === otp;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
