const express = require("express");

const router = express.Router();

const guestController = require("../controllers/guestController");

router.post("/", guestController.createGuestController);

router.post("/:guestId/emergencies", guestController.createEmergency);

router.put("/:guestId/emergencies/:id", guestController.updateEmergency);

router.delete("/:guestId/emergencies/:id", guestController.deleteEmergency);

router.get("/:guestId/emergencies", guestController.getEmergencies);

module.exports = router;
