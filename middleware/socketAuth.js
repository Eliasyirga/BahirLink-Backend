const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (socket, next) => {
  try {
    let { token } = socket.handshake.auth;
    if (!token) return next(new Error("No token provided"));

    // Clean the token if it has "Bearer " prefix
    if (token.startsWith("Bearer ")) token = token.slice(7);

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // This is the line failing: find the Responder by the ID in their token
    const user = await User.findByPk(payload.id);

    if (!user) {
      console.error(
        `Socket Auth Failed: User ID ${payload.id} not found in DB.`,
      );
      return next(new Error("User not found - please log in again"));
    }

    // Attach identity for use in chatSocket.js
    socket.identity = {
      id: user.id,
      role:
        user.role === "admin" || user.role === "responder"
          ? "responder"
          : "citizen",
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication failed"));
  }
};
