const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/auth");

const {
  createCategoryHandler,
  deleteCategoryHandler,
  getAllCategoriesHandler,
  getCategoriesByTypeHandler,
  getCategoriesByAgencyHandler,
  updateCategoryHandler,
} = require("../controllers/categoryController");

// ── Public reads (citizen app) ────────────────────────────
router.get("/", getAllCategoriesHandler);
router.get("/type/:emergencyTypeId", getCategoriesByTypeHandler);
// must be before "/:id" to avoid route conflict
router.get("/by-agency/:agencyId", getCategoriesByAgencyHandler);

// ── System admin ──────────────────────────────────────────
router.post("/", verifyToken, adminOnly, createCategoryHandler);
router.put("/:id", verifyToken, adminOnly, updateCategoryHandler);
router.delete("/:id", verifyToken, adminOnly, deleteCategoryHandler);

module.exports = router;
