const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const safeUpload = require("../middleware/safeUpload");
const casesController = require("../controllers/casesController");
const {
  verifyToken,
  requireAccess,
  adminOnly,
  ADMIN_ROLES,
} = require("../middleware/auth");

// Responder teams file/manage cases; agencies and system admins too.
const caseManagers = requireAccess({
  userRoles: ADMIN_ROLES,
  types: ["responder", "agency"],
});

// Public reads (citizen app shows missing/wanted cases)
router.get("/", casesController.getAllCases);
router.get("/team/:responderTeamId", casesController.getCasesByResponderTeam);
router.get("/:id", casesController.getCaseById);

router.post(
  "/",
  verifyToken,
  caseManagers,
  safeUpload(upload.single("media"), { maxMb: 25 }),
  casesController.createCase,
);
router.put("/:id/status", verifyToken, caseManagers, casesController.updateCaseStatus);
router.delete("/:id", verifyToken, caseManagers, casesController.deleteCase);

// One-off maintenance endpoint (previously unrouted)
router.post(
  "/backfill-translations",
  verifyToken,
  adminOnly,
  casesController.backfillTranslations,
);

module.exports = router;
