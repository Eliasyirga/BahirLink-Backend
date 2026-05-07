const {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  getCategoriesByAgencyId,
  updateCategory,
} = require("../services/categoryService");
const { localize } = require("../utils/localize");

/**
 * Helper to extract language from headers
 */
const getLang = (req) => req.headers["accept-language"] || "en";

const createCategoryHandler = async (req, res) => {
  try {
    const { name, emergencyTypeId } = req.body;

    // Validate that name is the required object { en: "...", am: "..." }
    if (!name || typeof name !== "object" || !name.en) {
      return res.status(400).json({
        success: false,
        message: "Localization object with at least an English ('en') name is required.",
      });
    }

    if (!emergencyTypeId) {
      return res.status(400).json({ success: false, message: "emergencyTypeId is required" });
    }

    const category = await createCategory({ name, emergencyTypeId });

    return res.status(201).json({
      success: true,
      data: localize(category, getLang(req), ["name"]),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getAllCategoriesHandler = async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json({
      success: true,
      data: localize(categories, getLang(req), ["name"]),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getCategoriesByTypeHandler = async (req, res) => {
  try {
    const { emergencyTypeId } = req.params;
    const categories = await getCategoriesByEmergencyType(emergencyTypeId);
    return res.status(200).json({
      success: true,
      data: localize(categories, getLang(req), ["name"]),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getCategoriesByAgencyHandler = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const categories = await getCategoriesByAgencyId(agencyId);
    return res.status(200).json({
      success: true,
      data: localize(categories, getLang(req), ["name"]),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // If name is being updated, ensure it's still an object to prevent DB corruption
    if (req.body.name && (typeof req.body.name !== "object" || !req.body.name.en)) {
      return res.status(400).json({
        success: false,
        message: "When updating name, a valid localization object is required.",
      });
    }

    const updatedCategory = await updateCategory(id, req.body);
    
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: localize(updatedCategory, getLang(req), ["name"]),
    });
  } catch (err) {
    console.error("Update category error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

const deleteCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCategory(id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
  getCategoriesByTypeHandler,
  getCategoriesByAgencyHandler,
  updateCategoryHandler,
};