const { Emergency } = require("../models");

/**
 * WebRTC signaling for video/audio calls.
 *
 * This server does NOT relay media. It only relays signaling messages
 * (offer/answer/ICE) between peers in an emergency room.
 */
const videoCallSocket = (io, socket) => {
  // Every authenticated connection joins an identity room so we can target a
  // specific user/responder without relying on volatile socket IDs.
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

  /**
   * Responder initiates a call to the emergency reporter (citizen).
   * This emits ONLY to that citizen's identity room.
   *
   * payload: { emergencyId }
   */
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
          message: "Emergency has no citizenId (reporter) to call.",
        });
      }

      const targetRoom = `identity_user_${Number(emergency.citizenId)}`;

      // Send to the reporter only (all their active sockets).
      io.to(targetRoom).emit("call:incoming", {
        emergencyId: Number(emergencyId),
        fromIdentity: socket.identity,
        fromSocketId: socket.id,
        toUserId: Number(emergency.citizenId),
      });

      socket.emit("call:initiated", {
        emergencyId: Number(emergencyId),
        toUserId: Number(emergency.citizenId),
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

  const identityToRoom = (toIdentity) => {
    if (!toIdentity) return null;
    const senderType = toIdentity.senderType;
    const id = toIdentity.id;
    if (!senderType || id == null) return null;
    return `identity_${senderType}_${Number(id)}`;
  };

  const relayToRoom = async (eventName, payload) => {
    const emergencyId =
      payload?.emergencyId ?? socket.data.callEmergencyId ?? null;
    const res = await ensureCallRoom({ emergencyId });
    if (!res) return;

    const { roomName } = res;

    // Prefer targeting an identity room for stable 1:1 delivery.
    // payload.toIdentity: { senderType: "user"|"responderTeam", id: number }
    const toIdentityRoom = identityToRoom(payload?.toIdentity);
    if (toIdentityRoom) {
      io.to(toIdentityRoom).emit(eventName, {
        ...payload,
        emergencyId: Number(emergencyId),
        fromSocketId: socket.id,
        fromIdentity: socket.identity,
      });
      return;
    }

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
      // payload: { emergencyId, sdp, toSocketId?, toIdentity? }
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
      // payload: { emergencyId, sdp, toSocketId?, toIdentity? }
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
      // payload: { emergencyId, candidate, toSocketId?, toIdentity? }
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

