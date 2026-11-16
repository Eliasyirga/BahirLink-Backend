const userService = require("../services/userService");

const statusOf = (err, fallback = 400) => err.statusCode || fallback;

// ✅ REGISTER — `role` in the body is ignored; self-registration is always "user".
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body || {};
    const user = await userService.registerUser({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Check your email for verification code.",
      user,
    });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ VERIFY EMAIL
const verifyEmail = async (req, res) => {
  try {
    await userService.verifyEmailCode(req.body?.email, req.body?.code);

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ LOGIN
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    const result = await userService.loginUser({ email, password, rememberMe });

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      mustChangePassword: result.mustChangePassword,
      user: result.user,
    });
  } catch (err) {
    if (!err.statusCode) console.error("LOGIN ERROR:", err);
    res.status(statusOf(err)).json({
      success: false,
      error: err.statusCode ? err.message : "Invalid email or password",
    });
  }
};

// ✅ PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ GET USER BY ID (staff only — enforced in the router)
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, user, data: user });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ FORGOT PASSWORD — identical response whether or not the email exists.
const forgotPassword = async (req, res) => {
  try {
    await userService.forgotUserPassword(req.body?.email);
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err && err.message);
  }
  res.json({
    success: true,
    message: "Temporary password sent to email",
  });
};

// ✅ CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    await userService.changeUserPassword(
      req.user.id,
      req.body?.currentPassword,
      req.body?.newPassword,
      { viaTempLogin: req.user.pwdReset === true, pwdNonce: req.user.pwdNonce },
    );
    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ REFRESH TOKEN
const refreshToken = async (req, res) => {
  try {
    const accessToken = await userService.refreshUserToken(
      req.body?.token || req.body?.refreshToken,
    );
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

// ✅ GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(statusOf(err)).json({ success: false, error: err.message });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  getProfile,
  getUserById,
  updateProfile,
  forgotPassword,
  changePassword,
  refreshToken,
  getAllUsers,
};
