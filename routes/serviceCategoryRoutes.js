const express = require("express");
``;
const router = express.Router();
const categoryController = require("../controllers/serviceCategoryController");

router.post("/", categoryController.createCategory);

router.get("/", categoryController.getAllCategories);

router.get(
  "/type/:serviceTypeId",
  categoryController.getCategoriesByServiceType,
);

router.get("/:id", categoryController.getCategoryById);

router.put("/:id", categoryController.updateCategory);

router.get("/:id", categoryController.deleteCategory);

router.get("/agency/:agencyId", categoryController.getCategoriesByAgencyId);

module.exports = router;
