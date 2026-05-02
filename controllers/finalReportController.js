const finalReportService = require("../services/finalReportService");

/**
 * ✅ CREATE FINAL REPORT
 * POST /api/finalReport/:emergencyId
 */
const createFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    // 🔐 Get Responder ID from auth middleware
    const responderId = req.user?.id || null;

    // 🧹 Sanitize numerical inputs to ensure they are Integers for DB safety
    const payload = {
      ...req.body,
      injuredCount: parseInt(req.body.injuredCount) || 0,
      deceasedCount: parseInt(req.body.deceasedCount) || 0,
    };

    const report = await finalReportService.createFinalReport(
      emergencyId,
      payload,
      responderId,
    );

    return res.status(201).json({
      success: true,
      message: "Final report created and emergency resolved successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Create Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ UPDATE FINAL REPORT
 * PUT /api/finalReport/:emergencyId
 */
const updateFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    // Sanitize numerical inputs if they exist in the update body
    const payload = { ...req.body };
    if (payload.injuredCount !== undefined) {
      payload.injuredCount = parseInt(payload.injuredCount) || 0;
    }
    if (payload.deceasedCount !== undefined) {
      payload.deceasedCount = parseInt(payload.deceasedCount) || 0;
    }

    const report = await finalReportService.updateFinalReport(
      emergencyId,
      payload,
    );

    return res.status(200).json({
      success: true,
      message: "Final report updated successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Update Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ VERIFY FINAL REPORT (ADMIN ACTION)
 * PATCH /api/finalReport/:emergencyId/verify
 */
const verifyFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const adminId = req.user?.id || null;

    const report = await finalReportService.verifyFinalReport(
      emergencyId,
      adminId,
    );

    return res.status(200).json({
      success: true,
      message: "Final report verified successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Verify Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ ARCHIVE FINAL REPORT
 * PATCH /api/finalReport/:emergencyId/archive
 */
const archiveFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const report = await finalReportService.archiveFinalReport(emergencyId);

    return res.status(200).json({
      success: true,
      message: "Final report archived successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Archive Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ GET SINGLE FINAL REPORT
 * GET /api/finalReport/:emergencyId
 */
const getFinalReportByEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const report =
      await finalReportService.getFinalReportByEmergency(emergencyId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Final report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Get One Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ GET ALL FINAL REPORTS
 * GET /api/finalReport
 */
const getAllFinalReports = async (req, res) => {
  try {
    const reports = await finalReportService.getAllFinalReports();

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    console.error("❌ Controller Get All Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createFinalReport,
  updateFinalReport,
  verifyFinalReport,
  archiveFinalReport,
  getFinalReportByEmergency,
  getAllFinalReports,
};
