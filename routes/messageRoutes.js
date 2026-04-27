const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth"); // Destructure the specific function

// Use verifyToken here
router.get(
  "/:emergencyId",
  verifyToken,
  messageController.getEmergencyMessages,
);
router.post("/", verifyToken, messageController.postMessage);

module.exports = router;
