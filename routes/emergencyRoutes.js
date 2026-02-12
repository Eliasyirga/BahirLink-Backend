const express = require("express");

const router = express.Router();

const emergencyController = require("../controllers/emergencyController");

router.post("/emergencies", emergencyController.createUserEmergency);

router.post("/emergencies", emergencyController.createGuestEmergency);

router.put("/:userOrGuestId/:id", emergencyController.updateEmergency);

router.delete("/:userOrGuestId/:id", emergencyController.deleteEmergency);

router.get("/:userOrGuestId", emergencyController.getEmergencies);

module.exports = router;
