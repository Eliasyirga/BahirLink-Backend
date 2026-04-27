const emergencyTypeService = require("../services/emergencyTypeService");

/**
 * CREATE Emergency Type
 */
const createEmergencyType = async (req, res) => {
  try {
    const emergencyType = await emergencyTypeService.createEmergencyType(
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: emergencyType,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE Emergency Type
 */
const deleteEmergencyType = async (req, res) => {
  try {
    const success = await emergencyTypeService.deleteEmergencyType(
      req.params.id,
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "EmergencyType not found",
      });
    }

    return res.json({
      success: true,
      message: "EmergencyType deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET ALL Emergency Types
 */
const getAllEmergencyTypes = async (req, res) => {
  try {
    const emergencyTypes = await emergencyTypeService.getAllEmergencyTypes();

    return res.json({
      success: true,
      data: emergencyTypes, // ✅ consistent API structure
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};
