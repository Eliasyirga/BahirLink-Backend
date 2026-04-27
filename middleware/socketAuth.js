const jwt = require("jsonwebtoken");
const { User, Guest } = require("../models");

module.exports = async (socket, next) => {
  try {
    const { token, guestId } = socket.handshake.auth;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(payload.id);
      if (!user) return next(new Error("User not found"));

      // Mapping role to match your MessageService logic ('citizen' or 'responder')
      // If user.role is 'admin' or 'responder', we treat them as 'responder'
      const mappedRole =
        user.role === "admin" || user.role === "responder"
          ? "responder"
          : "citizen";

      socket.identity = {
        type: "user",
        id: user.id,
        role: mappedRole, // This is what saveMessage({ senderRole }) uses
        name: user.name,
      };

      console.log(`Socket Authenticated: ${user.name} as ${mappedRole}`);
      return next();
    }

    if (guestId) {
      const guest = await Guest.findByPk(guestId);
      if (!guest) return next(new Error("Guest not found"));

      socket.identity = {
        type: "guest",
        id: guest.id,
        role: "citizen", // Guests are always treated as citizens/reporters
        name: guest.name || "Guest",
      };

      return next();
    }

    return next(new Error("Unauthorized: No credentials provided"));
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    return next(new Error("Authentication failed"));
  }
};
