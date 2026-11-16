const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op, fn, col, where: sqlWhere } = require("sequelize");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token.js");
const sendEmail = require("../utils/sendEmail.js");
const {
  verificationEmail,
  temporaryPasswordEmail,
} = require("../utils/emailTemplates.js");

const ADMIN_ROLES = ["admin", "serviceadmin"];
const GENERIC_LOGIN_ERROR = "Invalid email or password";
const TEMP_PASSWORD_TTL_MS = 30 * 60 * 1000;
// After a temp-password login, resetPasswordToken holds a single-use marker
// "<prefix><sha256(nonce)>" (nonce is the token's pwdNonce claim) until the
// password is changed. Lifetime matches the access token (1h).
const TEMP_LOGIN_MARKER_PREFIX = "TEMP_LOGIN_PENDING:";
const TEMP_LOGIN_SESSION_TTL_MS = 60 * 60 * 1000;
const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const isTempLoginMarker = (v) =>
  typeof v === "string" && v.startsWith(TEMP_LOGIN_MARKER_PREFIX);
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

// Attributes that must never leave the server.
const SECRET_USER_FIELDS = [
  "password",
  "refreshToken",
  "verificationCode",
  "verificationCodeExpires",
  "verificationToken",
  "verificationTokenExpires",
  "resetPasswordToken",
  "resetPasswordExpires",
];

// Safe attributes for staff-facing lookups (GET /api/users/:id).
const SAFE_USER_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "role",
  "gender",
  "city",
  "region",
  "country",
  "address",
  "profileImage",
  "isEmailVerified",
  "isPhoneVerified",
  "isNationalIDVerified",
  "createdAt",
];

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  SECRET_USER_FIELDS.forEach((f) => delete plain[f]);
  return plain;
};

const userRole = (user) => user.role || "user";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Case-insensitive email match (existing rows may have mixed-case emails).
const emailWhere = (email) =>
  sqlWhere(fn("lower", col("email")), normalizeEmail(email));

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ✅ REGISTER — public self-registration is always a plain "user".
const registerUser = async ({ firstName, lastName, email, password }) => {
  if (!email || !password) throw httpError("Email and password are required", 400);

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ where: emailWhere(normalizedEmail) });
  if (existingUser) throw httpError("Email already registered", 400);

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const verificationCode = crypto.randomInt(100000, 1000000); // 6 digits

  const user = await User.create({
    firstName,
    lastName,
    fullName,
    email: normalizedEmail,
    role: "user",
    password: hashedPassword,
    verificationCode,
    verificationCodeExpires: Date.now() + VERIFICATION_CODE_TTL_MS,
    isEmailVerified: false,
  });

  await sendEmail(
    normalizedEmail,
    "Verify Your Email",
    verificationEmail(fullName, verificationCode),
  );

  return { id: user.id, fullName, email: normalizedEmail, role: "user" };
};

// ✅ VERIFY EMAIL
const verifyEmailCode = async (email, code) => {
  const numericCode = Number(code);
  if (!email || !Number.isInteger(numericCode))
    throw httpError("Invalid verification code", 400);

  const user = await User.unscoped().findOne({
    where: {
      [Op.and]: [
        emailWhere(email),
        { verificationCode: numericCode },
        { verificationCodeExpires: { [Op.gt]: Date.now() } },
      ],
    },
  });

  if (!user) throw httpError("Invalid or expired verification code", 400);

  user.isEmailVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  await user.save();

  return true;
};

const hasValidTempPassword = async (user, password) => {
  if (!user.resetPasswordToken || !user.resetPasswordExpires) return false;
  // A pending temp-login marker is not a password.
  if (isTempLoginMarker(user.resetPasswordToken)) return false;
  if (new Date(user.resetPasswordExpires).getTime() <= Date.now()) return false;
  return bcrypt.compare(String(password), user.resetPasswordToken);
};

// ✅ LOGIN — accepts the real password, or an unexpired temporary password
// issued by forgot-password (which then forces a password change).
const loginUser = async ({ email, password, rememberMe }) => {
  if (!email || !password) throw httpError(GENERIC_LOGIN_ERROR, 400);

  const user = await User.unscoped().findOne({ where: emailWhere(email) });
  if (!user) throw httpError(GENERIC_LOGIN_ERROR, 400);

  let mustChangePassword = false;
  const realMatch = await bcrypt.compare(String(password), user.password);
  if (!realMatch) {
    const tempMatch = await hasValidTempPassword(user, password);
    if (!tempMatch) throw httpError(GENERIC_LOGIN_ERROR, 400);
    mustChangePassword = true;
  }

  if (!user.isEmailVerified && !ADMIN_ROLES.includes(userRole(user))) {
    throw httpError("Email not verified. Please verify first.", 400);
  }

  // Any successful login consumes the outstanding temporary password.
  // A temp-password login replaces it with a single-use marker that lets this
  // session change the password ONCE without re-entering a password.
  let extra = {};
  if (mustChangePassword) {
    const nonce = crypto.randomBytes(16).toString("hex");
    user.resetPasswordToken = TEMP_LOGIN_MARKER_PREFIX + sha256(nonce);
    user.resetPasswordExpires = new Date(Date.now() + TEMP_LOGIN_SESSION_TTL_MS);
    extra = { pwdReset: true, pwdNonce: nonce };
  } else {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
  }

  const role = userRole(user);
  const accessToken = generateAccessToken(user.id, role, "user", extra);
  const refreshToken =
    rememberMe && !mustChangePassword
      ? generateRefreshToken(user.id, role, "user")
      : null;

  if (refreshToken) user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
    mustChangePassword,
  };
};

