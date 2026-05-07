const caseTypeService = require("../services/caseTypeService");

/**
 * ✅ CREATE CASE TYPE
 * Standardized to handle localized JSON objects
 */
const create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }

    // Standard parser for localized fields sent via FormData or JSON
    const parseField = (field) => {
      try {
        return typeof field === 'string' && field.includes('{') ? JSON.parse(field) : field;
      } catch (e) {
        return field;
      }
    };

    const caseType = await caseTypeService.createCaseType({
      name: parseField(name)
    });

    return res.status(201).json({
      success: true,
      message: "Case type created successfully",
      data: caseType,
    });
  } catch (error) {
    console.error("❌ Controller Error [createCaseType]:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ✅ GET ALL CASE TYPES
 * Supports: ?lang=en, ?lang=am
 */
const getAll = async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const caseTypes = await caseTypeService.getAllCaseTypes(lang);

    return res.status(200).json({
      success: true,
      count: caseTypes.length,
      data: caseTypes,
    });
  } catch (error) {
    console.error("❌ Controller Error [getAllCaseTypes]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ GET ONE CASE TYPE
 */
const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "all"; // Use 'all' for admin editing views

    const caseType = await caseTypeService.getCaseTypeById(id, lang);
    return res.status(200).json({
      success: true,
      data: caseType,
    });
  } catch (error) {
    console.error("❌ Controller Error [getCaseTypeById]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * ✅ UPDATE CASE TYPE
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We pass the whole body to handle partial updates to the name JSONB
    const updated = await caseTypeService.updateCaseType(id, req.body);
    
    return res.status(200).json({
      success: true,
      message: "Case type updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Controller Error [updateCaseType]:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ✅ REMOVE CASE TYPE
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await caseTypeService.deleteCaseType(id);
    
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Controller Error [deleteCaseType]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};