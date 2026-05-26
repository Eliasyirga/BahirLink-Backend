const emergencyTypeService = require("../services/emergencyTypeService");

const createEmergencyType = async (req, res) => {
  try {
    const emergencyType = await emergencyTypeService.createEmergencyType(req.body);
    return res.status(201).json({ success: true, data: emergencyType });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create emergency type",
      error: err.message,
    });
  }
};

const deleteEmergencyType = async (req, res) => {
  try {
    const success = await emergencyTypeService.deleteEmergencyType(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Emergency Type not found" });
    }
    return res.json({ success: true, message: "Emergency Type deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete emergency type",
      error: err.message,
    });
  }
};

const getAllEmergencyTypes = async (req, res) => {
  try {
    // Priority order:
    // 1. ?lang=raw  query param (used by CategoryPage internally)
    // 2. Accept-Language header (used by Postman / external consumers)
    // 3. Default to "en"
    const lang = req.query.lang || req.headers["accept-language"] || "en";

    const emergencyTypes = await emergencyTypeService.getAllEmergencyTypes(lang);
    return res.json({ success: true, count: emergencyTypes.length, data: emergencyTypes });
  } catch (err) {
    console.error("Error in getAllEmergencyTypes:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency types",
      error: err.message,
    });
  }
};

module.exports = { createEmergencyType, deleteEmergencyType, getAllEmergencyTypes };