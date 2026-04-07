const express = require("express");
const router = express.Router();

const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

// ================= USER EMERGENCY =================

// Create user emergency (with optional media)
router.post(
  "/users",
  upload.single("media"),
  emergencyController.createUserEmergencyHandler,
);

// ================= GUEST EMERGENCY =================

// Create guest emergency (with optional media)
router.post(
  "/guests",
  upload.single("media"),
  emergencyController.createGuestEmergencyHandler,
);

// ================= UPDATE =================

// Allow media update too
router.put(
  "/:userOrGuestId/:id",
  upload.single("media"),
  emergencyController.updateEmergencyHandler,
);

// ================= DELETE =================

router.delete(
  "/:userOrGuestId/:id",
  emergencyController.deleteEmergencyHandler,
);

// ================= GET =================

// Get all emergencies for user or guest
router.get("/:userOrGuestId", emergencyController.getEmergenciesHandler);

// Get emergencies for a responder team
router.get(
  "/responder-team/:responderTeamId",
  emergencyController.getEmergenciesForResponderTeamHandler,
);

// Get emergencies for an agency
router.get(
  "/agency/:agencyId/emergencies",
  emergencyController.getEmergenciesByAgencyHandler,
);

<<<<<<< HEAD
=======
router.get("/admin/all", emergencyController.getAllEmergenciesAdmin);
>>>>>>> e77750a6864618574d8a83a5ab69f563b3a7b234
module.exports = router;
