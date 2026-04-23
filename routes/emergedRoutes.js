const express = require("express");
const router = express.Router();

const {
  mergeEmergencies,
  getEmergedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
} = require("../controllers/emergedController");

/**
 * 🔥 Merge emergencies into one group
 * POST /api/emerged/merge
 */
router.post("/merge", mergeEmergencies);

/**
 * 📥 Get all merged groups (one-row view)
 * GET /api/emerged
 */
router.get("/", getEmergedHandler);

/**
 * ✏️ Update merged group
 * PUT /api/emerged/:id
 */
router.put("/:id", updateEmergedHandler);

/**
 * 🗑️ Delete merged group + unlink emergencies
 * DELETE /api/emerged/:id
 */
router.delete("/:id", deleteEmergedHandler);

module.exports = router;
