const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const { verifyToken, adminOnly } = require("../middleware/auth");

// Public: register a guest contact and report as a guest.
router.post("/", guestController.createGuestController);
router.post("/:guestId/emergencies", guestController.createEmergency);

// Guests have no credentials, so reading / changing a guest's reports by a
// bare guestId would be an open, enumerable endpoint. Restricted to system
// admins (no current client calls these).
router.get(
  "/:guestId/emergencies",
  verifyToken,
  adminOnly,
  guestController.getEmergencies,
);
router.put(
  "/:guestId/emergencies/:id",
  verifyToken,
  adminOnly,
  guestController.updateEmergency,
);
router.delete(
  "/:guestId/emergencies/:id",
  verifyToken,
  adminOnly,
  guestController.deleteEmergency,
);

module.exports = router;
