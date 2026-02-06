const Guest = require("./guest");
const Emergency = require("./Emergency");

Guest.hasMany(Emergency, { foreignKey: "guestId" });
Emergency.belongsTo(Guest, { foreignKey: "guestId" });

module.exports = {
  Guest,
  Emergency
};
