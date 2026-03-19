const Guest = require("./guest");
const Emergency = require("./Emergency");
const Message = require("./Message");
const User = require("./user");
const Category = require("./Category");
const EmergencyType = require("./EmergencyType");
const AgencyType = require("./AgencyType");
const Agency = require("./Agency");
const ResponderTeam = require("./ResponderTeam");
const Crew = require("./Crew");
const CrewRole = require("./CrewRole");
const CaseType = require("./CaseType");
const Cases = require("./Cases");


Guest.hasMany(Emergency, { foreignKey: "guestId", as: "emergencies" });
Emergency.belongsTo(Guest, { foreignKey: "guestId", as: "guest" });

User.hasMany(Emergency, { foreignKey: "citizenId", as: "emergencies" });
Emergency.belongsTo(User, { foreignKey: "citizenId", as: "user" });

Emergency.hasMany(Message, { foreignKey: "emergencyId", as: "messages" });
Message.belongsTo(Emergency, { foreignKey: "emergencyId", as: "emergency" });

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

Agency.belongsTo(AgencyType, { foreignKey: "agencyTypeId" });
AgencyType.hasMany(Agency, { foreignKey: "agencyTypeId" });

ResponderTeam.belongsTo(Agency, { foreignKey: "agencyId" });
Agency.hasMany(ResponderTeam, { foreignKey: "agencyId" });

Crew.belongsTo(ResponderTeam, { foreignKey: "responderTeamId" });
ResponderTeam.hasMany(Crew, { foreignKey: "responderTeamId" });

Crew.belongsTo(CrewRole, { foreignKey: "roleId" });
CrewRole.hasMany(Crew, { foreignKey: "roleId" });

Cases.belongsTo(Agency, { foreignKey: "agencyId", as: "agency" });
Agency.hasMany(Cases, { foreignKey: "agencyId", as: "cases" });

Cases.belongsTo(CaseType, { foreignKey: "caseTypeId", as: "caseType" });
CaseType.hasMany(Cases, { foreignKey: "caseTypeId", as: "cases" });

Cases.belongsTo(ResponderTeam, {
  foreignKey: "responderTeamId",
  as: "responderTeam",
});
ResponderTeam.hasMany(Cases, { foreignKey: "responderTeamId", as: "cases" });

module.exports = {
  Guest,
  Emergency,
  Message,
  User,
  Category,
  EmergencyType,
  Agency,
  AgencyType,
  ResponderTeam,
  Crew,
  CrewRole,
  CaseType,
  Cases,
};
