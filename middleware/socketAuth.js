const jwt = require("jsonwebtoken");
const { User, ResponderTeam } = require("../models");

module.exports = async (socket, next) => {
  try {
    let { token } = socket.handshake.auth;
    if (!token) return next(new Error("No token provided"));

    // Clean the token if it has "Bearer " prefix
    if (token.startsWith("Bearer ")) token = token.slice(7);

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Support both citizen/admin users and responder teams.
    // - Citizen/admin tokens are issued for `User`
    // - Responder dashboard tokens are issued for `ResponderTeam` (role: "responder")
    const isResponderTeamToken = payload.role === "responder";
    const identityRecord = isResponderTeamToken
      ? await ResponderTeam.findByPk(payload.id)
      : await User.findByPk(payload.id);

    if (!identityRecord) {
      console.error(
        `Socket Auth Failed: id ${payload.id} (role=${payload.role}) not found in DB.`,
      );
      return next(new Error("Account not found - please log in again"));
    }

    // Attach identity for use in chatSocket.js
    socket.identity = {
      id: identityRecord.id,
      senderType: isResponderTeamToken ? "responderTeam" : "user",
      role: isResponderTeamToken
        ? "responder"
        : identityRecord.role === "admin" || identityRecord.role === "responder"
          ? "responder"
          : "citizen",
      name: identityRecord.name || identityRecord.fullName || identityRecord.email,
    };

    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication failed"));
  }
};
