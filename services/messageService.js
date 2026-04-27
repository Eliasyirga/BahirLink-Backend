const Message = require("../models/Message");
const Emergency = require("../models/Emergency");

class MessageService {
  /**
   * Saves a message and handles the "Responder-First" activation logic.
   */
  async saveMessage({ emergencyId, senderId, senderRole, text }) {
    const emergency = await Emergency.findByPk(emergencyId);

    if (!emergency) {
      throw new Error("Emergency record not found.");
    }

    // 1. Logic: Block citizen if chat isn't enabled by responder yet
    if (senderRole === "citizen" && !emergency.isChatEnabled) {
      throw new Error("Chat not yet initiated by a responder.");
    }

    // 2. Logic: If responder sends a message, activate the chat for the user
    let statusChanged = false;
    if (senderRole === "responder" && !emergency.isChatEnabled) {
      await emergency.update({ isChatEnabled: true });
      statusChanged = true;
    }

    // 3. Create the message
    const message = await Message.create({
      emergencyId,
      senderId,
      senderRole,
      text,
    });

    // Return statusChanged so the controller/socket knows whether to alert the Flutter app
    return { message, statusChanged };
  }

  /**
   * Fetches history.
   * RENAMED to getHistory to match what your Controller is calling.
   */
  async getHistory(emergencyId) {
    return await Message.findAll({
      where: { emergencyId },
      order: [["createdAt", "ASC"]],
      // Include timestamps to show message time in Flutter/React
    });
  }
}

module.exports = new MessageService();
