const jwt = require("jsonwebtoken");
const { User, Agency, Crew, ResponderTeam } = require("../models");
const { ACCOUNT_TYPES } = require("../utils/token");

// token `type` → model + chat senderType
const IDENTITY_SOURCES = {
  user: { model: User, senderType: "user" },
  responder: { model: ResponderTeam, senderType: "responderTeam" },
  agency: { model: Agency, senderType: "agency" },
  crew: { model: Crew, senderType: "crew" },
};

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
 * Verifies the JWT, loads the DB record that matches the token's `type`
 * (User / ResponderTeam / Agency / Crew), and attaches a normalised
 * `socket.identity` object for use in event handlers.
 *
 * socket.identity shape:
 * {
 *   id:         number,
 *   type:       "user" | "responder" | "agency" | "crew",
 *   senderType: "user" | "responderTeam" | "agency" | "crew",
 *   role:       "citizen" | "responder" | "agency" | "crew",
 *   name:       string,
 * }
 * Only "user" and "responderTeam" sender types can post chat messages
 * (Message.senderType enum); agency/crew sockets may join and listen.
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

    // Tokens issued before the `type` claim existed must re-login.
    if (!ACCOUNT_TYPES.includes(payload.type)) {
      return next(new Error("Session expired — please log in again"));
    }

    const source = IDENTITY_SOURCES[payload.type];
    const identityRecord = await source.model.findByPk(payload.id);

    if (!identityRecord) {
      console.error(
        `[SocketAuth] Record not found — id=${payload.id} type=${payload.type}`
      );
      return next(new Error("Account not found — please log in again"));
    }

    let role;
    if (payload.type === "user") {
      role =
        identityRecord.role === "admin" || identityRecord.role === "responder"
          ? "responder"
          : "citizen";
    } else {
      role = payload.type; // "responder" | "agency" | "crew"
    }

    // Attach normalised identity to the socket for downstream use
    socket.identity = {
      id: identityRecord.id,
      type: payload.type,
      senderType: source.senderType,
      role,

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