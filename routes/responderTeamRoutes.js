const express = require("express");
const router = express.Router();
const {
  verifyToken,
  requireAccess,
  ADMIN_ROLES,
} = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const {
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler,
  responderLoginHandler,
  getTeamByIdHandler,
  getTeamsByAgencyTypeHandler,
} = require("../controllers/responderTeamController");

const teamManagers = requireAccess({
  userRoles: ADMIN_ROLES,
  types: ["agency"],
});

router.post("/login", loginLimiter(), responderLoginHandler);

// Reads stay public (model defaultScope strips password hashes).
router.get("/type", getTeamsByAgencyTypeHandler);
router.get("/", getAllTeamsHandler);
router.get("/agency/:agencyId", getTeamsByAgencyHandler);
router.get("/:id", getTeamByIdHandler);

// Create/delete: system admin or the owning agency (ownership in controller).
router.post("/", verifyToken, teamManagers, createTeamHandler);
router.delete("/:id", verifyToken, teamManagers, deleteTeamHandler);

// Update: system admin, owning agency, or the responder team itself
// (self-service: email/phone/password-with-oldPassword).
router.put(
  "/:id",
  verifyToken,
  requireAccess({ userRoles: ADMIN_ROLES, types: ["agency", "responder"] }),
  updateTeamHandler,
);

module.exports = router;
