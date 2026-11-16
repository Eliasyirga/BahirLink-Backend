const express = require("express");
const router = express.Router();
const {
  verifyToken,
  adminOnly,
  staffOnly,
  requireAccess,
  ADMIN_ROLES,
} = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler,
  loginAgencyHandler,
  getAgentsByCreatorIdHandler,
  getAgencyByIdHandler,
} = require("../controllers/agencyController");

// ── Public ────────────────────────────────────────────────
router.post("/agent-login", loginLimiter(), loginAgencyHandler);

// ── System admin (admin / serviceadmin users) ─────────────
router.get("/", verifyToken, adminOnly, getAllAgenciesHandler);
router.post("/", verifyToken, adminOnly, createAgencyHandler);
router.delete("/:id", verifyToken, adminOnly, deleteAgencyHandler);
router.get("/my-agents", verifyToken, adminOnly, getAgentsByCreatorIdHandler);

// Update: system admin, or an agency editing ITS OWN record (self-service
// email/phone/location/password-with-oldPassword; enforced in the controller).
router.put(
  "/:id",
  verifyToken,
  requireAccess({ userRoles: ADMIN_ROLES, types: ["agency"] }),
  updateAgencyHandler,
);

// Read one agency: any staff account (responder dashboards read their agency).
router.get("/:id", verifyToken, staffOnly, getAgencyByIdHandler);

module.exports = router;
