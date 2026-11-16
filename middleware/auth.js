const jwt = require("jsonwebtoken");
const { ACCOUNT_TYPES } = require("../utils/token");

// Roles on the User model that administer the whole system.
const ADMIN_ROLES = ["admin", "serviceadmin"];

const unauthorized = (res, message) =>
  res.status(401).json({ success: false, message, error: message });

const forbidden = (res, message = "Access denied") =>
  res.status(403).json({ success: false, message, error: message });

/**
 * Verify the Bearer JWT. Tokens must carry { id, role, type }; tokens issued
 * before `type` existed are rejected so clients re-login.
 */
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (!token || !/^Bearer$/i.test(scheme)) {
    return unauthorized(res, "No token provided");
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res
      .status(500)
      .json({ success: false, message: "Server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (
      !decoded ||
      decoded.id == null ||
      !decoded.role ||
      !ACCOUNT_TYPES.includes(decoded.type)
    ) {
      return unauthorized(res, "Session expired. Please log in again.");
    }
    req.user = decoded; // { id, role, type, ... }
    next();
  } catch (err) {
    return unauthorized(res, "Invalid or expired token");
  }
};

/** Allow only tokens whose `role` claim is one of `roles`. */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return unauthorized(res, "No token provided");
    if (!roles.includes(req.user.role)) return forbidden(res);
    next();
  };

/** Allow only tokens whose `type` claim is one of `types`. */
const requireType =
  (...types) =>
  (req, res, next) => {
    if (!req.user) return unauthorized(res, "No token provided");
    if (!types.includes(req.user.type)) return forbidden(res);
    next();
  };

/**
 * Pass if the caller is a User whose role is in `userRoles`, OR the caller's
 * account type is in `types`. (User.role can also hold values like "agency",
 * so roles are only trusted together with type === "user".)
 */
const isAllowed = (user, { userRoles = [], types = [] } = {}) => {
  if (!user) return false;
  if (types.includes(user.type)) return true;
  return user.type === "user" && userRoles.includes(user.role);
};

const requireAccess = (spec) => (req, res, next) => {
  if (!req.user) return unauthorized(res, "No token provided");
  if (!isAllowed(req.user, spec)) return forbidden(res);
  next();
};

const isSystemAdmin = (user) => isAllowed(user, { userRoles: ADMIN_ROLES });

// Common guards
const adminOnly = requireAccess({ userRoles: ADMIN_ROLES });
const STAFF_TYPES = ["agency", "responder", "crew"];
const staffOnly = requireAccess({ userRoles: ADMIN_ROLES, types: STAFF_TYPES });

// Backwards-compatible name
const isAdmin = adminOnly;

module.exports = {
  ADMIN_ROLES,
  STAFF_TYPES,
  verifyToken,
  requireRole,
  requireType,
  requireAccess,
  isAllowed,
  isSystemAdmin,
  adminOnly,
  staffOnly,
  isAdmin,
};
