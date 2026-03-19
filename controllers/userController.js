import * as userService from "../services/userService.js";

// REGISTER
export const register = async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message:
        user.role === "admin"
          ? "Admin registered successfully"
          : "Registration successful. Check your email for verification code.",
      user,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    await userService.verifyEmailCode(req.body.email, req.body.code);

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);

    // 🔥 Allow admin without verification
    if (!result.user.isEmailVerified && result.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        error: "Email not verified. Please verify first.",
      });
    }

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      mustChangePassword: result.mustChangePassword,
      user: result.user,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    await userService.forgotUserPassword(req.body.email);

    res.json({
      success: true,
      message: "Temporary password sent to email",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    await userService.changeUserPassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const accessToken = await userService.refreshUserToken(req.body.token);

    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
