const caseTypeService = require("../services/caseTypeService");

// ✅ CREATE CASE TYPE
const create = async (req, res) => {
  try {
    const { name } = req.body;

    // Helper to parse JSON string if name is sent as stringified JSON
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
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL CASE TYPES
const getAll = async (req, res) => {
  try {
    const caseTypes = await caseTypeService.getAllCaseTypes();
    return res.status(200).json({
      success: true,
      count: caseTypes.length,
      data: caseTypes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ONE CASE TYPE
const getOne = async (req, res) => {
  try {
    const caseType = await caseTypeService.getCaseTypeById(req.params.id);
    return res.status(200).json({
      success: true,
      data: caseType,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE CASE TYPE
const update = async (req, res) => {
  try {
    const updated = await caseTypeService.updateCaseType(
      req.params.id,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Case type updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ REMOVE CASE TYPE
const remove = async (req, res) => {
  try {
    const result = await caseTypeService.deleteCaseType(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
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