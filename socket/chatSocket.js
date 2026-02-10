const { Message, User } = require("../models");
const { canAccessEmergency } = require("../utils/emergencyAccess");

const onlineUsers = {
  guest: new Set(),
  admin: new Set(),
  responder: new Set(),
  user: new Set(), 
};

function chatSocket(io, socket) {
  console.log(`User connected: ${socket.identity.id} (${socket.identity.role})`);

  onlineUsers[socket.identity.role].add(socket.identity.id);

  socket.on("chat:join", async ({ emergencyId }) => {
    const canJoin =
      socket.identity.role === "guest"
        ? await canAccessEmergency(socket.identity.id, emergencyId)
        : ["admin", "responder"].includes(socket.identity.role);

    if (!canJoin) return;

    socket.join(`emergency_${emergencyId}`);

    io.to(`emergency_${emergencyId}`).emit("chat:new", {
      senderRole: "system",
      message: `${socket.identity.role} ${socket.identity.name} joined the chat`,
      emergencyId,
      createdAt: new Date(),
    });
  });

  socket.on("chat:send", async ({ emergencyId, message, type = "text" }) => {
    if (!message?.trim()) return;

    const canSend =
      socket.identity.role === "guest"
        ? await canAccessEmergency(socket.identity.id, emergencyId)
        : ["admin", "responder"].includes(socket.identity.role);

    if (!canSend) return;

    const savedMessage = await Message.create({
      emergencyId,
      senderId: socket.identity.type === "guest" ? null : socket.identity.id,
      senderRole: socket.identity.role,
      senderType: socket.identity.type,
      message,
      type,
    });

    io.to(`emergency_${emergencyId}`).emit("chat:new", {
      id: savedMessage.id,
      emergencyId,
      senderId: socket.identity.id,
      senderRole: socket.identity.role,
      senderType: socket.identity.type,
      message: savedMessage.message,
      type: savedMessage.type,
      createdAt: savedMessage.createdAt,
    });
  });

  socket.on("chat:typing", ({ emergencyId }) => {
    socket.to(`emergency_${emergencyId}`).emit("chat:typing", {
      userId: socket.identity.id,
      senderRole: socket.identity.role,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.identity.id} (${socket.identity.role})`);
    onlineUsers[socket.identity.role].delete(socket.identity.id);
  });
}

module.exports =  chatSocket;
