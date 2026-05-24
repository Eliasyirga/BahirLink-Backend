const CaseReport = require("../models/CaseReport");
const translate   = require("google-translate-api-x");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (STRICT ENGLISH DEFAULT PIPELINE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanly extract and normalize the language tag.
 * Forces a hard fallback to "en" if string is empty, missing, or unsupported.
 */
const normalizeLang = (raw) => {
  if (!raw || typeof raw !== "string") return "en";
  
  // Strip out HTTP weights and sub-tags (e.g., "en-US,en;q=0.9" → "en")
  const primary = raw.split(/[,;-]/)[0].trim().toLowerCase();
  
  if (primary === "am" || primary === "all") return primary;
  return "en"; // Enforce absolute default
};

/**
 * Ensure description is stored as { en, am }.
 * If only English is supplied, auto-translate to Amharic.
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
      data.am = data.en; // graceful fallback
    }
  }

  return data;
};

/**
 * Safely flatten localized translation maps.
 * Explicitly targets English ("en") before parsing any secondary languages.
 */
const flatStr = (field, lang = "en") => {
  if (!field) return null;
  if (typeof field === "string") return field;
  
  if (typeof field === "object") {
    // 1. If the designated language exists, use it
    if (field[lang] !== undefined && field[lang] !== null) {
      return field[lang];
    }
    // 2. Strict Fallback: Always favor English over other keys if target language is missing
    if (field["en"] !== undefined && field["en"] !== null) {
      return field["en"];
    }
    // 3. Fall back to Amharic as a final measure
    if (field["am"] !== undefined && field["am"] !== null) {
      return field["am"];
    }
  }
  return String(field);
};

/**
 * Convert a Sequelize instance or plain object into a fully localized output dataset.
 */
const localize = (item, lang = "en", fields = []) => {
  if (!item) return null;

  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  // Flatten top-level dynamic JSONB structures (e.g., "description")
  fields.forEach((f) => {
    if (plain[f] !== null && plain[f] !== undefined) {
      plain[f] = flatStr(plain[f], lang);
    }
  });

  // Deep flatten associated nested object models
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

// Standard system relations configuration
const INCLUDES = [
  { association: "case"     },
  { association: "caseType" },
  { association: "kebele"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new case report.
 */
const createReport = async (data, rawLang = "en") => {
  const lang = normalizeLang(rawLang);
  const description = await autoTranslate(data.description);

  const report = await CaseReport.create({
    description,
    caseId:     data.caseId,
    caseTypeId: data.caseTypeId,
    kebeleId:   data.kebeleId,
    spottedAt:  data.spottedAt,
    reporterId: data.reporterId ?? null,
  });

  const freshRecord = await CaseReport.findByPk(report.id, { include: INCLUDES });
  
  if (lang === "all") return freshRecord ? freshRecord.get({ plain: true }) : null;
  return localize(freshRecord, lang, ["description"]);
};

/**
 * Return every report, newest first.
 */
const getAllReports = async (rawLang = "en") => {
  const lang    = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    include: INCLUDES,
    order:   [["createdAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports for a single case.
 */
const getReportsByCase = async (caseId, rawLang = "en") => {
  const lang    = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where:   { caseId },
    include: INCLUDES,
    order:   [["spottedAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports that belong to a given case type.
 */
const getReportsByCaseType = async (caseTypeId, rawLang = "en") => {
  const lang    = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where:   { caseTypeId },
    include: INCLUDES,
    order:   [["spottedAt", "DESC"]],
  });

  if (lang === "all") return reports.map((r) => r.get({ plain: true }));
  return reports.map((r) => localize(r, lang, ["description"]));
};

/**
 * Return all reports filed by a specific reporter.
 */
const getReportsByReporter = async (reporterId, rawLang = "en") => {
  const lang    = normalizeLang(rawLang);
  const reports = await CaseReport.findAll({
    where:   { reporterId },
    include: INCLUDES,
    order:   [["createdAt", "DESC"]],
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