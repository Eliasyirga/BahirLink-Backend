const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
// const { verifyToken } = require("../middleware/auth"); 

// Use verifyToken here
router.get(
  "/:emergencyId",

  messageController.getEmergencyMessages,
);
router.post("/", messageController.postMessage);

module.exports = router;
