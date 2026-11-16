const express = require("express");
const router = express.Router();
const {
  verifyToken,
  requireAccess,
  ADMIN_ROLES,
} = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const {
  createCrewHandler,
  updateCrewHandler,
  deleteCrewHandler,
  loginCrewHandler,
} = require("../controllers/crewController");

// Who manages crew: system admins, agencies (their teams), responder teams (own).
const crewManagers = requireAccess({
  userRoles: ADMIN_ROLES,
  types: ["agency", "responder"],
});

router.post("/login", loginLimiter(), loginCrewHandler);

router.post("/", verifyToken, crewManagers, createCrewHandler);

// Crew members may also update their own profile (checked in controller).
router.put(
  "/:id",
  verifyToken,
  requireAccess({ userRoles: ADMIN_ROLES, types: ["agency", "responder", "crew"] }),
  updateCrewHandler,
);

router.delete("/:id", verifyToken, crewManagers, deleteCrewHandler);

module.exports = router;
