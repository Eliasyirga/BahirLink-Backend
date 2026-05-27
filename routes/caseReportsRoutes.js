const express = require("express");
const router = express.Router();
const caseReportsController = require("../controllers/caseReportsController");

// ── CREATE ────────────────────────────────────────────────────────────────────
// The controller will now extract phoneNumber from req.body and pass it to the service
router.post("/", caseReportsController.createReport);

// ── READ ──────────────────────────────────────────────────────────────────────
router.get("/", caseReportsController.getAllReports);
router.get("/case/:caseId", caseReportsController.getReportsByCase);
router.get("/type/:caseTypeId", caseReportsController.getReportsByCaseType);
router.get("/reporter/:reporterId", caseReportsController.getReportsByReporter);

// ── UPDATE ────────────────────────────────────────────────────────────────────
router.patch("/status/:id", caseReportsController.updateReportStatus);

// ── DELETE ────────────────────────────────────────────────────────────────────
router.delete("/:id", caseReportsController.deleteReport);

module.exports = router;
