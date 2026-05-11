const { Emergency, Message } = require("../models");

const chatSocket = (io, socket) => {
  const joinRoom = async ({ emergencyId }) => {
    try {
      const emergency = await Emergency.findByPk(emergencyId, { raw: true });
      if (!emergency) {
        return socket.emit("error_alert", {
          message: "Incident record not found.",
        });
      }

      if (
        socket.identity.senderType === "user" &&
        Number(emergency.citizenId) !== Number(socket.identity.id)
      ) {
        return socket.emit("error_alert", { message: "Access denied." });
      }

      // Log ALL columns so we can see exactly what names the DB returns
      console.log("🔍 [joinRoom] Full emergency row:", JSON.stringify(emergency));

      const roomName = `emergency_${emergencyId}`;
      socket.join(roomName);

      // Detect the correct column name — handle both snake and camel
      const chatEnabled =
        emergency.isChatEnabled ??
        emergency.is_chat_enabled ??
        emergency.chatEnabled ??
        false;

      console.log(
        `🚪 [joinRoom] emergencyId=${emergencyId} | ` +
        `resolved isChatEnabled=${chatEnabled} | ` +
        `senderType=${socket.identity.senderType}`
      );

      socket.emit("chat:joined", {
        emergencyId,
        isChatEnabled: !!chatEnabled,
      });
    } catch (err) {
      console.error("Join Room Error:", err);
      socket.emit("error_alert", { message: "Failed to join chat room." });
    }
  };

  socket.on("join_emergency", async (emergencyId) => joinRoom({ emergencyId }));
  socket.on("chat:join", async ({ emergencyId }) => joinRoom({ emergencyId }));

  const sendMessage = async ({ emergencyId, text, audioUrl }) => {
    try {
      if (!emergencyId || (!text && !audioUrl)) {
        return socket.emit("error_alert", {
          message: "emergencyId and (text or audioUrl) are required.",
        });
      }

      const emergency = await Emergency.findByPk(emergencyId, { raw: true });

      if (!emergency) {
        return socket.emit("error_alert", { message: "Incident record not found." });
      }

      // Resolve column names defensively — works regardless of snake vs camel
      const chatEnabled =
        emergency.isChatEnabled ??
        emergency.is_chat_enabled ??
        emergency.chatEnabled ??
        false;

      const citizenId =
        emergency.citizenId ??
        emergency.citizen_id ??
        null;

      const chatInitiatedByResponderTeamId =
        emergency.chatInitiatedByResponderTeamId ??
        emergency.chat_initiated_by_responder_team_id ??
        null;

      console.log(
        `📨 [sendMessage] emergencyId=${emergencyId} | ` +
        `senderType=${socket.identity.senderType} | ` +
        `chatEnabled=${chatEnabled} | citizenId=${citizenId}`
      );

      if (!citizenId) {
        return socket.emit("error_alert", {
          message: "Emergency has no citizenId; cannot start citizen chat.",
        });
      }

      if (
        socket.identity.senderType === "user" &&
        Number(citizenId) !== Number(socket.identity.id)
      ) {
        return socket.emit("error_alert", { message: "Access denied." });
      }

      if (socket.identity.senderType === "user" && !chatEnabled) {
        console.warn(`🔒 [sendMessage] Blocked — chatEnabled=${chatEnabled}`);
        return socket.emit("error_alert", {
          message: "Chat not yet initiated by a responder.",
        });
      }

      // Responder's first message — enable chat
      if (socket.identity.senderType === "responderTeam" && !chatEnabled) {
        // Use Sequelize instance (not raw) for update
        const emergencyInstance = await Emergency.findByPk(emergencyId);
        await emergencyInstance.update({
          isChatEnabled: true,
          chatInitiatedByResponderTeamId: socket.identity.id,
          chatInitiatedAt: new Date(),
        });

        console.log(`✅ [sendMessage] Chat enabled by responder ${socket.identity.id}`);

        io.to(`emergency_${emergencyId}`).emit("chat:enabled", {
          emergencyId,
          enabledByResponderTeamId: socket.identity.id,
        });
      }

      // Re-fetch fresh row after potential update
      const fresh = await Emergency.findByPk(emergencyId, { raw: true });

      const freshResponderId =
        fresh.chatInitiatedByResponderTeamId ??
        fresh.chat_initiated_by_responder_team_id ??
        (socket.identity.senderType === "responderTeam" ? socket.identity.id : null);

      if (socket.identity.senderType === "user" && !freshResponderId) {
        return socket.emit("error_alert", {
          message: "No responder assigned to this emergency yet.",
        });
      }

      const cleanText     = typeof text     === "string" ? text.trim()     : "";
      const cleanAudioUrl = typeof audioUrl === "string" ? audioUrl.trim() : "";

      const freshCitizenId =
        fresh.citizenId ?? fresh.citizen_id;

      const newMessage = await Message.create({
        emergencyId,
        citizenId:       freshCitizenId,
        responderTeamId: freshResponderId,
        senderId:        socket.identity.id,
        senderType:      socket.identity.senderType,
        messageType:     cleanAudioUrl ? "audio" : "text",
        text:            cleanText     || null,
        audioUrl:        cleanAudioUrl || null,
      });

      console.log(`✅ [sendMessage] Message saved id=${newMessage.id}`);

      const roomName = `emergency_${emergencyId}`;
      io.to(roomName).emit("chat:new",        newMessage);
      io.to(roomName).emit("receive_message", newMessage);
    } catch (err) {
      console.error("❌ [sendMessage] Error:", err.message);
      socket.emit("error_alert", { message: "Failed to send message." });
    }
  };

  socket.on("send_message", sendMessage);
  socket.on("chat:send", ({ emergencyId, message, text, audioUrl }) =>
    sendMessage({ emergencyId, text: text ?? message, audioUrl }),
  );
};

module.exports = chatSocket;