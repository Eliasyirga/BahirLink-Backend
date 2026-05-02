const jwt = require("jsonwebtoken");
const { User, ResponderTeam } = require("../models");

/**
 * Normalise a raw token value into a clean JWT string, or return null.
 *
 * Handles common client-side bugs:
 *  - "Bearer <token>" prefix (any casing / extra whitespace)
 *  - Accidental wrapping quotes: '"token"' or "'token'"
 *  - Stringified nulls: "null", "undefined"
 *  - Non-string values (objects, arrays, numbers)
 */
function normalizeToken(rawToken) {
  if (rawToken == null) return null;
  if (typeof rawToken !== "string") return null;

  let token = rawToken.trim();
  if (!token) return null;

  // Strip accidental outer quotes, e.g. '"abc"' → 'abc'
  token = token.replace(/^["'](.+)["']$/, "$1").trim();

  // Strip "Bearer " prefix (case-insensitive)
  token = token.replace(/^Bearer\s+/i, "").trim();

  // Reject stringified nullish values from client storage bugs
  if (token === "null" || token === "undefined") return null;

  return token || null;
}

/**
 * Extract a JWT from the socket handshake, trying (in priority order):
 *  1. handshake.auth.token
 *  2. handshake.headers.authorization
 *  3. handshake.query.token
 *
 * Returns { token: string, source: string } or null.
 */
function extractSocketToken(socket) {
  const candidates = [
    { raw: socket?.handshake?.auth?.token,              source: "handshake.auth.token"           },
    { raw: socket?.handshake?.headers?.authorization,   source: "handshake.headers.authorization" },
    { raw: socket?.handshake?.query?.token,             source: "handshake.query.token"           },
  ];

  for (const { raw, source } of candidates) {
    const token = normalizeToken(raw);
    if (token) return { token, source };
  }

  return null;
}

/**
 * Socket.IO authentication middleware.
 *
 * Verifies the JWT, loads the corresponding DB record (User or ResponderTeam),
 * and attaches a normalised `socket.identity` object for use in event handlers.
 *
 * socket.identity shape:
 * {
 *   id:         number,
 *   senderType: "user" | "responderTeam",
 *   role:       "citizen" | "responder",
 *   name:       string,
 * }
 */
module.exports = async (socket, next) => {
  let tokenMeta = null;

  try {
    const extracted = extractSocketToken(socket);
    if (!extracted?.token) {
      return next(new Error("No token provided"));
    }

    tokenMeta = extracted; // for error logging below

    // Verify signature and expiry
    const payload = jwt.verify(extracted.token, process.env.JWT_SECRET);

    // Determine whether this is a ResponderTeam token or a User token.
    // ResponderTeam tokens carry role: "responder".
    const isResponderTeamToken = payload.role === "responder";

    const identityRecord = isResponderTeamToken
      ? await ResponderTeam.findByPk(payload.id)
      : await User.findByPk(payload.id);

    if (!identityRecord) {
      console.error(
        `[SocketAuth] Record not found — id=${payload.id} role=${payload.role}`
      );
      return next(new Error("Account not found — please log in again"));
    }

    // Attach normalised identity to the socket for downstream use
    socket.identity = {
      id: identityRecord.id,

      // senderType is used by the chat/call systems to identify the sender
      senderType: isResponderTeamToken ? "responderTeam" : "user",

      // role drives access-control checks in socket handlers
      role: isResponderTeamToken
        ? "responder"
        : identityRecord.role === "admin" || identityRecord.role === "responder"
          ? "responder"
          : "citizen",

      // Human-readable name for display / logging
      name:
        identityRecord.name ||
        identityRecord.fullName ||
        identityRecord.email ||
        `id:${identityRecord.id}`,
    };

    next();
  } catch (err) {
    const msg = err?.message || "unknown";

    // Build a safe diagnostic object (no token value in logs)
    const rawToken  = tokenMeta?.token;
    const tokenInfo = rawToken
      ? {
          source:       tokenMeta?.source,
          length:       String(rawToken).length,
          looksLikeJwt: String(rawToken).split(".").length === 3,
          startsWithEy: String(rawToken).startsWith("ey"),
        }
      : { source: tokenMeta?.source ?? "none" };

    console.error("[SocketAuth] Error:", msg, tokenInfo);

    // Return descriptive errors to help client-side debugging
    if (msg === "jwt malformed") {
      return next(new Error("Invalid token format — ensure token is a raw JWT string"));
    }
    if (msg === "jwt expired") {
      return next(new Error("Token expired — please log in again"));
    }
    if (msg === "invalid signature") {
      return next(new Error("Token signature invalid"));
    }

    next(new Error("Authentication failed"));
  }
};