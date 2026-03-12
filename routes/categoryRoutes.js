const express = require("express");
const router = express.Router();

const {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
  getCategoriesByTypeHandler,
} = require("../controllers/categoryController");

router.post("/", createCategoryHandler);

router.delete("/:id", deleteCategoryHandler);

router.get("/", getAllCategoriesHandler);

router.get("/type/:emergencyTypeId", getCategoriesByTypeHandler);

module.exports = router;
