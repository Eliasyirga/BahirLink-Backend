const express = require("express");
const router = express.Router();
const caseReportsController = require("../controllers/caseReportsController");
const { verifyToken, staffOnly } = require("../middleware/auth");
const validator = require("../utils/validator");
const { caseReportCreateSchema } = require("../utils/schema");

// Public: citizens submit sightings from the app.
router.post(
  "/",
  validator(caseReportCreateSchema),
  caseReportsController.createReport,
);

// Reads: NOTE still public — the web CaseDetailPage fetches sightings without
// an Authorization header today. Should become staff-only once it does.
router.get("/", caseReportsController.getAllReports);
router.get("/case/:caseId", caseReportsController.getReportsByCase);
router.get("/type/:caseTypeId", caseReportsController.getReportsByCaseType);
router.get("/reporter/:reporterId", caseReportsController.getReportsByReporter);

// Staff only
router.patch(
  "/status/:id",
  verifyToken,
  staffOnly,
  caseReportsController.updateReportStatus,
);
router.delete("/:id", verifyToken, staffOnly, caseReportsController.deleteReport);

module.exports = router;
