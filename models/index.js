const Guest = require("./guest");
const Emergency = require("./Emergency");
const Message = require("./Message");
const User = require("./user"); 


Guest.hasMany(Emergency, { foreignKey: "guestId" });
Emergency.belongsTo(Guest, { foreignKey: "guestId" });

Emergency.hasMany(Message, { foreignKey: "emergencyId" });
Message.belongsTo(Emergency, { foreignKey: "emergencyId" });

module.exports = {
  Guest,
  Emergency,
  Message,
  User,
};
