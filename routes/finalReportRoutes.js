// routes/finalReport.routes.js

const express = require("express");
const router = express.Router();

const controller = require("../controllers/finalReportController");

// CREATE
router.post("/:emergencyId", controller.createFinalReport);

// UPDATE
router.put("/:emergencyId", controller.updateFinalReport);

// VERIFY
router.patch("/:emergencyId/verify", controller.verifyFinalReport);

// ARCHIVE
router.patch("/:emergencyId/archive", controller.archiveFinalReport);

// GET ONE
router.get("/:emergencyId", controller.getFinalReportByEmergency);

// GET ALL
router.get("/", controller.getAllFinalReports);

module.exports = router;
