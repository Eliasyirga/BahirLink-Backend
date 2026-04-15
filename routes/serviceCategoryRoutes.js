const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/serviceCategoryController");

// ✅ CREATE CATEGORY
router.post("/", categoryController.createCategory);

// ✅ GET ALL CATEGORIES
router.get("/", categoryController.getAllCategories);

// ✅ GET BY SERVICE TYPE (Changed path to avoid collision)
// New URL: /api/serviceCategory/type/123
router.get(
  "/type/:serviceTypeId",
  categoryController.getCategoriesByServiceType,
);

// ✅ GET BY SPECIFIC CATEGORY ID
// URL: /api/serviceCategory/456
router.get("/:id", categoryController.getCategoryById);

// ✅ UPDATE CATEGORY
router.put("/:id", categoryController.updateCategory);

// ✅ DELETE CATEGORY
router.get("/:id", categoryController.deleteCategory);

module.exports = router;
