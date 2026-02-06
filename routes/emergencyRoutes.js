const express = require("express");

const router = express.Router();

const emergencyController = require("../controllers/emergencyController");

router.post("/users/:userId", emergencyController.createUserEmergency);

router.post("/guests/:guestId", emergencyController.createGuestEmergency);

router.put("/:userOrGuestId/:id", emergencyController.updateEmergency);

router.delete("/:userOrGuestId/:id", emergencyController.deleteEmergency);

router.get("/:userOrGuestId", emergencyController.getEmergencies);

module.exports = router;
