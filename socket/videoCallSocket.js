const { Emergency } = require("../models");

const videoCallSocket = (io, socket) => {
  const identityRoom = socket?.identity
    ? `identity_${socket.identity.senderType}_${socket.identity.id}`
    : null;
  if (identityRoom) socket.join(identityRoom);

  const ensureCallRoom = async ({ emergencyId }) => {
    if (!emergencyId) {
      socket.emit("call:error", { message: "emergencyId is required." });
      return null;
    }
    const emergency = await Emergency.findByPk(emergencyId);
    if (!emergency) {
      socket.emit("call:error", { message: "Incident record not found." });
      return null;
    }
    if (
      socket.identity.senderType === "user" &&
      Number(emergency.citizenId) !== Number(socket.identity.id)
    ) {
      socket.emit("call:error", { message: "Access denied." });
      return null;
    }
    const roomName = `emergency_${emergencyId}`;
    socket.join(roomName);
    socket.data.callEmergencyId = Number(emergencyId);
    return { roomName, emergency };
  };

  socket.on("call:initiate", async ({ emergencyId }) => {
    try {
      if (socket.identity.role !== "responder") {
        return socket.emit("call:error", { message: "Responder access required." });
      }
      const res = await ensureCallRoom({ emergencyId });
      if (!res) return;

      const { emergency } = res;
      if (!emergency?.citizenId) {
        return socket.emit("call:error", {
          message: "Emergency has no citizen reporter.",
        });
      }

      const reporterUserId = Number(emergency.citizenId);
      const targetRoom = `identity_user_${reporterUserId}`;

      io.to(targetRoom).emit("call:incoming", {
        emergencyId:    Number(emergencyId),
        reporterUserId,
        toUserId:       reporterUserId,
        fromIdentity:   socket.identity,
        fromSocketId:   socket.id,          // ← Flutter needs this
      });

      socket.emit("call:initiated", {
        emergencyId:    Number(emergencyId),
        reporterUserId,
        toUserId:       reporterUserId,
      });
    } catch (err) {
      console.error("call:initiate error:", err);
      socket.emit("call:error", { message: "Failed to initiate call." });
    }
  });

  socket.on("call:join", async ({ emergencyId }) => {
    try {
      const res = await ensureCallRoom({ emergencyId });
      if (!res) return;

      const { roomName, emergency } = res;
      const reporterUserId =
        emergency?.citizenId != null ? Number(emergency.citizenId) : null;

      socket.emit("call:joined", {
        emergencyId: Number(emergencyId),
        reporterUserId,
        socketId:    socket.id,
        identity:    socket.identity,
      });

      // This fires on the React side → triggers createOffer
      socket.to(roomName).emit("call:peer-joined", {
        emergencyId:    Number(emergencyId),
        reporterUserId,
        socketId:       socket.id,
        identity:       socket.identity,
        fromSocketId:   socket.id,          // ← explicit, React uses this
      });
    } catch (err) {
      console.error("call:join error:", err);
      socket.emit("call:error", { message: "Failed to join call room." });
    }
  });

  const identityToRoom = (toIdentity) => {
    if (!toIdentity) return null;
    const { senderType, id } = toIdentity;
    if (!senderType || id == null) return null;
    return `identity_${senderType}_${Number(id)}`;
  };

  // Always stamps fromSocketId so the receiver knows who sent it
  const relay = async (eventName, payload) => {
    const emergencyId =
      payload?.emergencyId ?? socket.data.callEmergencyId ?? null;
    const res = await ensureCallRoom({ emergencyId });
    if (!res) return;

    const { roomName } = res;
    const enriched = {
      ...payload,
      emergencyId:  Number(emergencyId),
      fromSocketId: socket.id,              // ← always present
      fromIdentity: socket.identity,
    };

    const toIdentityRoom = identityToRoom(payload?.toIdentity);
    if (toIdentityRoom) {
      io.to(toIdentityRoom).emit(eventName, enriched);
      return;
    }
    if (payload?.toSocketId) {
      io.to(payload.toSocketId).emit(eventName, enriched);
      return;
    }
    socket.to(roomName).emit(eventName, enriched);
  };

  socket.on("call:offer", async (payload) => {
    try {
      if (!payload?.sdp)
        return socket.emit("call:error", { message: "Missing offer sdp." });
      await relay("call:offer", payload);
    } catch (err) {
      console.error("call:offer error:", err);
      socket.emit("call:error", { message: "Failed to relay offer." });
    }
  });

  socket.on("call:answer", async (payload) => {
    try {
      if (!payload?.sdp)
        return socket.emit("call:error", { message: "Missing answer sdp." });
      await relay("call:answer", payload);
    } catch (err) {
      console.error("call:answer error:", err);
      socket.emit("call:error", { message: "Failed to relay answer." });
    }
  });

  socket.on("call:ice", async (payload) => {
    try {
      if (!payload?.candidate)
        return socket.emit("call:error", { message: "Missing ICE candidate." });
      await relay("call:ice", payload);
    } catch (err) {
      console.error("call:ice error:", err);
      socket.emit("call:error", { message: "Failed to relay ICE." });
    }
  });

  socket.on("call:hangup", async (payload = {}) => {
    try {
      await relay("call:hangup", payload);
    } catch (err) {
      console.error("call:hangup error:", err);
      socket.emit("call:error", { message: "Failed to relay hangup." });
    }
  });

  socket.on("disconnect", () => {
    const emergencyId = socket.data.callEmergencyId;
    if (!emergencyId) return;
    socket.to(`emergency_${emergencyId}`).emit("call:peer-left", {
      emergencyId,
      socketId:    socket.id,
      identity:    socket.identity,
      fromSocketId: socket.id,
    });
  });
};

module.exports = videoCallSocket;