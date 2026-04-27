const messageService = require("../services/messageService");

/**
 * GET /api/message/:emergencyId
 * Fetch chat history for a specific emergency incident.
 */
exports.getEmergencyMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    // Calls getHistory from MessageService
    const messages = await messageService.getHistory(emergencyId);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/message
 * Fallback REST endpoint for sending messages.
 */
exports.postMessage = async (req, res) => {
  try {
    const { emergencyId, text, senderRole } = req.body;

    // Safety check: ensure auth middleware has populated req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User ID not found.",
      });
    }

    const senderId = req.user.id;

    const result = await messageService.saveMessage({
      emergencyId,
      senderId,
      senderRole,
      text,
    });

    res.status(201).json({
      success: true,
      data: result.message,
      // Useful for front-end to know if the UI should now be unlocked
      chatActivated: result.statusChanged,
    });
  } catch (error) {
    // This will catch the "Chat not yet initiated" error from the Service
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
