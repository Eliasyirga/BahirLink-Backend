const { Emergency, Message } = require("../models");

const chatSocket = (io, socket) => {
  socket.on("join_emergency", async (emergencyId) => {
    try {
      // 1. Fetch the emergency to get the citizenId
      const emergency = await Emergency.findByPk(emergencyId);

      if (!emergency) {
        return socket.emit("error_alert", {
          message: "Incident record not found.",
        });
      }

      // 2. Join a room specific to this Emergency AND that Citizen
      const roomName = `emergency_${emergencyId}_citizen_${emergency.citizenId}`;
      socket.join(roomName);

      console.log(
        `Responder ${socket.identity.name} connected to Room: ${roomName}`,
      );
    } catch (err) {
      console.error("Join Room Error:", err);
    }
  });

  socket.on("send_message", async (data) => {
    const { emergencyId, text } = data;
    const emergency = await Emergency.findByPk(emergencyId);

    const newMessage = await Message.create({
      emergencyId,
      senderId: socket.identity.id,
      senderRole: socket.identity.role,
      text,
    });

    const roomName = `emergency_${emergencyId}_citizen_${emergency.citizenId}`;
    io.to(roomName).emit("receive_message", newMessage);
  });
};
