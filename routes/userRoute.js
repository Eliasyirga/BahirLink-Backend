const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.post("/login", userController.login);

router.post("/verify-email-code", userController.verifyEmail);

router.post("/forgot-password", userController.forgotPassword);

router.post("/change-password", verifyToken, userController.changePassword);

router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);

// -------------------- TOKEN ROUTE --------------------
router.post("/refresh-token", userController.refreshToken);

router.get("/all", verifyToken, userController.getAllUsers);

module.exports = router;
