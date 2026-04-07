const CaseReport = require("../models/CaseReport");

// ✅ CREATE REPORT
const createReport = async (data) => {
  const report = await CaseReport.create({
    description: data.description,
    caseId: data.caseId,
    caseTypeId: data.caseTypeId,
    reporterId: data.reporterId || null,
  });

  return await CaseReport.findByPk(report.id, {
    include: ["case", "caseType"],
  });
};

// ✅ GET ALL REPORTS
const getAllReports = async () => {
  return await CaseReport.findAll({
    include: ["case", "caseType"],
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET REPORTS BY CASE
const getReportsByCase = async (caseId) => {
  return await CaseReport.findAll({
    where: { caseId },
    include: ["caseType", "case"],
  });
};

// ✅ GET REPORTS BY CASE TYPE
const getReportsByCaseType = async (caseTypeId) => {
  return await CaseReport.findAll({
    where: { caseTypeId },
    include: ["case", "caseType"],
  });
};

// ✅ GET REPORTS BY REPORTER
const getReportsByReporter = async (reporterId) => {
  return await CaseReport.findAll({
    where: { reporterId },
    include: ["case", "caseType"],
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