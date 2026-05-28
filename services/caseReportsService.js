const CaseReport = require("../models/CaseReport");
const translate = require("google-translate-api-x");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (STRICT ENGLISH DEFAULT PIPELINE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanly extract and normalize the language tag.
 */
const normalizeLang = (raw) => {
  if (!raw || typeof raw !== "string") return "en";

  const primary = raw.split(/[,;-]/)[0].trim().toLowerCase();

  if (primary === "am" || primary === "all") return primary;
  return "en";
};

/**
 * Ensure description is stored as { en, am }.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  const data =
    typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const result = await translate(data.en, { to: "am" });
      data.am = result.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en;
    }
  }

  return data;
};

/**
 * Safely flatten localized translation maps.
 */
const flatStr = (field, lang = "en") => {
  if (!field) return null;
  if (typeof field === "string") return field;

  if (typeof field === "object") {
    if (field[lang] !== undefined && field[lang] !== null) return field[lang];
    if (field["en"] !== undefined && field["en"] !== null) return field["en"];
    if (field["am"] !== undefined && field["am"] !== null) return field["am"];
  }
  return String(field);
};

/**
 * Convert a Sequelize instance into a fully localized output dataset.
 */
const localize = (item, lang = "en", fields = []) => {
  if (!item) return null;

  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  fields.forEach((f) => {
    if (plain[f] !== null && plain[f] !== undefined) {
      plain[f] = flatStr(plain[f], lang);
    }
  });

  ["case", "caseType", "kebele"].forEach((assoc) => {
    if (!plain[assoc] || typeof plain[assoc] !== "object") return;

    const flatAssoc = { ...plain[assoc] };
    Object.keys(flatAssoc).forEach((key) => {
      if (
        flatAssoc[key] !== null &&
        typeof flatAssoc[key] === "object" &&
        !Array.isArray(flatAssoc[key])
      ) {
        flatAssoc[key] = flatStr(flatAssoc[key], lang);
      }
    });
    plain[assoc] = flatAssoc;
  });

  return plain;
};

const INCLUDES = [
  { association: "case" },
  { association: "caseType" },
  { association: "kebele" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new case report with added debug logging.
 */
const createReport = async (data, rawLang = "en") => {
  // DEBUG: Check what the server is actually receiving
  console.log(
    "DEBUG [createReport] - Payload received:",
    JSON.stringify(data, null, 2),
  );

  const lang = normalizeLang(rawLang);
  const description = await autoTranslate(data.description);

  try {
    const report = await CaseReport.create({
      description,
      caseId: data.caseId,
      caseTypeId: data.caseTypeId,
      kebeleId: data.kebeleId,
      spottedAt: data.spottedAt,
      reporterId: data.reporterId ?? null,
      // String() coercion preserves leading zeros (e.g. phone numbers starting with 0)
      phoneNumber: data.phoneNumber != null ? String(data.phoneNumber) : null,
    });

    console.log(
      "DEBUG [createReport] - Database Insert Result (ID):",
      report.id,
    );

    const freshRecord = await CaseReport.findByPk(report.id, {
      include: INCLUDES,
    });

    return lang === "all"
      ? freshRecord.get({ plain: true })
      : localize(freshRecord, lang, ["description"]);
  } catch (err) {
    console.error("DEBUG [createReport] - Error during Database save:", err);
    throw err; // Re-throw to be caught by the controller
  }
};

/**
 * Return every report, newest first.
 */
const getAllReports = async (rawLang = "en") => {
  const lang = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    include: INCLUDES,
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports for a single case.
 */
const getReportsByCase = async (caseId, rawLang = "en") => {
  const lang = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where: { caseId },
    include: INCLUDES,
    order: [["spottedAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports that belong to a given case type.
 */
const getReportsByCaseType = async (caseTypeId, rawLang = "en") => {
  const lang = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where: { caseTypeId },
    include: INCLUDES,
    order: [["spottedAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports filed by a specific reporter.
 */
const getReportsByReporter = async (reporterId, rawLang = "en") => {
  const lang = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where: { reporterId },
    include: INCLUDES,
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Flip the status field on a single report.
 */
const updateReportStatus = async (reportId, status) => {
  const report = await CaseReport.findByPk(reportId);
  if (!report) throw new Error("Report not found");

  report.status = status;
  await report.save();
  return report;
};

/**
 * Hard-delete a report.
 */
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
