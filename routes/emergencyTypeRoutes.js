const express = require("express");
const router = express.Router();
const emergencyTypeController = require("../controllers/emergencyTypeController");
const { verifyToken, adminOnly } = require("../middleware/auth");

// langMiddleware is applied in server.js via app.use("/api", langMiddleware)

router.get("/", emergencyTypeController.getAllEmergencyTypes);
router.post(
  "/",
  verifyToken,
  adminOnly,
  emergencyTypeController.createEmergencyType,
);
router.delete(
  "/:id",
  verifyToken,
  adminOnly,
  emergencyTypeController.deleteEmergencyType,
);

module.exports = router;
