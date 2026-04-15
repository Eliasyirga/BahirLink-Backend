const express = require("express");
const router = express.Router();
const caseReportsController = require("../controllers/caseReportsController");

// ✅ Create a new report
router.post("/", caseReportsController.createReport);

// ✅ Get all reports
router.get("/", caseReportsController.getAllReports);

// ✅ Specific filtering routes (Changed to unique paths)
router.get("/case/:caseId", caseReportsController.getReportsByCase);

router.get("/type/:caseTypeId", caseReportsController.getReportsByCaseType);

router.get("/reporter/:reporterId", caseReportsController.getReportsByReporter);

// ✅ Status update and deletion
router.patch("/status/:id", caseReportsController.updateReportStatus);

router.delete("/:id", caseReportsController.deleteReport);

module.exports = router;
