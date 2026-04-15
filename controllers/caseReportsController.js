const caseReportsService = require("../services/caseReportsService");

// ✅ CREATE REPORT
const createReport = async (req, res) => {
  try {
    // If you use authentication middleware, you might want to attach
    // the reporterId automatically from the token:
    // const reportData = { ...req.body, reporterId: req.user?.id };

    const report = await caseReportsService.createReport(req.body);
    res.status(201).json({ success: true, report });
  } catch (error) {
    // 400 Bad Request for validation or logic errors
    res.status(400).json({ success: false, error: error.message });
  }
};

// ✅ GET ALL REPORTS
const getAllReports = async (req, res) => {
  try {
    const reports = await caseReportsService.getAllReports();
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ GET REPORTS BY CASE
const getReportsByCase = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByCase(
      req.params.caseId,
    );
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// ✅ GET REPORTS BY CASE TYPE
const getReportsByCaseType = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByCaseType(
      req.params.caseTypeId,
    );
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// ✅ GET REPORTS BY REPORTER
const getReportsByReporter = async (req, res) => {
  try {
    const reports = await caseReportsService.getReportsByReporter(
      req.params.reporterId,
    );
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// ✅ UPDATE REPORT STATUS
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await caseReportsService.updateReportStatus(
      req.params.id,
      status,
    );
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ✅ DELETE REPORT
const deleteReport = async (req, res) => {
  try {
    const result = await caseReportsService.deleteReport(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
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
