const {
  createCategory,
  deleteCategory,
  getAllCategories,
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

module.exports = {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
};
