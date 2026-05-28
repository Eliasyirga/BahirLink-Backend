const express = require("express");
const router = express.Router();
const caseReportsController = require("../controllers/caseReportsController");
const validator = require("../utils/validator");
const { phoneValidationSchema } = require("../utils/schema");

router.post("/", caseReportsController.createReport);

router.get("/", caseReportsController.getAllReports);

router.get("/case/:caseId", caseReportsController.getReportsByCase);

router.get("/type/:caseTypeId", caseReportsController.getReportsByCaseType);

router.get("/reporter/:reporterId", caseReportsController.getReportsByReporter);

router.patch("/status/:id", caseReportsController.updateReportStatus);

router.delete("/:id", caseReportsController.deleteReport);

module.exports = router;
