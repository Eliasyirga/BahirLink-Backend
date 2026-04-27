const {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  updateCategory,
} = require("../services/categoryService");

const createCategoryHandler = async (req, res) => {
  try {
    const { name, emergencyTypeId } = req.body;

    // validation
    if (!name || !emergencyTypeId) {
      return res
        .status(400)
        .json({ message: "name and emergencyTypeId are required" });
    }

    const category = await createCategory({
      name,
      emergencyTypeId,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCategory(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllCategoriesHandler = async (req, res) => {
  try {
    const categories = await getAllCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getCategoriesByTypeHandler = async (req, res) => {
  try {
    const { emergencyTypeId } = req.params;

    const categories = await getCategoriesByEmergencyType(emergencyTypeId);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedCategory = await updateCategory(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (err) {
    console.error("Update category error:", err.message);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
  getCategoriesByTypeHandler,
  updateCategoryHandler,
};
