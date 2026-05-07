const categoryService = require("../services/serviceCategoryService");

// ✅ CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description, serviceTypeId } = req.body;

    /**
     * Parsing logic: Ensures that if 'name' or 'description' are sent as 
     * JSON strings (common in multipart/form-data), they are converted to objects.
     */
    const parseField = (field) => {
      try {
        return typeof field === 'string' && field.includes('{') ? JSON.parse(field) : field;
      } catch (e) {
        return field;
      }
    };

    const category = await categoryService.createCategory({
      name: parseField(name),
      description: parseField(description),
      serviceTypeId,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (err) {
    console.error("❌ Controller Error (Category Create):", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return res.status(200).json({ 
      success: true, 
      count: categories.length,
      data: categories 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ GET CATEGORY BY ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    return res.status(404).json({ success: false, error: err.message });
  }
};

// ✅ GET CATEGORIES BY SERVICE TYPE ID
const getCategoriesByServiceType = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;
    const categories = await categoryService.getCategoriesByServiceType(serviceTypeId);

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    return res.status(404).json({ success: false, error: err.message });
  }
};

// ✅ UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message || "Category deleted successfully",
    });
  } catch (err) {
    return res.status(404).json({ success: false, error: err.message });
  }
};

// ✅ GET CATEGORIES BY AGENCY ID
const getCategoriesByAgencyId = async (req, res) => {
  try {
    const { agencyId } = req.params;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    const categories = await categoryService.getCategoriesByAgencyId(agencyId);

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("❌ Controller Error (GetByAgency):", error.message);
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
  getCategoriesByServiceType,
  updateCategory,
  deleteCategory,
  getCategoriesByAgencyId,
};