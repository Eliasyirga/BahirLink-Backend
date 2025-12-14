const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const userController = require("../controllers/userController");

// -------------------- AUTH ROUTES --------------------
// Registration & login
router.post("/register", userController.register);
router.post("/login", userController.login);

// Email verification
router.post("/verify-email-code", userController.verifyEmailCode);

// Forgot password (temporary password)
router.post("/forgot-password", userController.forgotPassword);

// Change password (after login with temporary password)
router.post("/change-password", verifyToken, userController.changePassword);

// -------------------- PROTECTED PROFILE ROUTES --------------------
router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);

// -------------------- TOKEN ROUTE --------------------
router.post("/refresh-token", userController.refreshToken);

module.exports = router;
