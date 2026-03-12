const express = require("express");
const router = express.Router();

const {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
} = require("../controllers/categoryController");

router.post("/", createCategoryHandler);

router.delete("/:id", deleteCategoryHandler);

router.get("/", getAllCategoriesHandler);

module.exports = router;
