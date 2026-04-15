const CaseReport = require("../models/CaseReport");

// ✅ CREATE REPORT
const createReport = async (data) => {
  const report = await CaseReport.create({
    description: data.description,
    caseId: data.caseId,
    caseTypeId: data.caseTypeId,
    kebeleId: data.kebeleId, // Added from new model
    spottedAt: data.spottedAt, // Added from new model
    reporterId: data.reporterId || null,
  });

  // Re-fetching with all associations including the new Kebele relation
  return await CaseReport.findByPk(report.id, {
    include: ["case", "caseType", "kebele"],
  });
};

// ✅ GET ALL REPORTS
const getAllReports = async () => {
  return await CaseReport.findAll({
    include: ["case", "caseType", "kebele"], // Added kebele to includes
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET REPORTS BY CASE
const getReportsByCase = async (caseId) => {
  return await CaseReport.findAll({
    where: { caseId },
    include: ["caseType", "case", "kebele"], // Added kebele to includes
  });
};

// ✅ GET REPORTS BY CASE TYPE
const getReportsByCaseType = async (caseTypeId) => {
  return await CaseReport.findAll({
    where: { caseTypeId },
    include: ["case", "caseType", "kebele"], // Added kebele to includes
  });
};

// ✅ GET REPORTS BY REPORTER
const getReportsByReporter = async (reporterId) => {
  return await CaseReport.findAll({
    where: { reporterId },
    include: ["case", "caseType", "kebele"], // Added kebele to includes
  });
};

// ✅ UPDATE REPORT STATUS
const updateReportStatus = async (reportId, status) => {
  const report = await CaseReport.findByPk(reportId);
  if (!report) throw new Error("Report not found");

  report.status = status;
  await report.save();
  return report;
};

// ✅ DELETE REPORT
const deleteReport = async (reportId) => {
  const report = await CaseReport.findByPk(reportId);
  if (!report) throw new Error("Report not found");

  await report.destroy();
  return { message: "Report deleted successfully" };
};

module.exports = {
  createReport,
  getAllReports,
  getReportsByCase,
  getReportsByCaseType,
  getReportsByReporter,
  updateReportStatus,
  deleteReport,
};
