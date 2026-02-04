import * as userService from "../services/userService.js";


export const register = async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "Registration successful. Verification code sent to your email.",
      user,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    await userService.verifyEmailCode(req.body.email, req.body.code);
    res.json({ success: true, message: "Email verified successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const login = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    if (result.mustChangePassword) {
      res.json({
        success: true,
        user: result.user,
        mustChangePassword: true,
        message: "You must change your temporary password after logging in.",
      });
    } else {
      res.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    await userService.forgotUserPassword(req.body.email);
    res.json({ success: true, message: "Temporary password sent to your email" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


export const changePassword = async (req, res) => {
  try {
    await userService.changeUserPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// -------------------- REFRESH TOKEN --------------------

export const refreshToken = async (req, res) => {
  try {
    const newAccessToken = await userService.refreshUserToken(req.body.token);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
