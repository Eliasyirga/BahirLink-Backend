const express = require("express");
const router = express.Router();
const emergencyTypeController = require("../controllers/emergencyTypeController");

// No need for langMiddleware here anymore! 
// It is already applied in server.js via app.use("/api", langMiddleware)

router.get("/", emergencyTypeController.getAllEmergencyTypes);
router.post("/", emergencyTypeController.createEmergencyType);
router.delete("/:id", emergencyTypeController.deleteEmergencyType);

module.exports = router;