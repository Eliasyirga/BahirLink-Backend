const FinalReport = require("../models/FinalReport");
const Emergency = require("../models/Emergency");
const EmergencyType = require("../models/EmergencyType");
const Category = require("../models/Category");

//
// 🧾 CREATE FINAL REPORT (minimal, NO include)
//
const createFinalReportFromEmergency = async (emergencyId) => {
  const emergency = await Emergency.findByPk(emergencyId);

  if (!emergency) {
    throw new Error("Emergency not found");
  }

  // prevent duplicates
  const existing = await FinalReport.findOne({
    where: { emergencyId },
  });

  if (existing) return existing;

  return await FinalReport.create({
    emergencyId: emergency.id,
    reporterId: emergency.citizenId || emergency.guestId,
    responderId: emergency.chatInitiatedByResponderTeamId || null,
    description: emergency.description,
    location: emergency.location,
    status: "resolved",
  });
};

//
// 📄 GET ALL FINAL REPORTS (with type + category)
//
const getAllFinalReports = async () => {
  return await FinalReport.findAll({
    include: [
      {
        model: Emergency,
        as: "emergency",
        include: [
          {
            model: EmergencyType,
            as: "EmergencyType",
            attributes: ["id", "name"],
          },
          {
            model: Category,
            as: "Category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

//
// 🔍 GET FINAL REPORT BY ID (with type + category)
//
const getFinalReportById = async (id) => {
  const report = await FinalReport.findByPk(id, {
    include: [
      {
        model: Emergency,
        as: "emergency",
        include: [
          {
            model: EmergencyType,
            as: "EmergencyType",
            attributes: ["id", "name"],
          },
          {
            model: Category,
            as: "Category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  });

  if (!report) {
    throw new Error("Final report not found");
  }

  return report;
};

//
// ✏️ UPDATE FINAL REPORT
//
const updateFinalReport = async (id, data) => {
  const report = await FinalReport.findByPk(id);

  if (!report) {
    throw new Error("Final report not found");
  }

  return await report.update(data);
};

//
// ❌ DELETE FINAL REPORT
//
const deleteFinalReport = async (id) => {
  const report = await FinalReport.findByPk(id);

  if (!report) {
    throw new Error("Final report not found");
  }

  await report.destroy();

  return { message: "Final report deleted successfully" };
};

//
// 📤 EXPORT
//
module.exports = {
  createFinalReportFromEmergency,
  getAllFinalReports,
  getFinalReportById,
  updateFinalReport,
  deleteFinalReport,
};
