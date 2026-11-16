const express = require("express");
const router = express.Router();
const {
  verifyToken,
  requireType,
  requireAccess,
  adminOnly,
  ADMIN_ROLES,
} = require("../middleware/auth");
const {
  loginLimiter,
  registerLimiter,
  verifyCodeLimiter,
  forgotPasswordLimiter,
  refreshTokenLimiter,
} = require("../middleware/rateLimit");
const userController = require("../controllers/userController");

// ── Public (rate limited) ─────────────────────────────────
router.post("/register", registerLimiter, userController.register);
router.post("/login", loginLimiter(), userController.login);
router.post("/verify-email-code", verifyCodeLimiter, userController.verifyEmail);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  userController.forgotPassword,
);
router.post(
  "/refresh-token",
  refreshTokenLimiter,
  userController.refreshToken,
);

// ── Own account (users only) ──────────────────────────────
router.post(
  "/change-password",
  verifyToken,
  requireType("user"),
  userController.changePassword,
);
router.get("/profile", verifyToken, requireType("user"), userController.getProfile);
router.put(
  "/profile",
  verifyToken,
  requireType("user"),
  userController.updateProfile,
);

// ── Admin ─────────────────────────────────────────────────
router.get("/all", verifyToken, adminOnly, userController.getAllUsers);

// ── Staff lookup — keep AFTER fixed paths so it can't shadow them ──
// admin/serviceadmin users, agency, responder
router.get(
  "/:id(\\d+)",
  verifyToken,
  requireAccess({ userRoles: ADMIN_ROLES, types: ["agency", "responder"] }),
  userController.getUserById,
);

module.exports = router;
