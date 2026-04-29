const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get(
  "/:emergencyId",
  verifyToken,
  messageController.getEmergencyMessages,
);
router.post("/init", verifyToken, messageController.initEmergencyChat);
router.post("/", verifyToken, messageController.postMessage);
router.post(
  "/audio",
  verifyToken,
  upload.single("audio"),
  messageController.postAudioMessage,
);

module.exports = router;
