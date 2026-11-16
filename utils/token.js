const jwt = require("jsonwebtoken");

/**
 * Every access token carries { id, role, type }.
 *   type ∈ "user" | "agency" | "crew" | "responder"
 *   role = User.role for users; otherwise the same value as `type`.
 * `extra` lets callers add non-authoritative convenience claims
 * (e.g. agencyId for responders) without changing the core contract.
 */
const ACCOUNT_TYPES = ["user", "agency", "crew", "responder"];

const requireSecret = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const buildPayload = (id, role, type, extra = {}) => {
  if (!ACCOUNT_TYPES.includes(type)) {
    throw new Error(`Invalid token type: ${type}`);
  }
  if (!role) throw new Error("Token role is required");
  return { ...extra, id, role, type };
};

// Access Token
const generateAccessToken = (id, role, type, extra = {}, expiresIn = "1h") =>
  jwt.sign(buildPayload(id, role, type, extra), requireSecret("JWT_SECRET"), {
    expiresIn,
  });

// Refresh Token
const generateRefreshToken = (id, role, type, extra = {}) =>
  jwt.sign(
    buildPayload(id, role, type, extra),
    requireSecret("JWT_REFRESH_SECRET"),
    { expiresIn: "7d" },
  );

module.exports = {
  ACCOUNT_TYPES,
  generateAccessToken,
  generateRefreshToken,
};
