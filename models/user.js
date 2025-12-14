const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },

    // Optional fields
    firstName: String,
    lastName: String,
    fullName: String,
    phone: String,
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isNationalIDVerified: { type: Boolean, default: false },

    // Tokens
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: String, // "Remember me"
    googleId: String, // For Google OAuth

    // *** ADD THESE TWO FIELDS (IMPORTANT) ***
    verificationCode: { type: Number }, // numeric email code
    verificationCodeExpires: { type: Number }, // timestamp (ms)

    // Optional personal info
    nationalID: String,
    nationalIDImage: String,
    country: String,
    region: String,
    city: String,
    address: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },

    // User profile
    profileImage: String,
    bio: String,

    // System info
    lastLogin: Date,
    lastPasswordChange: Date,
    loginAttempts: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
