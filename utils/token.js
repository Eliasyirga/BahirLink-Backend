import jwt from "jsonwebtoken";

// ✅ Access Token
export const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// ✅ Refresh Token
export const generateRefreshToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
