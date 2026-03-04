const express = require("express");
const router = express.Router();

const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

// ================= USER EMERGENCY =================

// Create user emergency (with optional media)
router.post(
  "/users/:userId/emergencies",
  upload.single("media"),
  emergencyController.createUserEmergency,
);

// ================= GUEST EMERGENCY =================

// Create guest emergency (with optional media)
router.post(
  "/guests/emergencies",
  upload.single("media"),
  emergencyController.createGuestEmergency,
);

// ================= UPDATE =================

// Allow media update too
router.put(
  "/:userOrGuestId/:id",
  upload.single("media"),
  emergencyController.updateEmergency,
);

// ================= DELETE =================

router.delete("/:userOrGuestId/:id", emergencyController.deleteEmergency);

// ================= GET =================

// Get all emergencies for user or guest
router.get("/:userOrGuestId", emergencyController.getEmergencies);

module.exports = router;
