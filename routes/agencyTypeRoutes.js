const express = require("express");
const router = express.Router();

const {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
  getAllAgencyTypesHandler,
  getAgentsByCreatorIdHandler,
} = require("../controllers/agencyTypeController");
const { verifyToken, adminOnly } = require("../middleware/auth");

// ── Public ────────────────────────────────────────────────
router.get("/", getAllAgencyTypesHandler);

// ── System admin. /my-agents must be declared before any /:id route. ──
router.get("/my-agents", verifyToken, adminOnly, getAgentsByCreatorIdHandler);

router.post("/", verifyToken, adminOnly, createAgencyTypeHandler);
router.put("/:id", verifyToken, adminOnly, updateAgencyTypeHandler);
router.delete("/:id", verifyToken, adminOnly, deleteAgencyTypeHandler);

module.exports = router;
