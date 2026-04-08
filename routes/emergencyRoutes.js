const express = require("express");
const router = express.Router();

const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

router.post(
  "/users",
  upload.single("media"),
  emergencyController.createUserEmergencyHandler,
);

router.post(
  "/guests",
  upload.single("media"),
  emergencyController.createGuestEmergencyHandler,
);

router.put(
  "/:userOrGuestId/:id",
  upload.single("media"),
  emergencyController.updateEmergencyHandler,
);

router.delete(
  "/:userOrGuestId/:id",
  emergencyController.deleteEmergencyHandler,
);

router.get("/:userOrGuestId", emergencyController.getEmergenciesHandler);

router.get(
  "/responder-team/:responderTeamId",
  emergencyController.getEmergenciesForResponderTeamHandler,
);

router.get(
  "/agency/:agencyId/emergencies",
  emergencyController.getEmergenciesByAgencyHandler,
);

// Get all emergencies for admin
router.get("/admin/all", emergencyController.getAllEmergenciesAdmin);

module.exports = router;
