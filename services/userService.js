import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../models/user.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import sendEmail from "../utils/sendEmail.js";
import {
  verificationEmail,
  temporaryPasswordEmail,
} from "../utils/emailTemplates.js";

// ✅ REGISTER
export const registerUser = async ({
  firstName,
  lastName,
  email,
  role = "user",
  password,
}) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  const user = await User.create({
    firstName,
    lastName,
    fullName,
    email,
    role,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    isEmailVerified: role === "admin", // ✅ Admin auto-verified
  });

  // ❗ Only send email if NOT admin
  if (role !== "admin") {
    await sendEmail(
      email,
      "Verify Your Email",
      verificationEmail(fullName, verificationCode),
    );
  }

  return { id: user.id, fullName, email, role };
};

// ✅ VERIFY EMAIL
export const verifyEmailCode = async (email, code) => {
  const numericCode = Number(code);
  if (!Number.isInteger(numericCode))
    throw new Error("Invalid verification code");

  const user = await User.findOne({
    where: {
      email,
      verificationCode: numericCode,
      verificationCodeExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) throw new Error("Invalid or expired verification code");

  user.isEmailVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  await user.save();

  return true;
};

// ✅ LOGIN
export const loginUser = async ({ email, password, rememberMe }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid password");

  // 🔥 Generate tokens FIRST
  const accessToken = generateAccessToken(user.id);
  const refreshToken = rememberMe ? generateRefreshToken(user.id) : null;

  if (refreshToken) user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user,
    mustChangePassword: user.mustChangePassword || false,
  };
};

// ✅ PROFILE
export const getUserProfile = async (userId) => {
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
      "city",
      "address",
      "role",
    ],
  });

  if (!user) throw new Error("User not found");
  return user;
};

// ✅ UPDATE PROFILE
export const updateUserProfile = async (userId, updates) => {
  if (updates.firstName || updates.lastName) {
    updates.fullName =
      `${updates.firstName || ""} ${updates.lastName || ""}`.trim();
  }

  const [_, updatedUsers] = await User.update(updates, {
    where: { id: userId },
    returning: true,
  });

  if (!updatedUsers[0]) throw new Error("User not found");
  return updatedUsers[0];
};

// ✅ FORGOT PASSWORD
export const forgotUserPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  const tempPassword = crypto.randomBytes(4).toString("hex");
  const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

  user.password = hashedTempPassword;
  user.mustChangePassword = true;
  await user.save();

  await sendEmail(
    user.email,
    "Temporary Password",
    temporaryPasswordEmail(tempPassword),
  );

  return true;
};

// ✅ CHANGE PASSWORD
export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  return true;
};

// ✅ REFRESH TOKEN
export const refreshUserToken = async (token) => {
  if (!token) throw new Error("No token provided");

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findByPk(decoded.id);

  if (!user || user.refreshToken !== token) throw new Error("Invalid session");

  return generateAccessToken(user.id);
};

export const getAllUsers = async () => {
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
