const categoryService = require("../services/serviceCategoryService");

// ✅ CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description, serviceTypeId } = req.body;
    const category = await categoryService.createCategory({
      name,
      description,
      serviceTypeId,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET CATEGORY BY ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json({ success: true, category });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

// ✅ GET CATEGORIES BY SERVICE TYPE ID (New Method)
const getCategoriesByServiceType = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;
    const categories =
      await categoryService.getCategoriesByServiceType(serviceTypeId);

    // Returning the list directly as 'categories' to match Flutter's expectations
    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

// ✅ UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    res.json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};
const getCategoriesByAgencyId = async (req, res) => {
  try {
    const { agencyId } = req.params;

    // 1. Validate Input
    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    // 2. Call the Logic Layer
    const categories = await categoryService.getCategoriesByAgencyId(agencyId);

    // 3. Send Success Response
    // Even if categories is empty [], we send 200 so the UI doesn't break
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    // 4. Detailed Error Logging for Backend Debugging
    console.error(
      "Error in getCategoriesByAgencyId Controller:",
      error.message,
    );

    // 5. Send Error Response to Frontend
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoriesByServiceType, // Added this
  updateCategory,
  deleteCategory,
  getCategoriesByAgencyId,
};
