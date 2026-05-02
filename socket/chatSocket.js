const { Emergency, Message } = require("../models");

const chatSocket = (io, socket) => {
  const joinRoom = async ({ emergencyId }) => {
    try {
      const emergency = await Emergency.findByPk(emergencyId);
      if (!emergency) {
        return socket.emit("error_alert", {
          message: "Incident record not found.",
        });
      }

      // Citizens can only join their own emergency room
      if (
        socket.identity.senderType === "user" &&
        Number(emergency.citizenId) !== Number(socket.identity.id)
      ) {
        return socket.emit("error_alert", { message: "Access denied." });
      }

      const roomName = `emergency_${emergencyId}`;
      socket.join(roomName);
      socket.emit("chat:joined", {
        emergencyId,
        isChatEnabled: !!emergency.isChatEnabled,
      });
    } catch (err) {
      console.error("Join Room Error:", err);
      socket.emit("error_alert", { message: "Failed to join chat room." });
    }
  };

  // Backward + new event compatibility
  socket.on("join_emergency", async (emergencyId) => joinRoom({ emergencyId }));
  socket.on("chat:join", async ({ emergencyId }) => joinRoom({ emergencyId }));

  const sendMessage = async ({ emergencyId, text, audioUrl }) => {
    try {
      if (!emergencyId || (!text && !audioUrl)) {
        return socket.emit("error_alert", {
          message: "emergencyId and (text or audioUrl) are required.",
        });
      }

      const emergency = await Emergency.findByPk(emergencyId);
      if (!emergency) {
        return socket.emit("error_alert", {
          message: "Incident record not found.",
        });
      }
      if (!emergency.citizenId) {
        return socket.emit("error_alert", {
          message: "Emergency has no citizenId; cannot start citizen chat.",
        });
      }

      // Citizens can only send on their own emergency
      if (
        socket.identity.senderType === "user" &&
        Number(emergency.citizenId) !== Number(socket.identity.id)
      ) {
        return socket.emit("error_alert", { message: "Access denied." });
      }

      // Block citizen until responder initializes (or responder's first message enables it)
      if (socket.identity.senderType === "user" && !emergency.isChatEnabled) {
        return socket.emit("error_alert", {
          message: "Chat not yet initiated by a responder.",
        });
      }

      if (
        socket.identity.senderType === "responderTeam" &&
        !emergency.isChatEnabled
      ) {
        await emergency.update({
          isChatEnabled: true,
          chatInitiatedByResponderTeamId: socket.identity.id,
          chatInitiatedAt: new Date(),
        });
      }

      const cleanText = typeof text === "string" ? text.trim() : "";
      const cleanAudioUrl = typeof audioUrl === "string" ? audioUrl.trim() : "";

      const newMessage = await Message.create({
        emergencyId,
        citizenId: emergency.citizenId,
        responderTeamId:
          emergency.chatInitiatedByResponderTeamId ??
          (socket.identity.senderType === "responderTeam"
            ? socket.identity.id
            : null),
        senderId: socket.identity.id,
        senderType: socket.identity.senderType,
        messageType: cleanAudioUrl ? "audio" : "text",
        text: cleanText || null,
        audioUrl: cleanAudioUrl || null,
      });

      const roomName = `emergency_${emergencyId}`;
      io.to(roomName).emit("chat:new", newMessage);
      io.to(roomName).emit("receive_message", newMessage); // legacy event name
    } catch (err) {
      console.error("Send Message Error:", err);
      socket.emit("error_alert", { message: "Failed to send message." });
    }
  };

  socket.on("send_message", sendMessage);
  socket.on("chat:send", ({ emergencyId, message, text, audioUrl }) =>
    sendMessage({ emergencyId, text: text ?? message, audioUrl }),
  );
};

module.exports = chatSocket;
