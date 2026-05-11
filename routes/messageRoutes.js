const express = require("express");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { makeController } = require("../controllers/messageController");

/**
 * Factory — must be called with the Socket.IO `io` instance so the audio
 * upload endpoint can broadcast "chat:new" to the room after saving the file.
 *
 * Usage in app.js:
 *   app.use("/api/message", require("./routes/messageRoutes")(io));
 */
module.exports = (io) => {
  const router = express.Router();
  const ctrl = makeController(io);

  router.get("/:emergencyId", verifyToken, ctrl.getEmergencyMessages);
  router.post("/init",        verifyToken, ctrl.initEmergencyChat);
  router.post("/",            verifyToken, ctrl.postMessage);
  router.post(
    "/audio",
    verifyToken,
    upload.single("audio"),
    ctrl.postAudioMessage,
  );

  return router;
};