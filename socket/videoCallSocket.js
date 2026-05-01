const { Emergency } = require("../models");

/**
 * WebRTC signaling for video/audio calls.
 *
 * This server does NOT relay media. It only relays signaling messages
 * (offer/answer/ICE) between peers in an emergency room.
 */
const videoCallSocket = (io, socket) => {
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

    // Citizens can only access their own emergency call room
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

  socket.on("call:join", async ({ emergencyId }) => {
    try {
      const res = await ensureCallRoom({ emergencyId });
      if (!res) return;

      const { roomName } = res;
      socket.emit("call:joined", {
        emergencyId: Number(emergencyId),
        socketId: socket.id,
        identity: socket.identity,
      });

      // Notify other peers someone is ready for call
      socket.to(roomName).emit("call:peer-joined", {
        emergencyId: Number(emergencyId),
        socketId: socket.id,
        identity: socket.identity,
      });
    } catch (err) {
      console.error("call:join error:", err);
      socket.emit("call:error", { message: "Failed to join call room." });
    }
  });

  const relayToRoom = async (eventName, payload) => {
    const emergencyId =
      payload?.emergencyId ?? socket.data.callEmergencyId ?? null;
    const res = await ensureCallRoom({ emergencyId });
    if (!res) return;

    const { roomName } = res;

    // If client wants to send to a specific socket, do so; else broadcast to room.
    if (payload?.toSocketId) {
      io.to(payload.toSocketId).emit(eventName, {
        ...payload,
        emergencyId: Number(emergencyId),
        fromSocketId: socket.id,
        fromIdentity: socket.identity,
      });
      return;
    }

    socket.to(roomName).emit(eventName, {
      ...payload,
      emergencyId: Number(emergencyId),
      fromSocketId: socket.id,
      fromIdentity: socket.identity,
    });
  };

  socket.on("call:offer", async (payload) => {
    try {
      // payload: { emergencyId, sdp, toSocketId? }
      if (!payload?.sdp) {
        return socket.emit("call:error", { message: "Missing offer sdp." });
      }
      await relayToRoom("call:offer", payload);
    } catch (err) {
      console.error("call:offer error:", err);
      socket.emit("call:error", { message: "Failed to relay offer." });
    }
  });

  socket.on("call:answer", async (payload) => {
    try {
      // payload: { emergencyId, sdp, toSocketId? }
      if (!payload?.sdp) {
        return socket.emit("call:error", { message: "Missing answer sdp." });
      }
      await relayToRoom("call:answer", payload);
    } catch (err) {
      console.error("call:answer error:", err);
      socket.emit("call:error", { message: "Failed to relay answer." });
    }
  });

  socket.on("call:ice", async (payload) => {
    try {
      // payload: { emergencyId, candidate, toSocketId? }
      if (!payload?.candidate) {
        return socket.emit("call:error", { message: "Missing ICE candidate." });
      }
      await relayToRoom("call:ice", payload);
    } catch (err) {
      console.error("call:ice error:", err);
      socket.emit("call:error", { message: "Failed to relay ICE candidate." });
    }
  });

  socket.on("call:hangup", async (payload = {}) => {
    try {
      await relayToRoom("call:hangup", payload);
    } catch (err) {
      console.error("call:hangup error:", err);
      socket.emit("call:error", { message: "Failed to relay hangup." });
    }
  });

  socket.on("disconnect", () => {
    const emergencyId = socket.data.callEmergencyId;
    if (!emergencyId) return;
    const roomName = `emergency_${emergencyId}`;
    socket.to(roomName).emit("call:peer-left", {
      emergencyId,
      socketId: socket.id,
      identity: socket.identity,
    });
  });
};

module.exports = videoCallSocket;

