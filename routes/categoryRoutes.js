const express = require("express");
const router = express.Router();

const {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
  getCategoriesByTypeHandler,
  getCategoriesByAgencyHandler,
  updateCategoryHandler,
} = require("../controllers/categoryController");

router.post("/", createCategoryHandler);

router.delete("/:id", deleteCategoryHandler);

router.get("/", getAllCategoriesHandler);

router.get("/type/:emergencyTypeId", getCategoriesByTypeHandler);

// 👇 NEW — must be before "/:id" to avoid route conflict
router.get("/by-agency/:agencyId", getCategoriesByAgencyHandler);

router.put("/:id", updateCategoryHandler);

module.exports = router;