const Message = require("../models/Message");
const Emergency = require("../models/Emergency");
const User = require("../models/User");
const ResponderTeam = require("../models/ResponderTeam");

/**
 * Save message with emergency chat rules
 */
const saveMessage = async ({ emergencyId, senderId, senderType, text }) => {
  try {
    console.log("🔥 SAVE MESSAGE INPUT:", {
      emergencyId,
      senderId,
      senderType,
      text,
    });

    const emergency = await Emergency.findByPk(emergencyId);

    if (!emergency) {
      throw new Error("Emergency record not found.");
    }

    let sender = null;

    // 🔥 resolve sender safely
    if (senderType === "user") {
      sender = await User.findByPk(senderId);
    } else if (senderType === "responderTeam") {
      sender = await ResponderTeam.findByPk(senderId);
    } else {
      throw new Error("Invalid senderType provided.");
    }

    if (!sender) {
      throw new Error(`Sender not found in ${senderType} table.`);
    }

    let statusChanged = false;

    // 🚨 BLOCK USER IF CHAT NOT ENABLED
    if (
      senderType === "user" &&
      sender.role === "citizen" &&
      !emergency.isChatEnabled
    ) {
      throw new Error("Chat not yet initiated by a responder.");
    }

    // 🚨 ENABLE CHAT ON FIRST RESPONDER MESSAGE
    if (senderType === "responderTeam" && !emergency.isChatEnabled) {
      await emergency.update({ isChatEnabled: true });
      statusChanged = true;
    }

    // 💾 CREATE MESSAGE
    const message = await Message.create({
      emergencyId,
      senderId,
      senderType,
      text,
    });

    console.log("✅ MESSAGE SAVED:", message.id);

    return { message, statusChanged };
  } catch (error) {
    console.error("❌ SERVICE ERROR:", error);
    throw error;
  }
};

/**
 * Get chat history
 */
const getHistory = async (emergencyId) => {
  try {
    const messages = await Message.findAll({
      where: { emergencyId },
      order: [["createdAt", "ASC"]],
    });

    console.log(`📩 Loaded ${messages.length} messages`);

    return messages;
  } catch (error) {
    console.error("❌ HISTORY ERROR:", error);
    throw error;
  }
};

module.exports = {
  saveMessage,
  getHistory,
};
