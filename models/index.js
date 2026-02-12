const Guest = require("./guest");
const Emergency = require("./Emergency");
const Message = require("./Message");
const User = require("./user");

// ---------------- Guest ↔ Emergency ----------------
Guest.hasMany(Emergency, { foreignKey: "guestId", as: "emergencies" });
Emergency.belongsTo(Guest, { foreignKey: "guestId", as: "guest" });

// ---------------- User ↔ Emergency ----------------
User.hasMany(Emergency, { foreignKey: "citizenId", as: "emergencies" });
Emergency.belongsTo(User, { foreignKey: "citizenId", as: "user" });

// ---------------- Emergency ↔ Message ----------------
Emergency.hasMany(Message, { foreignKey: "emergencyId", as: "messages" });
Message.belongsTo(Emergency, { foreignKey: "emergencyId", as: "emergency" });

module.exports = {
  Guest,
  Emergency,
  Message,
  User,
};
