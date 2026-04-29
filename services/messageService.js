const Message = require("../models/Message");
const Emergency = require("../models/Emergency");
const User = require("../models/User");
const ResponderTeam = require("../models/ResponderTeam");

const assertCanAccessEmergencyChat = async (emergency, requester) => {
  if (!requester?.senderType || !requester?.senderId) {
    throw new Error("Unauthorized");
  }

  // Citizen can only access their own emergency chat.
  if (requester.senderType === "user") {
    if (!emergency.citizenId || Number(emergency.citizenId) !== Number(requester.senderId)) {
      throw new Error("You do not have access to this emergency chat.");
    }
    return;
  }

  // Responder team: allow access (optionally restrict by agency/kebele later).
  if (requester.senderType === "responderTeam") return;

  throw new Error("Invalid requester.");
};

/**
 * Responder-only: initialize chat thread (enables chat on emergency)
 */
const initChat = async ({ emergencyId, responderTeamId }) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found.");

  const responder = await ResponderTeam.findByPk(responderTeamId);
  if (!responder) throw new Error("Responder team not found.");

  if (!emergency.citizenId) {
    throw new Error("Emergency has no citizenId; cannot initialize citizen chat.");
  }

  if (!emergency.isChatEnabled) {
    await emergency.update({
      isChatEnabled: true,
      chatInitiatedByResponderTeamId: responderTeamId,
      chatInitiatedAt: new Date(),
    });
  }

  const citizen = await User.findByPk(emergency.citizenId, {
    attributes: ["id", "fullName", "email", "phone"],
  });

  return {
    emergencyId: emergency.id,
    isChatEnabled: emergency.isChatEnabled,
    citizen: citizen ? citizen.toJSON() : { id: emergency.citizenId },
    chatInitiatedByResponderTeamId: emergency.chatInitiatedByResponderTeamId,
    chatInitiatedAt: emergency.chatInitiatedAt,
  };
};

/**
 * Save message with emergency chat rules
 */
const saveMessage = async ({
  emergencyId,
  senderId,
  senderType,
  text = null,
  messageType = "text",
  audioUrl = null,
}) => {
  try {
    console.log("🔥 SAVE MESSAGE INPUT:", {
      emergencyId,
      senderId,
      senderType,
      text,
      messageType,
      audioUrl,
    });

    const emergency = await Emergency.findByPk(emergencyId);

    if (!emergency) {
      throw new Error("Emergency record not found.");
    }

    if (!emergency.citizenId) {
      throw new Error("Emergency has no citizenId; cannot start citizen chat.");
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

    // Validate payload (must contain text or audio)
    const cleanText = typeof text === "string" ? text.trim() : "";
    const cleanAudioUrl = typeof audioUrl === "string" ? audioUrl.trim() : "";
    if (!cleanText && !cleanAudioUrl) {
      throw new Error("Message must include text or audioUrl.");
    }

    if (cleanAudioUrl) {
      messageType = "audio";
    } else {
      messageType = "text";
    }

    // 🚨 BLOCK USER IF CHAT NOT ENABLED
    if (
      senderType === "user" &&
      !emergency.isChatEnabled
    ) {
      throw new Error("Chat not yet initiated by a responder.");
    }

    // 🚨 Ensure citizen can only chat on their own emergency
    if (senderType === "user") {
      if (!emergency.citizenId || Number(emergency.citizenId) !== Number(senderId)) {
        throw new Error("You do not have access to this emergency chat.");
      }
    }

    // 🚨 ENABLE CHAT ON FIRST RESPONDER MESSAGE
    if (senderType === "responderTeam" && !emergency.isChatEnabled) {
      await emergency.update({
        isChatEnabled: true,
        chatInitiatedByResponderTeamId: senderId,
        chatInitiatedAt: new Date(),
      });
      statusChanged = true;
    }

    // 💾 CREATE MESSAGE
    const message = await Message.create({
      emergencyId,
      citizenId: emergency.citizenId,
      responderTeamId:
        emergency.chatInitiatedByResponderTeamId ??
        (senderType === "responderTeam" ? senderId : null),
      senderId,
      senderType,
      messageType,
      text: cleanText || null,
      audioUrl: cleanAudioUrl || null,
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
const getHistory = async (emergencyId, { requester } = {}) => {
  try {
    const emergency = await Emergency.findByPk(emergencyId);
    if (!emergency) throw new Error("Emergency record not found.");
    await assertCanAccessEmergencyChat(emergency, requester);

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
  initChat,
  saveMessage,
  getHistory,
};
