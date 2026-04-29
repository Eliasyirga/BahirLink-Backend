const messageService = require("../services/messageService");

const resolveSenderFromToken = (req) => {
  // Some parts of the backend generate JWT without role (id-only).
  // For chat, id-only tokens are treated as normal `User` tokens.
  const role = req.user?.role;
  if (!req.user?.id) return null;

  // Responder dashboard tokens are issued for `ResponderTeam` with role: "responder"
  if (role === "responder") {
    return { senderId: req.user.id, senderType: "responderTeam" };
  }

  // Citizen/admin tokens are issued for `User`
  return { senderId: req.user.id, senderType: "user" };
};

/**
 * POST /api/message
 * Send a message
 */
const postMessage = async (req, res) => {
  try {
    const { emergencyId, text, audioUrl } = req.body;
    const sender = resolveSenderFromToken(req);

    if (!sender) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!emergencyId || (!text && !audioUrl)) {
      return res.status(400).json({
        success: false,
        message: "emergencyId and (text or audioUrl) are required",
      });
    }

    const result = await messageService.saveMessage({
      emergencyId,
      senderId: sender.senderId,
      senderType: sender.senderType,
      text: text ?? null,
      audioUrl: audioUrl ?? null,
    });

    return res.status(201).json({
      success: true,
      data: result.message,
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
      return res
        .status(400)
        .json({ success: false, message: "emergencyId is required" });
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

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * POST /api/message/audio
 * Upload audio and send as a chat message
 * Form-data:
 * - emergencyId (number)
 * - audio (file)
 */
const postAudioMessage = async (req, res) => {
  try {
    const sender = resolveSenderFromToken(req);
    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { emergencyId } = req.body;
    if (!emergencyId) {
      return res
        .status(400)
        .json({ success: false, message: "emergencyId is required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "audio file is required" });
    }

    // Served by server.js: app.use("/uploads", express.static("public/uploads"))
    const audioUrl = `/uploads/${req.file.filename}`;

    const result = await messageService.saveMessage({
      emergencyId,
      senderId: sender.senderId,
      senderType: sender.senderType,
      audioUrl,
      text: null,
      messageType: "audio",
    });

    return res.status(201).json({
      success: true,
      data: result.message,
      statusChanged: result.statusChanged,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = {
  postMessage,
  getEmergencyMessages,
  initEmergencyChat,
  postAudioMessage,
};
