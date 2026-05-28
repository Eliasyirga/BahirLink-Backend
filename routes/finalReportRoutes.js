const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const controller = require("../controllers/finalReportController");

// ✅ Specific routes FIRST
router.get("/", controller.getAllReports);
router.get("/download/:emergencyId", controller.downloadPDFReport); // ← must be before /:emergencyId

// Generic param routes AFTER
router.post(
  "/:emergencyId",
  upload.array("media"),
  controller.createFinalReport,
);
router.put(
  "/:emergencyId",
  upload.array("media"),
  controller.updateFinalReport,
);
router.get("/:emergencyId", controller.getReportByEmergency);
router.patch("/:emergencyId/verify", controller.verifyFinalReport);
router.patch("/:emergencyId/archive", controller.archiveFinalReport);

module.exports = router;
