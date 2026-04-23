const MessageService = require("../services/messageService");

module.exports = (io, socket) => {
  // ======================
  // JOIN CHAT ROOM
  // ======================
  socket.on("joinChat", (chatId) => {
    if (!chatId) return;

    socket.join(chatId);
  });

  // ======================
  // SEND MESSAGE
  // ======================
  socket.on("sendMessage", async (data) => {
    try {
      const { chatId, message } = data;

      if (!chatId || !message) return;

      const newMessage = await MessageService.createMessage({
        chatId,
        senderId: socket.identity.id,
        senderRole: socket.identity.role,
        message,
      });

      io.to(chatId).emit("newMessage", newMessage);
    } catch (err) {
      socket.emit("error", {
        message: err.message,
      });
    }
  });

  // ======================
  // TYPING INDICATOR
  // ======================
  socket.on("typing", (chatId) => {
    if (!chatId) return;

    socket.to(chatId).emit("typing", {
      user: socket.identity,
    });
  });

  // ======================
  // DISCONNECT
  // ======================
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.identity);
  });
};
