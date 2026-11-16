const express = require("express");
const { verifyToken, requireType } = require("../middleware/auth");
const { audioUpload, AUDIO_FORMATS, AUDIO_MAX_MB } = require("../middleware/audioUpload");
const safeUpload = require("../middleware/safeUpload");
const { makeController } = require("../controllers/messageController");

const audioUploadSafe = safeUpload(audioUpload.single("audio"), {
  maxMb: AUDIO_MAX_MB,
  invalidMessage: `Unsupported or invalid audio file. Allowed formats: ${AUDIO_FORMATS.join(", ")} (max ${AUDIO_MAX_MB} MB).`,
});

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

  // Chat participants: citizens (type "user") and responder teams.
  const participant = [verifyToken, requireType("user", "responder")];

  router.get("/:emergencyId", ...participant, ctrl.getEmergencyMessages);
  router.post("/init",        ...participant, ctrl.initEmergencyChat);
  router.post("/",            ...participant, ctrl.postMessage);
  router.post(
    "/audio",
    ...participant,
    audioUploadSafe,
    ctrl.postAudioMessage,
  );

  return router;
};