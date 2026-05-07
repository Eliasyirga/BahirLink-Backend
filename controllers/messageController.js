/**
 * messageController.js  — FIXED
 *
 * Key fix: postAudioMessage now accepts the `io` instance (injected via the
 * factory exported at the bottom) so it can broadcast the saved message to
 * the emergency room after a successful REST upload.  This is the missing
 * link that caused audio messages to never appear on other clients, and
 * required the Flutter side to emit a redundant chat:send which created
 * duplicate DB rows.
 *
 * Usage in messageRoutes.js:
 *   const { makeController } = require("../controllers/messageController");
 *   // inject io when the routes are registered
 *   router.post("/audio", verifyToken, upload.single("audio"), makeController(io).postAudioMessage);
 *
 * Or if you prefer a simpler approach, pass io at require-time:
 *   const controller = require("../controllers/messageController")(io);
 */

const messageService = require("../services/messageService");

const resolveSenderFromToken = (req) => {
  const role = req.user?.role;
  if (!req.user?.id) return null;
  if (role === "responder") {
    return { senderId: req.user.id, senderType: "responderTeam" };
  }
  return { senderId: req.user.id, senderType: "user" };
};

/**
 * POST /api/message
 * Send a text message (used as REST fallback; text chat normally goes via socket)
 */
const postMessage = async (req, res) => {
  try {
    const { emergencyId, text, audioUrl } = req.body;
    const sender = resolveSenderFromToken(req);

    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!emergencyId || (!text && !audioUrl)) {
      return res.status(400).json({
        success: false,
        message: "emergencyId and (text or audioUrl) are required",
      });
    }

    const result = await messageService.saveMessage({
      emergencyId,
      senderId:   sender.senderId,
      senderType: sender.senderType,
      text:       text    ?? null,
      audioUrl:   audioUrl ?? null,
    });

    return res.status(201).json({
      success: true,
      data:          result.message,
      statusChanged: result.statusChanged,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

/**
 * POST /api/message/init
 * Responder-only: initialize chat for an emergencyId
 */
const initEmergencyChat = async (req, res) => {
  try {
    const sender = resolveSenderFromToken(req);
    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (sender.senderType !== "responderTeam") {
      return res.status(403).json({
        success: false,
        message: "Only responders can initialize chat",
      });
    }

    const { emergencyId } = req.body;
    if (!emergencyId) {
      return res.status(400).json({ success: false, message: "emergencyId is required" });
    }

    const data = await messageService.initChat({
      emergencyId,
      responderTeamId: sender.senderId,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

/**
 * GET /api/message/:emergencyId
 * Get chat history
 */
const getEmergencyMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const sender = resolveSenderFromToken(req);
    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const messages = await messageService.getHistory(emergencyId, {
      requester: sender,
    });

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * POST /api/message/audio
 * Upload audio file and persist as a chat message.
 *
 * After saving, broadcasts the new message to the socket room so all other
 * participants see it in real-time.  The uploader's Flutter client adds the
 * message locally (and registers its dedup key) BEFORE this broadcast fires,
 * so the echo is silently dropped on their side — no duplicate bubble.
 *
 * @param {import("socket.io").Server} io  — injected by makeController()
 */
const makePostAudioMessage = (io) => async (req, res) => {
  try {
    const sender = resolveSenderFromToken(req);
    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { emergencyId } = req.body;
    if (!emergencyId) {
      return res.status(400).json({ success: false, message: "emergencyId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "audio file is required" });
    }

    // URL served by: app.use("/uploads", express.static("public/uploads"))
    const audioUrl = `/uploads/${req.file.filename}`;

    const result = await messageService.saveMessage({
      emergencyId,
      senderId:    sender.senderId,
      senderType:  sender.senderType,
      audioUrl,
      text:        null,
      messageType: "audio",
    });

    const savedMessage = result.message;

    // ✅ Broadcast to room so OTHER clients see the audio message.
    //    The sender's Flutter client deduplicates via _seenMsgKeys and ignores
    //    this echo — no duplicate bubble on sender's screen.
    const roomName = `emergency_${emergencyId}`;
    if (io) {
      io.to(roomName).emit("chat:new",         savedMessage);
      io.to(roomName).emit("receive_message",  savedMessage); // legacy compat
    }

    return res.status(201).json({
      success: true,
      data:          savedMessage,
      statusChanged: result.statusChanged,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

/**
 * Factory — call this with the Socket.IO server instance.
 *
 *   const { makeController } = require("../controllers/messageController");
 *   const ctrl = makeController(io);
 *   router.post("/audio", verifyToken, upload.single("audio"), ctrl.postAudioMessage);
 */
const makeController = (io) => ({
  postMessage,
  getEmergencyMessages,
  initEmergencyChat,
  postAudioMessage: makePostAudioMessage(io),
});

module.exports = {
  postMessage,
  getEmergencyMessages,
  initEmergencyChat,
  // Legacy export — no socket broadcast (use makeController instead)
  postAudioMessage: makePostAudioMessage(null),
  makeController,
};