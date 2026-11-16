const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const controller = require("../controllers/finalReportController");
const {
  verifyToken,
  staffOnly,
  requireAccess,
  ADMIN_ROLES,
} = require("../middleware/auth");

// Final reports contain witness/suspect details: every endpoint needs a
// staff token (admin/serviceadmin users, agency, responder, crew).
router.use(verifyToken, staffOnly);

// Writing a report: the responder team, its agency, or a system admin.
const reportWriters = requireAccess({
  userRoles: ADMIN_ROLES,
  types: ["responder", "agency"],
});
// Verifying / archiving: oversight by the agency or a system admin.
const reportReviewers = requireAccess({
  userRoles: ADMIN_ROLES,
  types: ["agency"],
});

// ✅ Specific routes FIRST
router.get("/", controller.getAllReports);
router.get("/download/:emergencyId", controller.downloadPDFReport); // ← must be before /:emergencyId

// Generic param routes AFTER
router.post(
  "/:emergencyId",
  reportWriters,
  upload.array("media"),
  controller.createFinalReport,
);
router.put(
  "/:emergencyId",
  reportWriters,
  upload.array("media"),
  controller.updateFinalReport,
);
router.get("/:emergencyId", controller.getReportByEmergency);
router.patch("/:emergencyId/verify", reportReviewers, controller.verifyFinalReport);
router.patch("/:emergencyId/archive", reportReviewers, controller.archiveFinalReport);

module.exports = router;
