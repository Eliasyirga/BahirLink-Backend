const jwt = require("jsonwebtoken");
const { User, ResponderTeam } = require("../models");

function normalizeToken(rawToken) {
  if (rawToken == null) return null;

  // Socket.io auth payloads should be strings; guard against objects/arrays.
  if (typeof rawToken !== "string") return null;

  let token = rawToken.trim();
  if (!token) return null;

  // Remove accidental wrapping quotes: '"abc"' or "'abc'"
  token = token.replace(/^["'](.+)["']$/, "$1").trim();

  // Accept "Bearer <token>" (any casing, any whitespace)
  token = token.replace(/^Bearer\s+/i, "").trim();

  // Common bugs from client storage issues
  if (token === "null" || token === "undefined") return null;

  return token || null;
}

function extractSocketToken(socket) {
  const authToken = normalizeToken(socket?.handshake?.auth?.token);
  if (authToken) return { token: authToken, source: "handshake.auth.token" };

  const headerToken = normalizeToken(socket?.handshake?.headers?.authorization);
  if (headerToken)
    return { token: headerToken, source: "handshake.headers.authorization" };

  const queryToken = normalizeToken(socket?.handshake?.query?.token);
  if (queryToken) return { token: queryToken, source: "handshake.query.token" };

  return null;
}

module.exports = async (socket, next) => {
  try {
    const res = extractSocketToken(socket);
    if (!res?.token) return next(new Error("No token provided"));

    const payload = jwt.verify(res.token, process.env.JWT_SECRET);

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
    const msg = err?.message || "unknown";
    console.error("Socket Auth Error:", msg);
    if (msg === "jwt malformed") {
      return next(new Error("Invalid token format"));
    }
    next(new Error("Authentication failed"));
  }
};
