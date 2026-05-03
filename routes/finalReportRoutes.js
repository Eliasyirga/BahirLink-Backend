const express = require("express");
const router = express.Router();

// 1. Import the upload middleware
const upload = require("../middleware/upload");
const controller = require("../controllers/finalReportController");


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

router.get("/download/:emergencyId", controller.downloadPDFReport);


router.patch("/:emergencyId/verify", controller.verifyFinalReport);

router.patch("/:emergencyId/archive", controller.archiveFinalReport);

router.get("/:emergencyId", controller.getReportByEmergency);

router.get("/", controller.getAllReports);

module.exports = router;
