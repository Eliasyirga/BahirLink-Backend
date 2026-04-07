// models/index.js

// =========================
// IMPORT MODELS
// =========================
const Guest = require("./Guest");
const Emergency = require("./Emergency");
const Message = require("./Message");
const User = require("./User");
const Category = require("./Category");
const EmergencyType = require("./EmergencyType");
const AgencyType = require("./AgencyType");
const Agency = require("./Agency");
const ResponderTeam = require("./ResponderTeam");
const Crew = require("./Crew");
const CrewRole = require("./CrewRole");
const CaseType = require("./CaseType");
const Cases = require("./Cases");
const ServiceType = require("./ServiceType");
const ServiceCategory = require("./ServiceCategory");
const Service = require("./Service");
const Kebele = require("./Kebele");
const CaseReport = require("./CaseReport");

// =========================
// USER / GUEST RELATIONSHIPS
// =========================
Guest.hasMany(Emergency, { foreignKey: "guestId", as: "emergencies" });
Emergency.belongsTo(Guest, { foreignKey: "guestId", as: "guest" });

User.hasMany(Emergency, { foreignKey: "citizenId", as: "emergencies" });
Emergency.belongsTo(User, { foreignKey: "citizenId", as: "user" });

// =========================
// EMERGENCY CORE
// =========================
Emergency.hasMany(Message, { foreignKey: "emergencyId", as: "messages" });
Message.belongsTo(Emergency, { foreignKey: "emergencyId", as: "emergency" });

EmergencyType.hasMany(Emergency, {
  foreignKey: "emergencyTypeId",
  as: "emergencies",
});
Emergency.belongsTo(EmergencyType, {
  foreignKey: "emergencyTypeId",
  as: "emergencyType",
});

EmergencyType.hasMany(Category, {
  foreignKey: "emergencyTypeId",
  as: "categories",
  onDelete: "CASCADE",
});
Category.belongsTo(EmergencyType, {
  foreignKey: "emergencyTypeId",
  as: "emergencyType",
});

Category.hasMany(Emergency, {
  foreignKey: "categoryId",
  as: "emergencies",
});
Emergency.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "SET NULL",
});

// =========================
// EMERGENCY TYPE ↔ AGENCY TYPE (many-to-many)
// =========================
EmergencyType.belongsToMany(AgencyType, {
  through: "EmergencyTypeAgencyTypes",
  foreignKey: "emergencyTypeId",
  otherKey: "agencyTypeId",
  as: "agencyTypes",
});
AgencyType.belongsToMany(EmergencyType, {
  through: "EmergencyTypeAgencyTypes",
  foreignKey: "agencyTypeId",
  otherKey: "emergencyTypeId",
  as: "emergencyTypes",
});

// =========================
// AGENCY STRUCTURE
// =========================
Agency.belongsTo(AgencyType, {
  foreignKey: "agencyTypeId",
  as: "agencyType",
});
AgencyType.hasMany(Agency, {
  foreignKey: "agencyTypeId",
  as: "agencies",
});

// =========================
// RESPONDER TEAM
// =========================
Agency.hasMany(ResponderTeam, {
  foreignKey: "agencyId",
  as: "responderTeams",
});
ResponderTeam.belongsTo(Agency, {
  foreignKey: "agencyId",
  as: "agency",
});

// =========================
// CREW
// =========================
ResponderTeam.hasMany(Crew, {
  foreignKey: "responderTeamId",
  as: "crews",
});
Crew.belongsTo(ResponderTeam, {
  foreignKey: "responderTeamId",
  as: "responderTeam",
});

CrewRole.hasMany(Crew, {
  foreignKey: "roleId",
  as: "crews",
});
Crew.belongsTo(CrewRole, {
  foreignKey: "roleId",
  as: "role",
});

// =========================
// CASES
// =========================
Agency.hasMany(Cases, {
  foreignKey: "agencyId",
  as: "cases",
});
Cases.belongsTo(Agency, {
  foreignKey: "agencyId",
  as: "agency",
});

CaseType.hasMany(Cases, {
  foreignKey: "caseTypeId",
  as: "cases",
});
Cases.belongsTo(CaseType, {
  foreignKey: "caseTypeId",
  as: "caseType",
});

ResponderTeam.hasMany(Cases, {
  foreignKey: "responderTeamId",
  as: "cases",
});
Cases.belongsTo(ResponderTeam, {
  foreignKey: "responderTeamId",
  as: "responderTeam",
});

ServiceType.hasMany(ServiceCategory, { foreignKey: "serviceTypeId" });
ServiceCategory.belongsTo(ServiceType, { foreignKey: "serviceTypeId" });

// A User can have many Services
User.hasMany(Service, { foreignKey: "citizenId" });

// Each Service belongs to a User (optional)
Service.belongsTo(User, { foreignKey: "citizenId" });

// ServiceType -> Service (one-to-many)
ServiceType.hasMany(Service, { foreignKey: "serviceTypeId" });
Service.belongsTo(ServiceType, { foreignKey: "serviceTypeId" });

// ServiceCategory -> Service (one-to-many)
ServiceCategory.hasMany(Service, { foreignKey: "serviceCategoryId" });
Service.belongsTo(ServiceCategory, { foreignKey: "serviceCategoryId" });

// 🔹 Relations
Kebele.hasMany(Cases, { foreignKey: "lastSeenLocationId" });
Cases.belongsTo(Kebele, { foreignKey: "lastSeenLocationId" });

// Associations
Cases.hasMany(CaseReport, { foreignKey: "caseId" });
CaseReport.belongsTo(Cases, { foreignKey: "caseId" });

CaseType.hasMany(CaseReport, { foreignKey: "caseTypeId" });
CaseReport.belongsTo(CaseType, { foreignKey: "caseTypeId" });

Emergency.belongsTo(Kebele, {
  foreignKey: "kebeleId", // column in Emergency table
  as: "kebele", // optional alias for easier include
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});
Kebele.hasMany(Emergency, {
  foreignKey: "kebeleId",
  as: "emergencies", // optional alias for easier include
});

// Kebele belongs to one ResponderTeam
Kebele.belongsTo(ResponderTeam, { foreignKey: "responderTeamId", as: "team" });
// ResponderTeam has many Kebeles
ResponderTeam.hasMany(Kebele, { foreignKey: "responderTeamId", as: "kebeles" });

// =========================
// EXPORTS
// =========================
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
  ServiceType,
  ServiceCategory,
  Service,
  CaseReport,
};
