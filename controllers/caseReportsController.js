const caseReportsService = require("../services/caseReportsService");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract and normalize lang from ?lang= query param or Accept-Language header.
 */
const getLang = (req) => {
  const raw = req.query.lang || req.headers["accept-language"] || "en";
  return raw.split(/[,;-]/)[0].trim().toLowerCase() || "en";
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/case-reports */
const createReport = async (req, res) => {
  try {
    // Pass req.body and the language context to the service
    const report = await caseReportsService.createReport(
      req.body,
      getLang(req),
    );
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/** GET /api/case-reports */
const getAllReports = async (req, res) => {
  try {
    const reports = await caseReportsService.getAllReports(getLang(req));
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** GET /api/case-reports/case/:caseId */
const getReportsByCase = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByCase(
      req.params.caseId,
      getLang(req),
    );
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

/** GET /api/case-reports/type/:caseTypeId */
const getReportsByCaseType = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByCaseType(
      req.params.caseTypeId,
      getLang(req),
    );
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

/** GET /api/case-reports/reporter/:reporterId */
const getReportsByReporter = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByReporter(
      req.params.reporterId,
      getLang(req),
    );
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

/** PATCH /api/case-reports/status/:id */
const updateReportStatus = async (req, res) => {
  try {
    const report = await caseReportsService.updateReportStatus(
      req.params.id,
      req.body.status,
    );
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/** DELETE /api/case-reports/:id */
const deleteReport = async (req, res) => {
  try {
    const result = await caseReportsService.deleteReport(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
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
