const {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  updateCategory,
} = require("../services/categoryService");

const createCategoryHandler = async (req, res) => {
  try {
    const { name, type, emergencyTypeId } = req.body;

    if (!name || !type || !emergencyTypeId) {
      return res
        .status(400)
        .json({ message: "name, type, and emergencyTypeId are required" });
    }

    const category = await createCategory({ name, type, emergencyTypeId });
    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const deleteCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCategory(id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const getAllCategoriesHandler = async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const getCategoriesByTypeHandler = async (req, res) => {
  try {
    const { emergencyTypeId } = req.params;

    const categories = await getCategoriesByEmergencyType(emergencyTypeId);

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(400).json({ message: err.message });
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
      error: err.message,
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
