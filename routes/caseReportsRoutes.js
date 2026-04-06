const express = require("express");
const router = express.Router();
const caseReportsController = require("../controllers/caseReportsController");

router.post("/", caseReportsController.createReport);

router.get("/", caseReportsController.getAllReports);

router.get("/:caseId", caseReportsController.getReportsByCase);

router.get("/:caseTypeId", caseReportsController.getReportsByCaseType);

router.get("/:reporterId", caseReportsController.getReportsByReporter);

router.patch("/:id/status", caseReportsController.updateReportStatus);

router.delete("/:id", caseReportsController.deleteReport);

module.exports = router;
