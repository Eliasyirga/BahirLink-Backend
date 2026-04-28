const messageService = require("../services/messageService");

/**
 * POST /api/message
 * Send a message
 */
const postMessage = async (req, res) => {
  try {
    const { emergencyId, text, senderId, senderType } = req.body;

    if (!emergencyId || !text || !senderId || !senderType) {
      return res.status(400).json({
        success: false,
        message: "emergencyId, text, senderId, senderType are required",
      });
    }

    const result = await messageService.saveMessage({
      emergencyId,
      senderId,
      senderType,
      text,
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
 * GET /api/message/:emergencyId
 * Get chat history
 */
const getEmergencyMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const messages = await messageService.getHistory(emergencyId);

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

module.exports = {
  postMessage,
  getEmergencyMessages,
};
