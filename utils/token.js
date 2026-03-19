import jwt from "jsonwebtoken";

// Include role in token payload
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role }, // ✅ include role
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role }, // ✅ include role
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};
