const Message       = require("../models/Message");
const Emergency     = require("../models/Emergency");
const User          = require("../models/User");
const ResponderTeam = require("../models/ResponderTeam");

// ─── Access guard ─────────────────────────────────────────────────────────────
const assertCanAccessEmergencyChat = async (emergency, requester) => {
  if (!requester?.senderType || !requester?.senderId) {
    throw new Error("Unauthorized");
  }

  if (requester.senderType === "user") {
    if (
      !emergency.citizenId ||
      Number(emergency.citizenId) !== Number(requester.senderId)
    ) {
      throw new Error("You do not have access to this emergency chat.");
    }
    return;
  }

  if (requester.senderType === "responderTeam") return;

  throw new Error("Invalid requester.");
};

// ─── initChat ────────────────────────────────────────────────────────────────
/**
 * Responder-only: mark an emergency chat as enabled.
 * Returns all data needed for the caller to emit "chat:enabled" via socket.
 */
const initChat = async ({ emergencyId, responderTeamId }) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found.");

  const responder = await ResponderTeam.findByPk(responderTeamId);
  if (!responder) throw new Error("Responder team not found.");

  if (!emergency.citizenId) {
    throw new Error(
      "Emergency has no citizenId; cannot initialize citizen chat."
    );
  }

  if (!emergency.isChatEnabled) {
    await emergency.update({
      isChatEnabled:                  true,
      chatInitiatedByResponderTeamId: responderTeamId,
      chatInitiatedAt:                new Date(),
    });
  }

  const citizen = await User.findByPk(emergency.citizenId, {
    attributes: ["id", "fullName", "email", "phone"],
  });

  return {
    emergencyId:                    emergency.id,
    isChatEnabled:                  true,
    citizen:                        citizen ? citizen.toJSON() : { id: emergency.citizenId },
    chatInitiatedByResponderTeamId: emergency.chatInitiatedByResponderTeamId,
    chatInitiatedAt:                emergency.chatInitiatedAt,
  };
};

// ─── saveMessage ─────────────────────────────────────────────────────────────
/**
 * Persist a text or audio message and return it together with a flag
 * indicating whether the emergency's isChatEnabled status just changed.
 *
 * IMPORTANT: socket broadcast (io.to(...).emit("chat:new", ...)) must be
 * done in the *controller / route handler*, not here, because this service
 * has no access to the socket.io instance.
 *
 * @param {object} opts
 * @param {number|string} opts.emergencyId
 * @param {number|string} opts.senderId
 * @param {"user"|"responderTeam"} opts.senderType
 * @param {string|null}  [opts.text]       - plain-text body (text messages)
 * @param {string|null}  [opts.audioUrl]   - public URL of uploaded audio file
 * @param {"text"|"audio"} [opts.messageType] - inferred automatically if omitted
 */
const saveMessage = async ({
  emergencyId,
  senderId,
  senderType,
  text      = null,
  audioUrl  = null,
  messageType,        // caller may pass this; we validate/override below
}) => {
  console.log("🔥 SAVE MESSAGE INPUT:", {
    emergencyId,
    senderId,
    senderType,
    text,
    audioUrl,
    messageType,
  });

  // ── 1. Load emergency ────────────────────────────────────────────────────
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found.");
  if (!emergency.citizenId) {
    throw new Error("Emergency has no citizenId; cannot start citizen chat.");
  }

  // ── 2. Validate sender ───────────────────────────────────────────────────
  let sender = null;
  if (senderType === "user") {
    sender = await User.findByPk(senderId);
  } else if (senderType === "responderTeam") {
    sender = await ResponderTeam.findByPk(senderId);
  } else {
    throw new Error("Invalid senderType provided.");
  }
  if (!sender) throw new Error(`Sender not found in ${senderType} table.`);

  // ── 3. Validate payload ──────────────────────────────────────────────────
  const cleanText     = typeof text     === "string" ? text.trim()     : "";
  const cleanAudioUrl = typeof audioUrl === "string" ? audioUrl.trim() : "";

  if (!cleanText && !cleanAudioUrl) {
    throw new Error("Message must include text or audioUrl.");
  }

  // Override messageType from actual content so it is always consistent.
  const resolvedType = cleanAudioUrl ? "audio" : "text";

  // ── 4. Access / business rules ───────────────────────────────────────────
  if (senderType === "user" && !emergency.isChatEnabled) {
    throw new Error("Chat not yet initiated by a responder.");
  }

  if (senderType === "user") {
    if (Number(emergency.citizenId) !== Number(senderId)) {
      throw new Error("You do not have access to this emergency chat.");
    }
  }

  // ── 5. Auto-enable chat on first responder message ───────────────────────
  let statusChanged = false;
  if (senderType === "responderTeam" && !emergency.isChatEnabled) {
    await emergency.update({
      isChatEnabled:                  true,
      chatInitiatedByResponderTeamId: senderId,
      chatInitiatedAt:                new Date(),
    });
    statusChanged = true;
  }

  // ── 6. Persist ───────────────────────────────────────────────────────────
  const message = await Message.create({
    emergencyId,
    citizenId:      emergency.citizenId,
    responderTeamId:
      emergency.chatInitiatedByResponderTeamId ??
      (senderType === "responderTeam" ? senderId : null),
    senderId,
    senderType,
    messageType:    resolvedType,
    text:           cleanText     || null,
    audioUrl:       cleanAudioUrl || null,
  });

  console.log("✅ MESSAGE SAVED:", message.id, "| type:", resolvedType,
              "| audioUrl:", cleanAudioUrl || "(none)");

  return { message, statusChanged };
};

// ─── getHistory ───────────────────────────────────────────────────────────────
const getHistory = async (emergencyId, { requester } = {}) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found.");
  await assertCanAccessEmergencyChat(emergency, requester);

  const messages = await Message.findAll({
    where: { emergencyId },
    order: [["createdAt", "ASC"]],
  });

  console.log(`📩 Loaded ${messages.length} messages for emergency ${emergencyId}`);
  return messages;
};

module.exports = { initChat, saveMessage, getHistory };