const jwt = require("jsonwebtoken");
const { User, Guest } = require("../models");

module.exports = async (socket, next) => {
  try {
    const { token, guestId } = socket.handshake.auth;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(payload.id);
      if (!user) return next(new Error("User not found"));

      socket.identity = {
        type: "user",
        id: user.id,
        role: user.role,        
        name: user.name,
      };

      return next();
    }

    if (guestId) {
      const guest = await Guest.findByPk(guestId);
      if (!guest) return next(new Error("Guest not found"));

      socket.identity = {
        type: "guest",
        id: guest.id,
        role: "guest",
        name: guest.name || "Guest",
      };

      return next();
    }

    return next(new Error("Unauthorized"));
  } catch (err) {
    return next(new Error("Authentication failed"));
  }
};
