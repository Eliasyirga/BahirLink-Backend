const emergencyTypeService = require("../services/emergencyTypeService");

/**
 * CREATE Emergency Type
 */
const createEmergencyType = async (req, res) => {
  try {
    // Pass the body directly. The service should handle 
    // string-to-object conversion/translation.
    const emergencyType = await emergencyTypeService.createEmergencyType(req.body);

    return res.status(201).json({
      success: true,
      data: emergencyType,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create emergency type",
      error: err.message,
    });
  }
};

/**
 * DELETE Emergency Type
 */
const deleteEmergencyType = async (req, res) => {
  try {
    const success = await emergencyTypeService.deleteEmergencyType(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Emergency Type not found",
      });
    }

    return res.json({
      success: true,
      message: "Emergency Type deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete emergency type",
      error: err.message,
    });
  }
};

/**
 * GET ALL Emergency Types
 * FIX: This intelligently decides whether to return a single language 
 * string or the raw JSON object for debugging.
 */
const getAllEmergencyTypes = async (req, res) => {
  try {
    /**
     * LOGIC FIX:
     * 1. In Postman, if you send Header 'Accept-Language: am', you get Amharic strings.
     * 2. In Postman, if you send Header 'Accept-Language: all', you get the full JSON objects.
     * 3. Default is English ('en').
     */
    const lang = req.headers['accept-language'] || 'en';

    // Call service. If lang is 'all', service should return the raw DB rows.
    const emergencyTypes = await emergencyTypeService.getAllEmergencyTypes(lang);

    return res.json({
      success: true,
      count: emergencyTypes.length,
      data: emergencyTypes, 
    });
  } catch (err) {
    console.error("Error in getAllEmergencyTypes:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency types",
      error: err.message,
    });
  }
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};