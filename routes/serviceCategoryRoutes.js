const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/serviceCategoryController");
const { verifyToken, adminOnly } = require("../middleware/auth");

// ── Public reads (citizen app / dashboards) ───────────────
router.get("/", categoryController.getAllCategories);
router.get(
  "/type/:serviceTypeId",
  categoryController.getCategoriesByServiceType,
);
router.get("/agency/:agencyId", categoryController.getCategoriesByAgencyId);
// Alias used by the mobile app
router.get("/by-agency/:agencyId", categoryController.getCategoriesByAgencyId);
router.get("/:id", categoryController.getCategoryById);

// ── System admin ──────────────────────────────────────────
router.post("/", verifyToken, adminOnly, categoryController.createCategory);
router.put("/:id", verifyToken, adminOnly, categoryController.updateCategory);
// was mistakenly registered as GET /:id (shadowed, never reachable)
router.delete("/:id", verifyToken, adminOnly, categoryController.deleteCategory);

module.exports = router;
