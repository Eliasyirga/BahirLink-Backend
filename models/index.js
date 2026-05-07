const { sequelize } = require("../config/db");

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
const ResponderTeamKebele = require("./ResponderTeamKebele");
const Emerged = require("./Emerged");
const FinalReport = require("./FinalReport");

// =========================
// USER / GUEST RELATIONSHIPS
// =========================
Guest.hasMany(Emergency, { foreignKey: "guestId", as: "emergencies" });
Emergency.belongsTo(Guest, { foreignKey: "guestId", as: "guest" });

User.hasMany(Emergency, { foreignKey: "citizenId", as: "emergencies" });
Emergency.belongsTo(User, { foreignKey: "citizenId", as: "user" });

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

Category.hasMany(Emergency, { foreignKey: "categoryId", as: "emergencies" });
Emergency.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "SET NULL",
});

// =========================
// EMERGENCY TYPE ↔ AGENCY TYPE (M:M)
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
// EMERGENCY ↔ AGENCY
// =========================
Agency.hasMany(Emergency, { foreignKey: "agencyId", as: "emergencies" });
Emergency.belongsTo(Agency, { foreignKey: "agencyId", as: "agency" });

Agency.belongsTo(AgencyType, { foreignKey: "agencyTypeId", as: "agencyType" });
AgencyType.hasMany(Agency, { foreignKey: "agencyTypeId", as: "agencies" });

// =========================
// RESPONDER TEAMS & CREW
// =========================
Agency.hasMany(ResponderTeam, { foreignKey: "agencyId", as: "responderTeams" });
ResponderTeam.belongsTo(Agency, { foreignKey: "agencyId", as: "agency" });

ResponderTeam.hasMany(Crew, { foreignKey: "responderTeamId", as: "crews" });
Crew.belongsTo(ResponderTeam, {
  foreignKey: "responderTeamId",
  as: "responderTeam",
});

CrewRole.hasMany(Crew, { foreignKey: "roleId", as: "crews" });
Crew.belongsTo(CrewRole, { foreignKey: "roleId", as: "role" });

// =========================
// CASES & REPORTS
// =========================
Agency.hasMany(Cases, { foreignKey: "agencyId", as: "cases" });
Cases.belongsTo(Agency, { foreignKey: "agencyId", as: "agency" });

CaseType.hasMany(Cases, { foreignKey: "caseTypeId", as: "cases" });
Cases.belongsTo(CaseType, { foreignKey: "caseTypeId", as: "caseType" });

ResponderTeam.hasMany(Cases, { foreignKey: "responderTeamId", as: "cases" });
Cases.belongsTo(ResponderTeam, {
  foreignKey: "responderTeamId",
  as: "responderTeam",
});

Cases.hasMany(CaseReport, { foreignKey: "caseId", as: "reports" });
CaseReport.belongsTo(Cases, { foreignKey: "caseId", as: "case" });

CaseType.hasMany(CaseReport, { foreignKey: "caseTypeId", as: "reports" });
CaseReport.belongsTo(CaseType, { foreignKey: "caseTypeId", as: "caseType" });

Kebele.hasMany(CaseReport, { foreignKey: "kebeleId", as: "reports" });
CaseReport.belongsTo(Kebele, { foreignKey: "kebeleId", as: "kebele" });

// =========================
// PUBLIC SERVICES
// =========================
ServiceType.hasMany(ServiceCategory, {
  foreignKey: "serviceTypeId",
  as: "categories",
});
ServiceCategory.belongsTo(ServiceType, {
  foreignKey: "serviceTypeId",
  as: "serviceType",
});
Service.belongsTo(Kebele, { foreignKey: "kebeleId", as: "kebele" });
Kebele.hasMany(Service, { foreignKey: "kebeleId", as: "services" });

User.hasMany(Service, { foreignKey: "citizenId", as: "services" });
Service.belongsTo(User, { foreignKey: "citizenId", as: "citizen" });

ServiceType.hasMany(Service, { foreignKey: "serviceTypeId", as: "services" });
Service.belongsTo(ServiceType, {
  foreignKey: "serviceTypeId",
  as: "serviceType",
});

ServiceCategory.hasMany(Service, {
  foreignKey: "serviceCategoryId",
  as: "services",
});
Service.belongsTo(ServiceCategory, {
  foreignKey: "serviceCategoryId",
  as: "serviceCategory",
});

Kebele.hasMany(Cases, { foreignKey: "lastSeenLocationId", as: "cases" });
Cases.belongsTo(Kebele, {
  foreignKey: "lastSeenLocationId",
  as: "lastSeenLocation",
});

Emergency.belongsTo(Kebele, {
  foreignKey: "kebeleId",
  as: "kebele",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});

Kebele.hasMany(Emergency, { foreignKey: "kebeleId", as: "emergencies" });

ResponderTeam.belongsToMany(Kebele, {
  through: ResponderTeamKebele,
  foreignKey: "responderTeamId",
  as: "kebeles",
});

Kebele.belongsToMany(ResponderTeam, {
  through: ResponderTeamKebele,
  foreignKey: "kebeleId",
  as: "teams",
});

Emerged.hasMany(Emergency, {
  foreignKey: "emergedId",
  as: "emergencies",
});

Emergency.belongsTo(Emerged, {
  foreignKey: "emergedId",
  as: "emerged",
});

Emergency.hasOne(FinalReport, {
  foreignKey: "emergencyId",
  as: "finalReport",
});

FinalReport.belongsTo(Emergency, {
  foreignKey: "emergencyId",
  as: "emergency",
});

FinalReport.belongsTo(ResponderTeam, {
  foreignKey: "responderId", // This should match the column name in your final_reports table
  as: "responder", // This MUST match the alias used in your controller's "include"
});

// In your associations/index.js
User.hasMany(Agency, { foreignKey: "createdBy", as: "agencies" });
Agency.belongsTo(User, { foreignKey: "createdBy", as: "admin" });

// =========================
// EXPORTS
// =========================
module.exports = {
  sequelize,
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
  Kebele,
  ResponderTeamKebele,
  Emerged,
  FinalReport,
};
