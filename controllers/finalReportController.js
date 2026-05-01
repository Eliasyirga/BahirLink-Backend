const {
  createFinalReportFromEmergency,
  getAllFinalReports,
  getFinalReportById,
  updateFinalReport,
  deleteFinalReport,
} = require("../services/finalReportService");

//
// 🧾 CREATE FINAL REPORT
// (usually auto-triggered when emergency is resolved)
//
const createFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.body;

    const report = await createFinalReportFromEmergency(emergencyId);

    return res.status(201).json({
      success: true,
      message: "Final report created successfully",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📄 GET ALL FINAL REPORTS
//
const getAll = async (req, res) => {
  try {
    const reports = await getAllFinalReports();

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 🔍 GET FINAL REPORT BY ID
//
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await getFinalReportById(id);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ✏️ UPDATE FINAL REPORT
//
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await updateFinalReport(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Final report updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ❌ DELETE FINAL REPORT
//
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteFinalReport(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📤 EXPORT
//
module.exports = {
  createFinalReport,
  getAll,
  getById,
  update,
  remove,
};