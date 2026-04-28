const messageService = require("../services/messageService");
const { Emergency } = require("../models");

/**
 * GET /api/message/:emergencyId
 * Fetch chat history AND incident context (citizenId).
 */
exports.getEmergencyMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    // 1. Fetch the emergency record to get context (citizenId)
    // This prevents the "Internal Server Error" if the service fails to fetch
    const emergency = await Emergency.findByPk(emergencyId);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency incident record not found.",
      });
    }

    // 2. Fetch history from Service
    const messages = await messageService.getHistory(emergencyId);

    // 3. Return both messages AND emergency details
    // The ChatTab needs emergency.citizenId to function properly!
    res.status(200).json({
      success: true,
      emergency: {
        id: emergency.id,
        citizenId: emergency.citizenId,
        isChatEnabled: emergency.isChatEnabled,
      },
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("GET_MESSAGES_ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * POST /api/message
 * Fallback REST endpoint for sending messages.
 */
exports.postMessage = async (req, res) => {
  try {
    const { emergencyId, text } = req.body;

    // 1. Validate Authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User session missing.",
      });
    }

    // 2. Map role correctly for BahirLink logic
    const senderRole =
      req.user.role === "admin" || req.user.role === "responder"
        ? "responder"
        : "citizen";

    // 3. Save via Service
    const result = await messageService.saveMessage({
      emergencyId,
      senderId: req.user.id,
      senderRole,
      text,
    });

    res.status(201).json({
      success: true,
      data: result.message,
      chatActivated: result.statusChanged,
    });
  } catch (error) {
    // Catch-all for "Chat not yet initiated" or database errors
    console.error("POST_MESSAGE_ERROR:", error);
    res.status(error.message.includes("not yet initiated") ? 403 : 400).json({
      success: false,
      message: error.message,
    });
  }
};
