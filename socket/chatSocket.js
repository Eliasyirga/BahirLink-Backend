const messageService = require("../services/messageService");

module.exports = (io, socket) => {
  // 1. Join a room based on the Emergency ID
  socket.on("join_emergency", (emergencyId) => {
    if (!emergencyId) return;

    socket.join(`room_${emergencyId}`);
    console.log(`Socket ${socket.id} joined room_${emergencyId}`);
  });

  // 2. Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { emergencyId, text } = data;

      // Extract sender info from the socket identity (from your socketAuth middleware)
      const senderId = socket.identity.id;
      const senderRole = socket.identity.role; // 'citizen' or 'responder'

      if (!emergencyId || !text) return;

      // Use the service to save message and check activation status
      const { message, statusChanged } = await messageService.saveMessage({
        emergencyId,
        senderId,
        senderRole,
        text,
      });

      // Broadcast the new message to everyone in the room
      io.to(`room_${emergencyId}`).emit("receive_message", message);

      // If the responder just activated the chat, notify the Flutter app to unlock
      if (statusChanged) {
        io.to(`room_${emergencyId}`).emit("chat_activated", {
          isEnabled: true,
        });
      }
    } catch (err) {
      // This sends the "Chat not yet initiated" error back to the citizen if they try to type first
      socket.emit("error_alert", {
        message: err.message,
      });
    }
  });

  // 3. Optional: Real-time typing indicators
  socket.on("typing", (emergencyId) => {
    if (!emergencyId) return;
    socket.to(`room_${emergencyId}`).emit("typing_indicator", {
      senderId: socket.identity.id,
      role: socket.identity.role,
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.identity.name || socket.identity.id);
  });
};
