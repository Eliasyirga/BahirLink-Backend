const CaseReport = require("../models/CaseReport");
const translate = require("google-translate-api-x");

/**
 * HELPER: Auto-Translate
 * Ensures description stores a full { en, am } object.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;
  let data = typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en;
    }
  }
  return data;
};

/**
 * HELPER: Localize
 * Flattens JSONB fields based on requested language.
 */
const localize = (item, lang, fields) => {
  if (!item) return null;
  const plainItem = typeof item.get === "function" ? item.get({ plain: true }) : item;

  fields.forEach((field) => {
    if (plainItem[field] && typeof plainItem[field] === "object") {
      plainItem[field] = plainItem[field][lang] || plainItem[field]["en"] || Object.values(plainItem[field])[0];
    }
  });

  // Note: If associated models (Case, CaseType) also use JSONB for names, 
  // you should localize them here as well.
  if (plainItem.case) plainItem.case = localize(plainItem.case, lang, ["name"]);
  if (plainItem.caseType) plainItem.caseType = localize(plainItem.caseType, lang, ["name"]);

  return plainItem;
};

// ✅ CREATE REPORT
const createReport = async (data) => {
  // Apply translation to description
  const translatedDesc = await autoTranslate(data.description);

  const report = await CaseReport.create({
    description: translatedDesc,
    caseId: data.caseId,
    caseTypeId: data.caseTypeId,
    kebeleId: data.kebeleId,
    spottedAt: data.spottedAt,
    reporterId: data.reporterId || null,
  });

  return await CaseReport.findByPk(report.id, {
    include: ["case", "caseType", "kebele"],
  });
};

// ✅ GET ALL REPORTS
const getAllReports = async (lang = "en") => {
  const reports = await CaseReport.findAll({
    include: ["case", "caseType", "kebele"],
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return reports;
  return reports.map((report) => localize(report, lang, ["description"]));
};

// ✅ GET REPORTS BY CASE
const getReportsByCase = async (caseId, lang = "en") => {
  const reports = await CaseReport.findAll({
    where: { caseId },
    include: ["caseType", "case", "kebele"],
  });

  if (lang === "all") return reports;
  return reports.map((report) => localize(report, lang, ["description"]));
};

// ✅ GET REPORTS BY REPORTER
const getReportsByReporter = async (reporterId, lang = "en") => {
  const reports = await CaseReport.findAll({
    where: { reporterId },
    include: ["case", "caseType", "kebele"],
  });

  if (lang === "all") return reports;
  return reports.map((report) => localize(report, lang, ["description"]));
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
  getReportsByReporter,
  updateReportStatus,
  deleteReport,
};