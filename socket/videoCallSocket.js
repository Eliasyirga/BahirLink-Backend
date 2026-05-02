const { Emergency } = require("../models");

/**
 * videoCallSocket
 *
 * Handles all WebRTC signalling for video calls between:
 *   - React responder dashboard (initiator / offerer)
 *   - Flutter reporter app     (receiver / answerer)
 *
 * Signal flow:
 *  1.  React  → call:initiate  → server pings Flutter via identity room
 *  2.  React  → call:join      → server fires call:peer-joined back to React room members
 *  3.  Flutter accepts → call:join → server fires call:peer-joined to React (triggers offer)
 *  4.  React  → call:offer     → relayed to Flutter via toSocketId
 *  5.  Flutter → call:answer   → relayed to React via toSocketId / identity
 *  6.  Both   → call:ice       → relayed to each other
 *  7.  Either → call:hangup    → relayed; disconnect also fires call:peer-left
 */
const videoCallSocket = (io, socket) => {
  // Join the caller's own identity room so they can receive targeted events
  const identityRoom = socket?.identity
    ? `identity_${socket.identity.senderType}_${socket.identity.id}`
    : null;
  if (identityRoom) socket.join(identityRoom);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Validate emergencyId, fetch the Emergency record, verify access, then
   * join the call room.  Returns { roomName, emergency } or null on failure.
   */
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

    // Citizens may only join the room for their own emergency
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
   * Resolve a toIdentity object to a Socket.IO room name.
   * e.g. { senderType: "user", id: 42 } → "identity_user_42"
   */
  const identityToRoom = (toIdentity) => {
    if (!toIdentity) return null;
    const { senderType, id } = toIdentity;
    if (!senderType || id == null) return null;
    return `identity_${senderType}_${Number(id)}`;
  };

  /**
   * Relay an event to the correct target, enriching the payload with
   * fromSocketId and fromIdentity so receivers always know who sent it.
   *
   * Priority: toSocketId > toIdentity > broadcast to room (excluding sender).
   */
  const relay = async (eventName, payload) => {
    const emergencyId =
      payload?.emergencyId ?? socket.data.callEmergencyId ?? null;

    const res = await ensureCallRoom({ emergencyId });
    if (!res) return;

    const { roomName } = res;
    const enriched = {
      ...payload,
      emergencyId:  Number(emergencyId),
      fromSocketId: socket.id,
      fromIdentity: socket.identity,
    };

    // Targeted delivery by identity room (e.g. React → Flutter when only
    // reporterUserId is known, before Flutter's socket ID is available)
    const toIdentityRoom = identityToRoom(payload?.toIdentity);
    if (toIdentityRoom) {
      io.to(toIdentityRoom).emit(eventName, enriched);
      return;
    }

    // Targeted delivery by socket ID (preferred once both sides have joined)
    if (payload?.toSocketId) {
      io.to(payload.toSocketId).emit(eventName, enriched);
      return;
    }

    // Broadcast to everyone else in the call room
    socket.to(roomName).emit(eventName, enriched);
  };

  // ── call:initiate ──────────────────────────────────────────────────────────
  // React responder starts a call.
  // Server looks up the reporter's userId and pushes call:incoming to their
  // identity room (handles the case where Flutter is not yet in the call room).
  socket.on("call:initiate", async ({ emergencyId }) => {
    try {
      if (socket.identity.role !== "responder") {
        return socket.emit("call:error", {
          message: "Responder access required.",
        });
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
      const targetRoom     = `identity_user_${reporterUserId}`;

      // Push incoming call notification to Flutter (via identity room)
      io.to(targetRoom).emit("call:incoming", {
        emergencyId:  Number(emergencyId),
        reporterUserId,
        toUserId:     reporterUserId,
        fromIdentity: socket.identity,
        fromSocketId: socket.id,        // Flutter needs this to send the answer back
      });

      // Confirm to React that initiation succeeded and share the reporter's ID
      socket.emit("call:initiated", {
        emergencyId:  Number(emergencyId),
        reporterUserId,
        toUserId:     reporterUserId,
      });
    } catch (err) {
      console.error("call:initiate error:", err);
      socket.emit("call:error", { message: "Failed to initiate call." });
    }
  });

  // ── call:join ─────────────────────────────────────────────────────────────
  // Both React and Flutter call this to join the signalling room.
  // When Flutter calls it after accepting, the server fires call:peer-joined
  // to the rest of the room (i.e. React), which triggers createOffer.
  socket.on("call:join", async ({ emergencyId }) => {
    try {
      const res = await ensureCallRoom({ emergencyId });
      if (!res) return;

      const { roomName, emergency } = res;
      const reporterUserId =
        emergency?.citizenId != null ? Number(emergency.citizenId) : null;

      // Confirm to the joiner
      socket.emit("call:joined", {
        emergencyId: Number(emergencyId),
        reporterUserId,
        socketId:    socket.id,
        identity:    socket.identity,
      });

      // Notify everyone else in the room — React listens for this to send offer
      socket.to(roomName).emit("call:peer-joined", {
        emergencyId:  Number(emergencyId),
        reporterUserId,
        socketId:     socket.id,        // ← React stores this as peerSocketId
        identity:     socket.identity,
        fromSocketId: socket.id,
      });
    } catch (err) {
      console.error("call:join error:", err);
      socket.emit("call:error", { message: "Failed to join call room." });
    }
  });

  // ── call:offer ────────────────────────────────────────────────────────────
  // React → Flutter: WebRTC offer SDP
  socket.on("call:offer", async (payload) => {
    try {
      if (!payload?.sdp) {
        return socket.emit("call:error", { message: "Missing offer SDP." });
      }
      await relay("call:offer", payload);
    } catch (err) {
      console.error("call:offer error:", err);
      socket.emit("call:error", { message: "Failed to relay offer." });
    }
  });

  // ── call:answer ───────────────────────────────────────────────────────────
  // Flutter → React: WebRTC answer SDP
  socket.on("call:answer", async (payload) => {
    try {
      if (!payload?.sdp) {
        return socket.emit("call:error", { message: "Missing answer SDP." });
      }
      await relay("call:answer", payload);
    } catch (err) {
      console.error("call:answer error:", err);
      socket.emit("call:error", { message: "Failed to relay answer." });
    }
  });

  // ── call:ice ──────────────────────────────────────────────────────────────
  // Trickle ICE candidates in both directions
  socket.on("call:ice", async (payload) => {
    try {
      if (!payload?.candidate) {
        return socket.emit("call:error", { message: "Missing ICE candidate." });
      }
      await relay("call:ice", payload);
    } catch (err) {
      console.error("call:ice error:", err);
      socket.emit("call:error", { message: "Failed to relay ICE candidate." });
    }
  });

  // ── call:hangup ───────────────────────────────────────────────────────────
  // Either side explicitly ends the call
  socket.on("call:hangup", async (payload = {}) => {
    try {
      await relay("call:hangup", payload);
    } catch (err) {
      console.error("call:hangup error:", err);
      socket.emit("call:error", { message: "Failed to relay hangup." });
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  // Notify the peer if a socket drops unexpectedly (tab closed, network loss)
  socket.on("disconnect", () => {
    const emergencyId = socket.data.callEmergencyId;
    if (!emergencyId) return;

    socket.to(`emergency_${emergencyId}`).emit("call:peer-left", {
      emergencyId,
      socketId:     socket.id,
      identity:     socket.identity,
      fromSocketId: socket.id,
    });
  });
};

module.exports = videoCallSocket;