// ✅ PROFILE
const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "email",
      "phone",
      "gender",
      "dateOfBirth",
      "country",
      "region",
      "city",
      "address",
      "bio",
      "role",
    ],
  });
  if (!user) throw httpError("User not found", 404);
  return user;
};

// ✅ STAFF LOOKUP (GET /api/users/:id)
const getUserById = async (id) => {
  const user = await User.findByPk(id, { attributes: SAFE_USER_ATTRIBUTES });
  if (!user) throw httpError("User not found", 404);
  return user;
};

// ✅ UPDATE PROFILE — explicit allow-list; never role, email, verification
// flags, tokens or password.
const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "gender",
  "dateOfBirth",
  "country",
  "region",
  "city",
  "address",
  "bio",
];

const updateUserProfile = async (userId, body = {}) => {
  const updates = {};
  PROFILE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) updates[field] = body[field];
  });

  if (updates.gender !== undefined && !["male", "female"].includes(updates.gender)) {
    delete updates.gender;
  }
  if (updates.dateOfBirth !== undefined) {
    const d = new Date(updates.dateOfBirth);
    if (!updates.dateOfBirth || isNaN(d.getTime())) delete updates.dateOfBirth;
  }

  const user = await User.findByPk(userId);
  if (!user) throw httpError("User not found", 404);

  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const first = updates.firstName ?? user.firstName ?? "";
    const last = updates.lastName ?? user.lastName ?? "";
    updates.fullName = `${first} ${last}`.trim();
  }

  await user.update(updates);
  return getUserProfile(userId);
};

// ✅ FORGOT PASSWORD — never touches the current password and responds the
// same whether or not the account exists. The temp password is stored only as
// a bcrypt hash in resetPasswordToken with a 30-minute resetPasswordExpires.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const forgotUserPassword = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const user = normalizedEmail
    ? await User.unscoped().findOne({ where: emailWhere(normalizedEmail) })
    : null;

  const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 chars
  const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

  if (!user) {
    // Equalise timing a little with the found-user path.
    await bcrypt.compare(tempPassword, DUMMY_HASH);
    return true;
  }

  user.resetPasswordToken = hashedTempPassword;
  user.resetPasswordExpires = new Date(Date.now() + TEMP_PASSWORD_TTL_MS);
  await user.save();

  // Fire-and-forget so response timing doesn't reveal account existence.
  sendEmail(
    user.email,
    "Temporary Password",
    temporaryPasswordEmail(tempPassword),
  ).catch((err) =>
    console.error("Forgot-password email failed:", err && err.message),
  );

  return true;
};

// ✅ CHANGE PASSWORD
// `viaTempLogin` is true when the access token came from a temp-password login;
// `pwdNonce` is that token's nonce claim. The current-password check is
// skipped only while the matching single-use marker is present and unexpired.
const hasPendingTempLogin = (user, pwdNonce) =>
  typeof pwdNonce === "string" &&
  pwdNonce.length > 0 &&
  isTempLoginMarker(user.resetPasswordToken) &&
  user.resetPasswordExpires != null &&
  new Date(user.resetPasswordExpires).getTime() > Date.now() &&
  crypto.timingSafeEqual(
    Buffer.from(user.resetPasswordToken),
    Buffer.from(TEMP_LOGIN_MARKER_PREFIX + sha256(pwdNonce)),
  );

const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword,
  { viaTempLogin = false, pwdNonce = null } = {},
) => {
  if (!newPassword || String(newPassword).length < 6)
    throw httpError("New password must be at least 6 characters", 400);

  const user = await User.unscoped().findByPk(userId);
  if (!user) throw httpError("User not found", 404);

  const tempSessionOk = viaTempLogin && hasPendingTempLogin(user, pwdNonce);
  if (!tempSessionOk) {
    const isMatch =
      currentPassword != null &&
      ((await bcrypt.compare(String(currentPassword), user.password)) ||
        (await hasValidTempPassword(user, currentPassword)));
    if (!isMatch) throw httpError("Current password incorrect", 400);
  }

  user.password = await bcrypt.hash(String(newPassword), 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.lastPasswordChange = new Date();
  await user.save();

  return true;
};

// ✅ REFRESH TOKEN
const refreshUserToken = async (token) => {
  if (!token) throw httpError("No token provided", 400);
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error("JWT_REFRESH_SECRET is not configured");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw httpError("Invalid session", 401);
  }
  const user = await User.unscoped().findByPk(decoded.id);

  if (!user || user.refreshToken !== token) throw httpError("Invalid session", 401);

  return generateAccessToken(user.id, userRole(user), "user");
};

// ✅ GET ALL USERS
const getAllUsers = async () => {
  const users = await User.findAll({
    attributes: [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "email",
      "role",
      "isEmailVerified",
    ],
  });
  return users;
};

module.exports = {
  registerUser,
  verifyEmailCode,
  loginUser,
  getUserProfile,
  getUserById,
  updateUserProfile,
  forgotUserPassword,
  changeUserPassword,
  refreshUserToken,
  getAllUsers,
  sanitizeUser,
};
