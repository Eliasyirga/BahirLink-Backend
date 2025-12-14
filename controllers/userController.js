const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const sendEmail = require("../utils/sendEmail");
const { verificationEmail, temporaryPasswordEmail } = require("../utils/emailTemplates"); // updated template file

// -------------------- REGISTER --------------------
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    const verificationCode = Math.floor(1000 + Math.random() * 9000);

    const user = await User.create({
      firstName,
      lastName,
      fullName,
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000,
      isEmailVerified: false,
    });

    await sendEmail(
      email,
      "Welcome to BahirLink! Verify Your Email",
      verificationEmail(fullName, verificationCode)
    );

    res.status(201).json({
      success: true,
      message: "Registration successful. Verification code sent to your email.",
      user: { id: user._id, name: fullName, email },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- VERIFY EMAIL --------------------
exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode))
      return res.status(400).json({ success: false, error: "Invalid verification code" });

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationCode: numericCode,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, error: "Invalid or expired verification code" });

    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({ success: true, message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: "Invalid password" });

    // If user has temporary password, prompt to change
    if (user.mustChangePassword) {
      return res.json({
        success: true,
        user: { id: user._id, email: user.email, name: user.fullName },
        mustChangePassword: true,
        message: "You must change your temporary password after logging in.",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = rememberMe ? generateRefreshToken(user._id) : null;
    if (refreshToken) user.refreshToken = refreshToken;

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.fullName },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- GET PROFILE --------------------
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "firstName lastName fullName email phone gender dateOfBirth country city address"
    );

    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- UPDATE PROFILE --------------------
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    if (updates.firstName || updates.lastName)
      updates.fullName = `${updates.firstName || ""} ${updates.lastName || ""}`.trim();

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select(
      "-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- FORGOT PASSWORD (Temporary Password) --------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedTempPassword;
    user.mustChangePassword = true;
    await user.save();

    await sendEmail(user.email, "Your Temporary Password for BahirLink", temporaryPasswordEmail(tempPassword));

    res.json({ success: true, message: "Temporary password sent to your email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- CHANGE PASSWORD --------------------
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -------------------- REFRESH TOKEN --------------------
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ success: false, error: "No token provided" });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ success: false, error: "Invalid token" });

      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== token)
        return res.status(401).json({ success: false, error: "Invalid session" });

      const newAccessToken = generateAccessToken(user._id);
      res.json({ success: true, accessToken: newAccessToken });
    });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
