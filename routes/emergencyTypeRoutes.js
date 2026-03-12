const express = require("express");
const router = express.Router();
const emergencyTypeController = require("../controllers/emergencyTypeController");

router.post("/", emergencyTypeController.createEmergencyType);

router.get("/", emergencyTypeController.getAllEmergencyTypes);

router.delete("/:id", emergencyTypeController.deleteEmergencyType);

module.exports = router;
