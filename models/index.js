const Guest = require("./guest");
const Emergency = require("./Emergency");
const Message = require("./Message");
const User = require("./user");
const Category = require("./Category");
const EmergencyType = require("./EmergencyType");

// ---------------- Guest ↔ Emergency ----------------
Guest.hasMany(Emergency, { foreignKey: "guestId", as: "emergencies" });
Emergency.belongsTo(Guest, { foreignKey: "guestId", as: "guest" });

// ---------------- User ↔ Emergency ----------------
User.hasMany(Emergency, { foreignKey: "citizenId", as: "emergencies" });
Emergency.belongsTo(User, { foreignKey: "citizenId", as: "user" });

// ---------------- Emergency ↔ Message ----------------
Emergency.hasMany(Message, { foreignKey: "emergencyId", as: "messages" });
Message.belongsTo(Emergency, { foreignKey: "emergencyId", as: "emergency" });
// ---------------- EmergencyType ↔ Category ----------------

EmergencyType.hasMany(Category, {
  foreignKey: "emergencyTypeId",
  as: "categories",
  onDelete: "CASCADE",
});
Category.belongsTo(EmergencyType, {
  foreignKey: "emergencyTypeId",
  as: "emergencyType",
});

EmergencyType.hasMany(Emergency, {
  foreignKey: "emergencyTypeId",
  as: "emergencies",
});
Emergency.belongsTo(EmergencyType, {
  foreignKey: "emergencyTypeId",
  as: "emergencyType",
});

Emergency.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "SET NULL",
});

Category.hasMany(Emergency, {
  foreignKey: "categoryId",
  as: "emergencies",
});

module.exports = {
  Guest,
  Emergency,
  Message,
  User,
  Category,
  EmergencyType,
};
